import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const { month, year, id } = req.query
      
      if (id) {
        const invoices = await query(
          `SELECT io.*, COALESCE(SUM(pc.amount), 0) as paid_amount 
           FROM invoices_outgoing io
           LEFT JOIN payment_confirmations pc ON io.id = pc.invoice_id
           WHERE io.id = ?
           GROUP BY io.id`,
          [id]
        )
        
        if (!invoices || invoices.length === 0) {
          return res.status(404).json({ message: 'Invoice tidak ditemukan' })
        }
        
        return res.status(200).json({ invoice: invoices[0] })
      }
      
      let sql = 'SELECT io.*, COALESCE(SUM(pc.amount), 0) as paid_amount FROM invoices_outgoing io LEFT JOIN payment_confirmations pc ON io.id = pc.invoice_id WHERE 1=1'
      const params: any[] = []
      
      if (month && year) {
        sql += ' AND MONTH(due_date) = ? AND YEAR(due_date) = ?'
        params.push(parseInt(month as string), parseInt(year as string))
      } else if (year) {
        sql += ' AND YEAR(due_date) = ?'
        params.push(parseInt(year as string))
      }
      
      sql += ` ORDER BY io.invoice_date DESC`;

      const invoices = await query(sql, params);
      return res.status(200).json(invoices || []);
    }

    if (req.method === 'POST') {
      const { invoice_number, customer_name, package_name, due_date, amount, status, invoice_type, created_at } = req.body

      if (!invoice_number || !customer_name || !package_name || !due_date || !amount) {
        return res.status(400).json({ message: 'Data invoice tidak lengkap' })
      }

      await query(
        `INSERT INTO invoices_outgoing 
         (invoice_number, customer_name, package_name, due_date, amount, status, invoice_type, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoice_number, customer_name, package_name, due_date, amount, status || 'pending', invoice_type, created_at || new Date().toISOString().split('T')[0]]
      )

      return res.status(201).json({ message: 'Invoice berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { invoice_number, customer_name, package_name, due_date, amount, status, invoice_type, created_at } = req.body

      if (!id) {
        return res.status(400).json({ message: 'ID invoice tidak ditemukan' })
      }

      await query(
        `UPDATE invoices_outgoing 
         SET invoice_number = ?, customer_name = ?, package_name = ?, due_date = ?, 
             amount = ?, status = ?, invoice_type = ?, created_at = ?
         WHERE id = ?`,
        [invoice_number, customer_name, package_name, due_date, amount, status, invoice_type, created_at, id]
      )

      return res.status(200).json({ message: 'Invoice berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ message: 'ID invoice tidak ditemukan' })
      }

      await query('DELETE FROM invoices_outgoing WHERE id = ?', [id])
      return res.status(200).json({ message: 'Invoice berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Invoice Outgoing API Error:', error.message)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    })
  }
}