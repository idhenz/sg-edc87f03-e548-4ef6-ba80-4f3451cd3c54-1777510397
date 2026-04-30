import type { NextApiRequest } from 'next'

export interface UserSession {
  id: number
  name: string
  email: string
  role: string
}

export function getUserFromRequest(req: NextApiRequest): UserSession | null {
  try {
    const sessionHeader = req.headers['x-user-session']
    
    if (!sessionHeader || typeof sessionHeader !== 'string') {
      console.log('[AUTH] No session header found')
      return null
    }

    const user = JSON.parse(sessionHeader)
    
    if (!user.id || !user.email) {
      console.log('[AUTH] Invalid session data')
      return null
    }

    console.log('[AUTH] User authenticated:', user.email, 'role:', user.role)
    return user
  } catch (error) {
    console.error('[AUTH] Error parsing session:', error)
    return null
  }
}