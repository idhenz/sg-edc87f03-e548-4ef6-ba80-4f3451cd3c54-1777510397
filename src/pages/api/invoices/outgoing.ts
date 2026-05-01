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

      if (id) {
        const result = await query(
          'SELECT * FROM invoices_outgoing WHERE id = ?',
          [id]
        );
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: 'Invoice tidak ditemukan' });
        }
        
        return res.status(200).json(result[0]);
      }

      let sql = 'SELECT * FROM invoices_outgoing';
      const params: any[] = [];

      if (month && year) {
        sql += ' WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?';
        params.push(month, year);
      }

      sql += ' ORDER BY id DESC';

      const invoices = await query(sql, params);
      
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