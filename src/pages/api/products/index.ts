import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const products = await query('SELECT * FROM products ORDER BY id DESC')
      return res.status(200).json({ products })
    }

    if (req.method === 'POST') {
      const { name, speed, price, description } = req.body
      
      await query(
        'INSERT INTO products (name, speed, price, description) VALUES (?, ?, ?, ?)',
        [name, speed, price || 0, description || '']
      )
      
      return res.status(201).json({ message: 'Paket layanan berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { name, speed, price, description } = req.body
      
      await query(
        'UPDATE products SET name = ?, speed = ?, price = ?, description = ? WHERE id = ?',
        [name, speed, price, description, id]
      )
      
      return res.status(200).json({ message: 'Paket layanan berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      await query('DELETE FROM products WHERE id = ?', [id])
      return res.status(200).json({ message: 'Paket layanan berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}