import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const { invoice_id } = req.query

    if (!invoice_id) {
      return res.status(400).json({ message: 'Invoice ID diperlukan' })
    }

    const payments = await query(
      `SELECT 
        pc.*,
        b.bank_name,
        b.account_number,
        b.account_holder as account_name,
        u.name as admin_name
       FROM payment_confirmations pc
       LEFT JOIN banks b ON pc.bank_id = b.id
       LEFT JOIN users u ON pc.confirmed_by = u.id
       WHERE pc.invoice_id = ?
       ORDER BY pc.payment_date DESC`,
      [invoice_id]
    )

    return res.status(200).json({ payments })
  } catch (error: any) {
    console.error('Payment History API Error:', error.message)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    })
  }
}