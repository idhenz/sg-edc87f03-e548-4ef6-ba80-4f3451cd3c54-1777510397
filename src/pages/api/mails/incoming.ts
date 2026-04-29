import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const mails = await query<any>(
        `SELECT 
          id, letter_number, sender, subject, 
          received_date, category, status
         FROM mails_incoming
         ORDER BY received_date DESC`
      )

      return res.status(200).json({ mails })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ message: 'Gagal mengambil data surat masuk' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}