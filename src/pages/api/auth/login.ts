import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import crypto from 'crypto'

interface User {
  id: number
  name: string
  email: string
  password: string
  role: 'admin' | 'reseller'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' })
    }

    // Check database connection
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      console.error('Missing database configuration')
      return res.status(500).json({ message: 'Database configuration error. Please check environment variables.' })
    }

    const users = await query<User>(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    const user = users[0]

    if (user.password !== password) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

    // Generate simple token (base64 encoded user data)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    }

    const token = Buffer.from(JSON.stringify(userData)).toString('base64')

    console.log('Login successful for:', email)
    
    return res.status(200).json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token 
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}