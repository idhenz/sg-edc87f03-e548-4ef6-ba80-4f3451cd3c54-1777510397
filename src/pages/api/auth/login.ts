import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { username, password } = req.body
  console.log('[LOGIN] Attempting login for:', username)

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password harus diisi' })
  }

  try {
    // Simple database check - no hashing for now
    const users = await query(
      'SELECT id, username, email, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    ) as any[]

    if (!users || users.length === 0) {
      console.log('[LOGIN] Invalid credentials for:', username)
      return res.status(401).json({ message: 'Username atau password salah' })
    }

    const user = users[0]
    console.log('[LOGIN] Success for:', user.username)

    // Return user data directly - no token needed
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('[LOGIN] Database error:', error)
    return res.status(500).json({ message: 'Database error - pastikan koneksi database benar' })
  }
}