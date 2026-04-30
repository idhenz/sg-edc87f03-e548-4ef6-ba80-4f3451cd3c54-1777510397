import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  console.log('[LOGIN] Attempting login for email:', email)

  if (!email || !password) {
    console.log('[LOGIN] Missing credentials')
    return res.status(400).json({ message: 'Email dan password harus diisi' })
  }

  try {
    console.log('[LOGIN] Querying database...')
    const users = await query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    )

    console.log('[LOGIN] Query result:', users.length, 'users found')

    if (users.length === 0) {
      console.log('[LOGIN] Invalid credentials')
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    const user = users[0]
    console.log('[LOGIN] Login successful for user:', user.email)

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('[LOGIN] Database error:', error.message)
    console.error('[LOGIN] Full error:', error)
    return res.status(500).json({ 
      message: 'Database error',
      detail: error.message 
    })
  }
}