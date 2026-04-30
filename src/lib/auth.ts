// Auth utility untuk protected API routes
import { NextApiRequest } from 'next'

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