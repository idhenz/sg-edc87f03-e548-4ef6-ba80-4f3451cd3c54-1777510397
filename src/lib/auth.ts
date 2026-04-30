// Auth utility untuk protected API routes
import { NextApiRequest } from 'next'
import jwt from 'jsonwebtoken'
import type { NextApiResponse } from 'next'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

interface JWTPayload {
  id: number
  username: string
  email: string
  role: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyTokenString(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function getUserFromToken(req: NextApiRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    return verifyTokenString(token)
  } catch (error) {
    return null
  }
}

export function verifyToken(req: NextApiRequest, res: NextApiResponse): JWTPayload | null {
  const user = getUserFromToken(req)
  
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  
  return user
}

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'reseller'
}

export function getAuthUser(req: NextApiRequest): AuthUser | null {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const userData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // Check if token is still valid (7 days)
    const tokenAge = Date.now() - userData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000
    
    if (tokenAge > maxAge) {
      return null
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    }
  } catch (error) {
    return null
  }
}

export function requireAuth(req: NextApiRequest): AuthUser {
  const user = getAuthUser(req)
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export function requireAdmin(req: NextApiRequest): AuthUser {
  const user = requireAuth(req)
  
  if (user.role !== 'admin') {
    throw new Error('Forbidden - Admin only')
  }
  
  return user
}