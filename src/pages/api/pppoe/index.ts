import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = verifyToken(req, res);
    if (!user) return;

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
    `;

    const params: any[] = [];

    if (router_id) {
      sql += ' WHERE ps.router_id = ?';
      params.push(router_id);
    }

    if (available === 'true') {
      sql += params.length > 0 ? ' AND' : ' WHERE';
      sql += ' ps.customer_id IS NULL';
    }

    sql += ' ORDER BY ps.created_at DESC';

    const secrets = await query(sql, params);

    return res.status(200).json(secrets);
  } catch (error) {
    console.error('PPPoE API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}