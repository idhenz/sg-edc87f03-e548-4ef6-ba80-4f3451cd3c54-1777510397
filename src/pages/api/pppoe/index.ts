import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { router_id, available } = req.query;

      let sql = `
        SELECT ps.*, r.name as router_name, c.name as customer_name
        FROM pppoe_secrets ps
        LEFT JOIN routers r ON ps.router_id = r.id
        LEFT JOIN customers c ON ps.customer_id = c.id
      `;
      const params: any[] = [];

      const conditions: string[] = [];

      if (router_id) {
        conditions.push('ps.router_id = ?');
        params.push(router_id);
      }

      if (available === 'true') {
        conditions.push('ps.customer_id IS NULL');
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY ps.username ASC';

      const secrets = await query(sql, params);
      return res.status(200).json(secrets);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('[PPPOE API] Error:', error.message);
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    });
  }
}