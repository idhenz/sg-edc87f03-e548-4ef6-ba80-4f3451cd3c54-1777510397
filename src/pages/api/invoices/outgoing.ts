import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Auth check - extract user session from header
    const userSessionStr = req.headers['x-user-session'] as string
    if (!userSessionStr) {
      console.log('[INVOICES_API] No user session header')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    let user
    try {
      user = JSON.parse(userSessionStr)
      console.log('[INVOICES_API] User authenticated:', user.email, 'Role:', user.role)
    } catch (e) {
      console.log('[INVOICES_API] Failed to parse user session')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        // Get single invoice with payment info
        const invoice = await query(
          `SELECT 
            io.*,
            COALESCE(SUM(pc.amount), 0) as paid_amount,
            CASE
              WHEN COALESCE(SUM(pc.amount), 0) = 0 THEN 'pending'
              WHEN COALESCE(SUM(pc.amount), 0) >= io.total_amount THEN 'paid'
              ELSE 'partial'
            END as payment_status
          FROM invoices_outgoing io
          LEFT JOIN payment_confirmations pc ON pc.invoice_id = io.id AND pc.status = 'verified'
          WHERE io.id = ?
          GROUP BY io.id`,
          [id]
        ) as any[];

        return res.status(200).json(invoice[0] || null);
      }

      // Get all invoices with payment info
      const invoices = await query(
        `SELECT 
          io.*,
          COALESCE(SUM(pc.amount), 0) as paid_amount,
          CASE
            WHEN COALESCE(SUM(pc.amount), 0) = 0 THEN 'pending'
            WHEN COALESCE(SUM(pc.amount), 0) >= io.total_amount THEN 'paid'
            ELSE 'partial'
          END as payment_status
        FROM invoices_outgoing io
        LEFT JOIN payment_confirmations pc ON pc.invoice_id = io.id AND pc.status = 'verified'
        GROUP BY io.id
        ORDER BY io.created_at DESC`
      ) as any[];

      return res.status(200).json(invoices);
    }

    if (req.method === 'POST') {
      const { invoice_number, customer_name, package_name, amount, due_date, notes, status, invoice_type } = req.body;

      if (!customer_name || !amount || !due_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const amountNum = parseFloat(amount);
      const taxAmount = amountNum * 0.11;
      const totalAmount = amountNum + taxAmount;

      await query(
        `INSERT INTO invoices_outgoing 
         (invoice_number, customer_name, package_name, amount, tax, total_amount, due_date, status, invoice_type, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
        [invoice_number, customer_name, package_name || '', amountNum, taxAmount, totalAmount, due_date, status || 'pending', invoice_type || 'MRC']
      );

      return res.status(201).json({ message: 'Invoice berhasil ditambahkan' });
    }

    if (req.method === 'PUT') {
      const { id, customer_name, package_name, amount, due_date, status } = req.body;

      if (!id || !customer_name || !amount || !due_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const amountNum = parseFloat(amount);
      const taxAmount = amountNum * 0.11;
      const totalAmount = amountNum + taxAmount;

      await query(
        `UPDATE invoices_outgoing 
         SET customer_name = ?, package_name = ?, amount = ?, tax = ?, total_amount = ?, due_date = ?, status = ? 
         WHERE id = ?`,
        [customer_name, package_name || '', amountNum, taxAmount, totalAmount, due_date, status, id]
      );

      return res.status(200).json({ message: 'Invoice berhasil diperbarui' });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'ID tidak ditemukan' });
      }

      await query('DELETE FROM invoices_outgoing WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Invoice berhasil dihapus' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('[INVOICE_OUTGOING_ERROR]', error);
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    });
  }
}