import type { NextApiRequest, NextApiResponse } from 'next';
import { RouterOSAPI } from 'node-routeros';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = verifyToken(req, res);
    if (!user) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { ip_address, api_port, username, password } = req.body;

    if (!ip_address || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const conn = new RouterOSAPI({
      host: ip_address,
      user: username,
      password: password,
      port: api_port || 8728,
      timeout: 5
    });

    try {
      await conn.connect();
      const identity = await conn.write('/system/identity/print');
      await conn.close();

      return res.status(200).json({
        success: true,
        message: 'Koneksi berhasil',
        identity: identity[0]?.name || 'Unknown'
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: 'Koneksi gagal: ' + (error.message || 'Unknown error')
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}