import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const customers = await query(`
        SELECT 
          c.*,
          p.nama as province_name,
          k.nama as regency_name,
          kec.nama as district_name,
          kel.nama as village_name
        FROM customers c
        LEFT JOIN t_provinsi p ON c.province_id = p.id
        LEFT JOIN t_kota k ON c.regency_id = k.id
        LEFT JOIN t_kecamatan kec ON c.district_id = kec.id
        LEFT JOIN t_kelurahan kel ON c.village_id = kel.id
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