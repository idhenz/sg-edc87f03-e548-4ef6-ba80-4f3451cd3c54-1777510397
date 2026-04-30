import { NextApiRequest, NextApiResponse } from 'next'
import cookie from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Auth check - Headers:', req.headers.cookie ? 'Cookie present' : 'No cookie')
    
    const cookies = cookie.parse(req.headers.cookie || '')
    const session = cookies.session

    if (!session) {
      console.log('Auth check - No session cookie found')
      return res.status(401).json({ message: 'Not authenticated' })
    }

    console.log('Auth check - Session cookie found, parsing...')
    const user = JSON.parse(session)
    console.log('Auth check - User authenticated:', user.email)
    
    return res.status(200).json({ user })
  } catch (error: any) {
    console.error('Auth check error:', error.message)
    return res.status(401).json({ message: 'Invalid session' })
  }
}