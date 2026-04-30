import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import cookie from 'cookie'

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
      console.error('Missing database configuration:', {
        hasHost: !!process.env.DB_HOST,
        hasUser: !!process.env.DB_USER,
        hasDB: !!process.env.DB_NAME
      })
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

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }

    // Simplified cookie settings for Vercel
    const isProduction = process.env.NODE_ENV === 'production'
    
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    }

    // Only set sameSite in production
    if (isProduction) {
      cookieOptions.sameSite = 'lax'
    }

    res.setHeader('Set-Cookie', cookie.serialize('session', JSON.stringify(sessionData), cookieOptions))

    console.log('Login successful for:', email)
    return res.status(200).json({ user: sessionData })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}