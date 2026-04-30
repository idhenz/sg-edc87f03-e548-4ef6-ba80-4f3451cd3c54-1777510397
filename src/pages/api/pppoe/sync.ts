import type { NextApiRequest, NextApiResponse } from 'next';
import { RouterOSAPI } from 'node-routeros';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = verifyToken(req, res);
    if (!user) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { router_id } = req.body;

    if (!router_id) {
      return res.status(400).json({ message: 'Router ID is required' });
    }

    const routerData = await query(
      'SELECT * FROM routers WHERE id = ? AND is_active = true',
      [router_id]
    );

    if (!routerData || routerData.length === 0) {
      return res.status(404).json({ message: 'Router not found or inactive' });
    }

    const router = routerData[0];

    const conn = new RouterOSAPI({
      host: router.ip_address,
      user: router.username,
      password: router.password,
      port: router.api_port,
      timeout: 10
    });

    try {
      await conn.connect();

      const secrets = await conn.write('/ppp/secret/print');
      const activeConnections = await conn.write('/ppp/active/print');

      await conn.close();

      const activeUsernames = new Set(
        activeConnections.map((conn: any) => conn.name)
      );

      let syncedCount = 0;
      let updatedCount = 0;

      for (const secret of secrets) {
        const isActive = activeUsernames.has(secret.name);
        const activeConn = activeConnections.find((ac: any) => ac.name === secret.name);

        const existingRecord = await query(
          'SELECT id FROM pppoe_secrets WHERE router_id = ? AND username = ?',
          [router_id, secret.name]
        );

        if (existingRecord && existingRecord.length > 0) {
          await query(
            `UPDATE pppoe_secrets SET 
              pppoe_id = ?,
              service = ?,
              profile = ?,
              local_address = ?,
              remote_address = ?,
              is_active = ?,
              last_login = ?,
              uptime = ?,
              caller_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
              secret['.id'],
              secret.service || 'pppoe',
              secret.profile || null,
              secret['local-address'] || null,
              secret['remote-address'] || null,
              isActive,
              isActive && activeConn ? new Date() : null,
              activeConn?.uptime || null,
              activeConn?.['caller-id'] || null,
              existingRecord[0].id
            ]
          );
          updatedCount++;
        } else {
          await query(
            `INSERT INTO pppoe_secrets 
              (router_id, pppoe_id, username, service, profile, local_address, remote_address, is_active, last_login, uptime, caller_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              router_id,
              secret['.id'],
              secret.name,
              secret.service || 'pppoe',
              secret.profile || null,
              secret['local-address'] || null,
              secret['remote-address'] || null,
              isActive,
              isActive && activeConn ? new Date() : null,
              activeConn?.uptime || null,
              activeConn?.['caller-id'] || null
            ]
          );
          syncedCount++;
        }
      }

      await query(
        'UPDATE routers SET last_sync = CURRENT_TIMESTAMP WHERE id = ?',
        [router_id]
      );

      return res.status(200).json({
        success: true,
        message: 'Sinkronisasi berhasil',
        synced: syncedCount,
        updated: updatedCount,
        total: secrets.length
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Sinkronisasi gagal: ' + (error.message || 'Unknown error')
      });
    }
  } catch (error) {
    console.error('Sync PPPoE error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}