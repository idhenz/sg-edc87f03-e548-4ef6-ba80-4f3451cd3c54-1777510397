import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('[API DEBUG] /api/routers - Method:', req.method);
    console.log('[API DEBUG] /api/routers - Headers:', JSON.stringify(req.headers, null, 2));
    
    const user = getUserFromToken(req);
    console.log('[API DEBUG] /api/routers - User from token:', user ? { id: user.id, username: user.username } : 'NULL');
    
    if (!user) {
      console.log('[API DEBUG] /api/routers - Authorization failed: No user found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      return handleGet(req, res);
    } else if (req.method === 'POST') {
      return handlePost(req, res, user);
    } else if (req.method === 'PUT') {
      return handlePut(req, res, user);
    } else if (req.method === 'DELETE') {
      return handleDelete(req, res);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[API DEBUG] /api/routers - Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API DEBUG] /api/routers - GET - Query:', req.query);
  const { id } = req.query;

  if (id) {
    const router = await query('SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at FROM routers WHERE id = ?', [id]);
    console.log('[API DEBUG] /api/routers - GET - Router by ID result:', router);
    return res.status(200).json(router[0] || null);
  }

  const routers = await query('SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at FROM routers ORDER BY created_at DESC');
  console.log('[API DEBUG] /api/routers - GET - All routers count:', routers.length);
  return res.status(200).json(routers);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  console.log('[API DEBUG] /api/routers - POST - Body:', { ...req.body, password: '***' });
  const { name, ip_address, api_port, username, password, is_active } = req.body;

  if (!name || !ip_address || !username || !password) {
    console.log('[API DEBUG] /api/routers - POST - Validation failed: Missing required fields');
    return res.status(400).json({ message: 'Name, IP Address, Username, and Password are required' });
  }

  const result = await query(
    'INSERT INTO routers (name, ip_address, api_port, username, password, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [name, ip_address, api_port || 8728, username, password, is_active !== false]
  );

  console.log('[API DEBUG] /api/routers - POST - Insert result:', result);
  return res.status(201).json({
    message: 'Router created successfully',
    id: (result as any).insertId
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  console.log('[API DEBUG] /api/routers - PUT - Body:', { ...req.body, password: req.body.password ? '***' : 'empty' });
  const { id, name, ip_address, api_port, username, password, is_active } = req.body;

  if (!id) {
    console.log('[API DEBUG] /api/routers - PUT - Validation failed: Missing ID');
    return res.status(400).json({ message: 'Router ID is required' });
  }

  let updateQuery = 'UPDATE routers SET name = ?, ip_address = ?, api_port = ?, username = ?, is_active = ?';
  let params = [name, ip_address, api_port || 8728, username, is_active !== false];

  if (password) {
    updateQuery += ', password = ?';
    params.push(password);
  }

  updateQuery += ' WHERE id = ?';
  params.push(id);

  const result = await query(updateQuery, params);
  console.log('[API DEBUG] /api/routers - PUT - Update result:', result);
  return res.status(200).json({ message: 'Router updated successfully' });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API DEBUG] /api/routers - DELETE - Query:', req.query);
  const { id } = req.query;

  if (!id) {
    console.log('[API DEBUG] /api/routers - DELETE - Validation failed: Missing ID');
    return res.status(400).json({ message: 'Router ID is required' });
  }

  const result = await query('DELETE FROM routers WHERE id = ?', [id]);
  console.log('[API DEBUG] /api/routers - DELETE - Delete result:', result);
  return res.status(200).json({ message: 'Router deleted successfully' });
}