import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { regency_id } = req.query
      
      if (!regency_id) {
        return res.status(400).json({ message: 'regency_id diperlukan' })
      }
      
      // Relasi: ID Kecamatan berawalan dengan ID Kota (misal: kota "1101" -> kecamatan "110101", "110102", dll)
      const districts = await query(
        'SELECT id, nama as name FROM t_kecamatan WHERE id LIKE ? ORDER BY nama ASC',
        [`${regency_id}%`]
      )
      return res.status(200).json({ districts })
    }
    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}