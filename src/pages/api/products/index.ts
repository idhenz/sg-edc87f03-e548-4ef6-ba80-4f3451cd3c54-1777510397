import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const products = await query<any>(
        `SELECT 
          id, name, description, speed, price, status
         FROM products
         ORDER BY name ASC`
      )

      return res.status(200).json({ products })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data produk' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}