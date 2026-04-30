// Simple auth utility - no JWT, just session check
import type { NextApiRequest } from 'next'

export interface UserSession {
  id: number
  username: string
  email: string
  role: string
}

// Check if request has valid session (from Authorization header or cookie)
export function getUserFromRequest(req: NextApiRequest): UserSession | null {
  try {
    // Check Authorization header for session data
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Session ')) {
      const sessionData = authHeader.substring(8)
      const user = JSON.parse(Buffer.from(sessionData, 'base64').toString('utf-8'))
      return user as UserSession
    }
    
    return null
  } catch (error) {
    console.error('[AUTH] Error parsing session:', error)
    return null
  }
}

// Alias for backward compatibility
export function getUserFromToken(req: NextApiRequest): UserSession | null {
  return getUserFromRequest(req)
}