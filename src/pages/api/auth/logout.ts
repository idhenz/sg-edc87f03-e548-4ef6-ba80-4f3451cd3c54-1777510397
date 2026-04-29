import { NextApiRequest, NextApiResponse } from 'next'
import cookie from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  res.setHeader('Set-Cookie', cookie.serialize('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1,
    sameSite: 'lax',
    path: '/',
  }))

  return res.status(200).json({ message: 'Logged out' })
}