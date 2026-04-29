import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { district_id } = req.query
      
      if (!district_id) {
        return res.status(400).json({ message: 'district_id diperlukan' })
      }
      
      // Relasi: ID Kelurahan berawalan dengan ID Kecamatan (misal: kecamatan "110101" -> kelurahan "1101012001", dll)
      const villages = await query(
        'SELECT id, nama as name FROM t_kelurahan WHERE id LIKE ? ORDER BY nama ASC',
        [`${district_id}%`]
      )
      return res.status(200).json({ villages })
    }
    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}