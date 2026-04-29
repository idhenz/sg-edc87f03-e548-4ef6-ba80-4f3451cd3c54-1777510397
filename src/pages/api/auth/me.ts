import { NextApiRequest, NextApiResponse } from 'next'
import cookie from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || '')
    const session = cookies.session

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const user = JSON.parse(session)
    return res.status(200).json({ user })
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session' })
  }
}