import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { district_id } = req.query
      
      if (!district_id) {
        return res.status(400).json({ message: 'district_id diperlukan' })
      }
      
      const villages = await query(
        'SELECT id, name FROM villages WHERE district_id = ? ORDER BY name ASC',
        [district_id]
      )
      return res.status(200).json({ villages })
    }
    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}