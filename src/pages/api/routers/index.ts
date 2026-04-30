import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = verifyToken(req, res);
    if (!user) return;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, user);
      case 'PUT':
        return await handlePut(req, res, user);
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Router API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (id) {
    const router = await query(
      'SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at, updated_at FROM routers WHERE id = ?',
      [id]
    );
    return res.status(200).json(router[0] || null);
  }

  const routers = await query(
    'SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at, updated_at FROM routers ORDER BY created_at DESC'
  );
  return res.status(200).json(routers);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { name, ip_address, api_port, username, password, is_active } = req.body;

  if (!name || !ip_address || !username || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const result = await query(
    'INSERT INTO routers (name, ip_address, api_port, username, password, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, ip_address, api_port || 8728, username, password, is_active ?? true]
  );

  return res.status(201).json({
    message: 'Router created successfully',
    id: (result as any).insertId
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id, name, ip_address, api_port, username, password, is_active } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Router ID is required' });
  }

  let updateQuery = 'UPDATE routers SET name = ?, ip_address = ?, api_port = ?, username = ?, is_active = ?';
  let params = [name, ip_address, api_port, username, is_active, id];

  if (password) {
    updateQuery = 'UPDATE routers SET name = ?, ip_address = ?, api_port = ?, username = ?, password = ?, is_active = ?';
    params = [name, ip_address, api_port, username, password, is_active, id];
  }

  updateQuery += ' WHERE id = ?';

  await query(updateQuery, params);

  return res.status(200).json({ message: 'Router updated successfully' });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Router ID is required' });
  }

  await query('DELETE FROM routers WHERE id = ?', [id]);

  return res.status(200).json({ message: 'Router deleted successfully' });
}