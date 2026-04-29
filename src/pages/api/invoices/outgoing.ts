import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const invoices = await query<any>(
        `SELECT 
          io.id, io.invoice_number, c.name as customer_name,
          p.name as package_name, io.amount, io.invoice_date, 
          io.due_date, io.payment_status
         FROM invoices_outgoing io
         LEFT JOIN customers c ON io.customer_id = c.id
         LEFT JOIN products p ON io.package_id = p.id
         ORDER BY io.invoice_date DESC`
      )

      return res.status(200).json({ invoices })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data invoice keluar' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}