import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const invoices = await query<any>(
        `SELECT 
          id, invoice_number, vendor_name, description, 
          amount, invoice_date, due_date, payment_status
         FROM invoices_incoming
         ORDER BY invoice_date DESC`
      )

      return res.status(200).json({ invoices })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data invoice masuk' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}