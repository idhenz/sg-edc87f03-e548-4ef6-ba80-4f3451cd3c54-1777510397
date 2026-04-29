import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const customers = await query(`
        SELECT 
          c.*,
          p.name as province_name,
          r.name as regency_name,
          d.name as district_name,
          v.name as village_name
        FROM customers c
        LEFT JOIN provinces p ON c.province_id = p.id
        LEFT JOIN regencies r ON c.regency_id = r.id
        LEFT JOIN districts d ON c.district_id = d.id
        LEFT JOIN villages v ON c.village_id = v.id
        ORDER BY c.id DESC
      `)
      return res.status(200).json({ customers })
    }

    if (req.method === 'POST') {
      const { 
        name, email, phone, address, package_name, status, customer_type,
        province_id, regency_id, district_id, village_id 
      } = req.body
      
      await query(
        `INSERT INTO customers 
        (name, email, phone, address, package_name, status, customer_type, province_id, regency_id, district_id, village_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, address, package_name, status || 'active', customer_type || 'personal', 
         province_id || null, regency_id || null, district_id || null, village_id || null]
      )
      
      return res.status(201).json({ message: 'Pelanggan berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { 
        name, email, phone, address, package_name, status, customer_type,
        province_id, regency_id, district_id, village_id 
      } = req.body
      
      await query(
        `UPDATE customers 
        SET name = ?, email = ?, phone = ?, address = ?, package_name = ?, status = ?, customer_type = ?,
            province_id = ?, regency_id = ?, district_id = ?, village_id = ?
        WHERE id = ?`,
        [name, email, phone, address, package_name, status, customer_type,
         province_id || null, regency_id || null, district_id || null, village_id || null, id]
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