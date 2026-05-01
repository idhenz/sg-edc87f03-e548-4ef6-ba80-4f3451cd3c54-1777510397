import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { id, month, year } = req.query;

      // Get single invoice by ID
      if (id) {
        const result = await query(
          `SELECT io.*, c.name as customer_name, p.name as product_name 
           FROM invoices_outgoing io
           LEFT JOIN customers c ON io.customer_id = c.id
           LEFT JOIN products p ON io.product_id = p.id
           WHERE io.id = ?`,
          [id]
        );
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: 'Invoice tidak ditemukan' });
        }
        
        return res.status(200).json(result[0]);
      }

      // Get all invoices with optional month/year filter
      let sql = `SELECT io.*, c.name as customer_name, p.name as product_name 
                 FROM invoices_outgoing io
                 LEFT JOIN customers c ON io.customer_id = c.id
                 LEFT JOIN products p ON io.product_id = p.id`;
      
      const params: any[] = [];

      if (month && year) {
        sql += ` WHERE MONTH(io.created_at) = ? AND YEAR(io.created_at) = ?`;
        params.push(month, year);
      }

      sql += ` ORDER BY io.id DESC`;

      const invoices = await query(sql, params);
      
      // ALWAYS return array
      return res.status(200).json(Array.isArray(invoices) ? invoices : []);
    }

    if (req.method === 'POST') {
      const { customer_id, product_id, amount, invoice_date, due_date, notes, status } = req.body;

      if (!customer_id || !product_id || !amount || !invoice_date || !due_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const amountNum = parseFloat(amount);
      const taxAmount = amountNum * 0.11;
      const totalAmount = amountNum + taxAmount;

      await query(
        `INSERT INTO invoices_outgoing 
         (customer_id, product_id, amount, tax_amount, total_amount, invoice_date, due_date, notes, status, paid_amount, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [customer_id, product_id, amountNum, taxAmount, totalAmount, invoice_date, due_date, notes || '', status || 'pending', user.id]
      );

      return res.status(201).json({ message: 'Invoice berhasil ditambahkan' });
    }

    if (req.method === 'PUT') {
      const { id, customer_id, product_id, amount, invoice_date, due_date, notes, status } = req.body;

      if (!id || !customer_id || !product_id || !amount || !invoice_date || !due_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' });
      }

      const amountNum = parseFloat(amount);
      const taxAmount = amountNum * 0.11;
      const totalAmount = amountNum + taxAmount;

      await query(
        `UPDATE invoices_outgoing 
         SET customer_id = ?, product_id = ?, amount = ?, tax_amount = ?, total_amount = ?, 
             invoice_date = ?, due_date = ?, notes = ?, status = ? 
         WHERE id = ?`,
        [customer_id, product_id, amountNum, taxAmount, totalAmount, invoice_date, due_date, notes || '', status, id]
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