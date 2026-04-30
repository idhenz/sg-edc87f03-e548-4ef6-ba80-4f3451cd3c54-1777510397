import type { NextApiRequest, NextApiResponse } from 'next';
import { RouterOSAPI } from 'node-routeros';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

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
      console.log('[SYNC] Connecting to router:', router.name);
      await conn.connect();

      const secrets = await conn.write('/ppp/secret/print');
      const activeConnections = await conn.write('/ppp/active/print');

      await conn.close();
      console.log('[SYNC] Found', secrets.length, 'secrets and', activeConnections.length, 'active connections');

      const activeUsernames = new Set(
        activeConnections.map((conn: any) => conn.name)
      );

      let syncedCount = 0;
      let updatedCount = 0;

      for (const secret of secrets) {
        const isActive = activeUsernames.has(secret.name);
        const activeConn = activeConnections.find((ac: any) => ac.name === secret.name);
        
        const pppoeId = secret['.id'] || `*${Math.random().toString(36).substr(2, 9)}`;
        const username = secret.name;
        const service = secret.service || 'pppoe';
        const profile = secret.profile || null;
        const localAddress = secret['local-address'] || null;
        const remoteAddress = secret['remote-address'] || null;
        const lastLogin = isActive && activeConn ? new Date() : null;
        const uptime = activeConn?.uptime || null;
        const callerId = activeConn?.['caller-id'] || null;

        console.log('[SYNC] Processing username:', username, 'pppoe_id:', pppoeId);

        const existingRecord = await query(
          'SELECT id FROM pppoe_secrets WHERE router_id = ? AND username = ?',
          [router_id, username]
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
              pppoeId,
              service,
              profile,
              localAddress,
              remoteAddress,
              isActive,
              lastLogin,
              uptime,
              callerId,
              existingRecord[0].id
            ]
          );
          updatedCount++;
          console.log('[SYNC] Updated existing record for:', username);
        } else {
          await query(
            `INSERT INTO pppoe_secrets 
              (router_id, pppoe_id, username, service, profile, local_address, remote_address, is_active, last_login, uptime, caller_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              router_id,
              pppoeId,
              username,
              service,
              profile,
              localAddress,
              remoteAddress,
              isActive,
              lastLogin,
              uptime,
              callerId
            ]
          );
          syncedCount++;
          console.log('[SYNC] Inserted new record for:', username);
        }
      }

      await query(
        'UPDATE routers SET last_sync = CURRENT_TIMESTAMP WHERE id = ?',
        [router_id]
      );

      console.log('[SYNC] Complete - synced:', syncedCount, 'updated:', updatedCount);

      return res.status(200).json({
        success: true,
        message: 'Sinkronisasi berhasil',
        synced: syncedCount,
        updated: updatedCount,
        total: secrets.length
      });
    } catch (error: any) {
      console.error('[SYNC] MikroTik or DB error:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Sinkronisasi gagal: ' + (error.message || 'Tidak dapat terhubung ke router')
      });
    }
  } catch (error: any) {
    console.error('[SYNC] PPPoE error:', error.message);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}