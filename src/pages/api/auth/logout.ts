import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Token-based auth: logout is client-side only (clear localStorage)
  return res.status(200).json({ message: 'Logged out successfully' })
}