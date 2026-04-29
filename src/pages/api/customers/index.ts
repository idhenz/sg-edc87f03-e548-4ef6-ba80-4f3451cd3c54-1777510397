import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const customers = await query<any>(
        `SELECT 
          c.id, c.name, c.email, c.phone, c.address, 
          p.name as package_name, c.status, c.created_at
         FROM customers c
         LEFT JOIN products p ON c.package_id = p.id
         ORDER BY c.created_at DESC`
      )

      return res.status(200).json({ customers })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data pelanggan' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}