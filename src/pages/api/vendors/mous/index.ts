import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { vendor_id } = req.query

      if (!vendor_id) {
        return res.status(400).json({ message: 'Vendor ID tidak ditemukan' })
      }

      const results = await query(`
        SELECT * FROM vendor_mous 
        WHERE vendor_id = ? 
        ORDER BY mou_date DESC, created_at DESC
      `, [vendor_id])

      return res.status(200).json({ mous: results })
    }

    if (req.method === 'POST') {
      const { vendor_id, mou_number, mou_date, start_date, end_date, mou_file } = req.body

      if (!vendor_id || !mou_number || !mou_date || !start_date || !end_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' })
      }

      const result: any = await query(
        'INSERT INTO vendor_mous (vendor_id, mou_number, mou_date, start_date, end_date, mou_file) VALUES (?, ?, ?, ?, ?, ?)',
        [vendor_id, mou_number, mou_date, start_date, end_date, mou_file || null]
      )

      return res.status(201).json({ 
        message: 'MOU berhasil ditambahkan',
        id: result.insertId 
      })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ message: 'ID MOU tidak ditemukan' })
      }

      // Get file path before delete
      const mouData: any = await query('SELECT mou_file FROM vendor_mous WHERE id = ?', [id])
      
      if (mouData.length > 0 && mouData[0].mou_file) {
        const filePath = path.join(process.cwd(), 'public', mouData[0].mou_file)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }

      await query('DELETE FROM vendor_mous WHERE id = ?', [id])
      return res.status(200).json({ message: 'MOU berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Vendor MOU API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}