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
      const banks = await query('SELECT * FROM banks ORDER BY is_active DESC, bank_name ASC')
      return res.status(200).json(banks || [])
    }

    if (req.method === 'POST') {
      const { bank_name, account_number, account_holder, branch, is_active } = req.body

      if (!bank_name || !account_number || !account_holder) {
        return res.status(400).json({ message: 'Data bank tidak lengkap' })
      }

      await query(
        'INSERT INTO banks (bank_name, account_number, account_holder, branch, is_active) VALUES (?, ?, ?, ?, ?)',
        [bank_name, account_number, account_holder, branch || null, is_active !== undefined ? is_active : 1]
      )

      return res.status(201).json({ message: 'Bank berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { bank_name, account_number, account_holder, branch, is_active } = req.body

      if (!id) {
        return res.status(400).json({ message: 'ID bank tidak ditemukan' })
      }

      await query(
        'UPDATE banks SET bank_name = ?, account_number = ?, account_holder = ?, branch = ?, is_active = ? WHERE id = ?',
        [bank_name, account_number, account_holder, branch || null, is_active, id]
      )

      return res.status(200).json({ message: 'Bank berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ message: 'ID bank tidak ditemukan' })
      }

      await query('DELETE FROM banks WHERE id = ?', [id])
      return res.status(200).json({ message: 'Bank berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Banks API Error:', error.message)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    })
  }
}