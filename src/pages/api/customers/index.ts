import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const customers = await query('SELECT * FROM customers ORDER BY id DESC')
      return res.status(200).json({ customers })
    }

    if (req.method === 'POST') {
      const { name, email, phone, address, package_name, status } = req.body
      
      await query(
        'INSERT INTO customers (name, email, phone, address, package_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, address, package_name, status || 'active']
      )
      
      return res.status(201).json({ message: 'Pelanggan berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { name, email, phone, address, package_name, status } = req.body
      
      await query(
        'UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, package_name = ?, status = ? WHERE id = ?',
        [name, email, phone, address, package_name, status, id]
      )
      
      return res.status(200).json({ message: 'Data pelanggan berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      await query('DELETE FROM customers WHERE id = ?', [id])
      return res.status(200).json({ message: 'Pelanggan berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}