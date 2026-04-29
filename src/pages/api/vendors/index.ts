import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const results = await query('SELECT * FROM vendors ORDER BY name ASC')
      return res.status(200).json({ vendors: results })
    }

    if (req.method === 'POST') {
      const { name, contact, address } = req.body
      
      if (!name) {
        return res.status(400).json({ message: 'Nama vendor wajib diisi' })
      }

      const result: any = await query(
        'INSERT INTO vendors (name, contact, address) VALUES (?, ?, ?)',
        [name, contact || null, address || null]
      )

      return res.status(201).json({ 
        message: 'Vendor berhasil ditambahkan',
        id: result.insertId 
      })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { name, contact, address } = req.body

      if (!id) {
        return res.status(400).json({ message: 'ID vendor tidak ditemukan' })
      }

      await query(
        'UPDATE vendors SET name = ?, contact = ?, address = ? WHERE id = ?',
        [name, contact || null, address || null, id]
      )

      return res.status(200).json({ message: 'Vendor berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ message: 'ID vendor tidak ditemukan' })
      }

      await query('DELETE FROM vendors WHERE id = ?', [id])
      return res.status(200).json({ message: 'Vendor berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Vendor API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}