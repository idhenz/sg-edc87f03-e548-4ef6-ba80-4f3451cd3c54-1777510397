import type { NextApiRequest, NextApiResponse } from 'next';
import { RouterOSAPI } from 'node-routeros';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[API DEBUG] /api/routers/test - Method:', req.method);
  console.log('[API DEBUG] /api/routers/test - Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ip_address, api_port, username, password } = req.body;
  console.log('[API DEBUG] /api/routers/test - Request body:', {
    ip_address,
    api_port,
    username,
    password: '***'
  });

  if (!ip_address || !username || !password) {
    console.log('[API DEBUG] /api/routers/test - Validation failed: Missing fields');
    return res.status(400).json({ message: 'IP Address, Username, and Password are required' });
  }

  try {
    console.log('[API DEBUG] /api/routers/test - Attempting connection to MikroTik...');
    const conn = new RouterOSAPI({
      host: ip_address,
      user: username,
      password: password,
      port: api_port || 8728,
      timeout: 5
    });

    await conn.connect();
    console.log('[API DEBUG] /api/routers/test - Connected successfully');

    const identity = await conn.write('/system/identity/print');
    console.log('[API DEBUG] /api/routers/test - Identity response:', identity);

    await conn.close();
    console.log('[API DEBUG] /api/routers/test - Connection closed');

    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      identity: identity[0]?.name || 'Unknown'
    });
  } catch (error: any) {
    console.error('[API DEBUG] /api/routers/test - Connection error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Cannot connect to router'
    });
  }
}