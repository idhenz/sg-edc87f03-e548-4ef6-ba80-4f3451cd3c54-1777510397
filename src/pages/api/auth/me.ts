import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const token = authHeader.substring(7)
    
    // Decode token
    const userData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    
    // Check if token is still valid (7 days)
    const tokenAge = Date.now() - userData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    
    if (tokenAge > maxAge) {
      return res.status(401).json({ message: 'Token expired' })
    }

    return res.status(200).json({ 
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    })
  } catch (error: any) {
    console.error('Auth check error:', error.message)
    return res.status(401).json({ message: 'Invalid token' })
  }
}