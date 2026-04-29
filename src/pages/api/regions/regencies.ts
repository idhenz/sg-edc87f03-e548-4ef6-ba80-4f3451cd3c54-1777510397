import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { province_id } = req.query
      
      if (!province_id) {
        return res.status(400).json({ message: 'province_id diperlukan' })
      }
      
      const regencies = await query(
        'SELECT id, name FROM regencies WHERE province_id = ? ORDER BY name ASC',
        [province_id]
      )
      return res.status(200).json({ regencies })
    }
    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}