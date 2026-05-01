import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { router_id, available } = req.query;

    let sql = `
      SELECT 
        ps.*,
        r.name as router_name,
        c.name as customer_name
      FROM pppoe_secrets ps
      LEFT JOIN routers r ON ps.router_id = r.id
      LEFT JOIN customers c ON ps.customer_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (router_id) {
      sql += ' AND ps.router_id = ?';
      params.push(router_id);
    }

    if (available === 'true') {
      sql += ' AND ps.customer_id IS NULL';
    }

    sql += ' ORDER BY ps.username ASC';

    const secrets = await query(sql, params);

    return res.status(200).json({ secrets });
  } catch (error: any) {
    console.error('PPPoE API Error:', error.message);
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    });
  }
}