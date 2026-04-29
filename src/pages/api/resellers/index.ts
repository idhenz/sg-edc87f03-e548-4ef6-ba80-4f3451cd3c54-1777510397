import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const resellers = await query<any>(
        `SELECT 
          r.id, r.name, r.email, r.phone, r.company_name, r.status,
          COUNT(c.id) as total_customers
         FROM resellers r
         LEFT JOIN customers c ON c.reseller_id = r.id
         GROUP BY r.id
         ORDER BY r.created_at DESC`
      )

      return res.status(200).json({ resellers })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data reseller' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}