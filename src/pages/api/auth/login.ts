import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { generateToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[LOGIN API DEBUG] Request method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  console.log('[LOGIN API DEBUG] Login attempt for username:', username);

  if (!username || !password) {
    console.log('[LOGIN API DEBUG] Missing credentials');
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const users = await query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    console.log('[LOGIN API DEBUG] Query result count:', users.length);

    if (users.length === 0) {
      console.log('[LOGIN API DEBUG] Invalid credentials');
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    console.log('[LOGIN API DEBUG] User found:', { id: user.id, username: user.username, role: user.role });

    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    console.log('[LOGIN API DEBUG] Token generated, length:', token.length);

    const responseData = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };

    console.log('[LOGIN API DEBUG] Sending response with token and user data');
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('[LOGIN API DEBUG] Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}