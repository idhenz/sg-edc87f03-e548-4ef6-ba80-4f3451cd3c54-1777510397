import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Helper untuk menghapus file
function deleteFile(fileName: string | null) {
  if (!fileName) return
  
  try {
    const filePath = path.join(process.cwd(), 'public', fileName)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const customers = await query(`
        SELECT 
          c.*,
          p.nama as province_name,
          k.nama as regency_name,
          kec.nama as district_name,
          kel.nama as village_name,
          prod.name as current_product_name,
          prod.speed as current_product_speed,
          v.name as current_vendor_name
        FROM customers c
        LEFT JOIN t_provinsi p ON c.province_id = p.id
        LEFT JOIN t_kota k ON c.regency_id = k.id
        LEFT JOIN t_kecamatan kec ON c.district_id = kec.id
        LEFT JOIN t_kelurahan kel ON c.village_id = kel.id
        LEFT JOIN products prod ON c.current_product_id = prod.id
        LEFT JOIN vendors v ON c.current_vendor_id = v.id
        ORDER BY c.id DESC
      `)
      return res.status(200).json({ customers })
    }

    if (req.method === 'POST') {
      const { 
        name, email, phone, address, package_name, status, customer_type,
        province_id, regency_id, district_id, village_id,
        ktp_file, npwp_file, nib_file, sertifikat_standar_file
      } = req.body
      
      await query(
        `INSERT INTO customers 
        (name, email, phone, address, package_name, status, customer_type, 
         province_id, regency_id, district_id, village_id,
         ktp_file, npwp_file, nib_file, sertifikat_standar_file) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, email, phone, address, package_name, status || 'active', customer_type || 'personal', 
          province_id || null, regency_id || null, district_id || null, village_id || null,
          ktp_file || null, npwp_file || null, nib_file || null, sertifikat_standar_file || null
        ]
      )
      
      return res.status(201).json({ message: 'Pelanggan berhasil ditambahkan' })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      const { 
        name, email, phone, address, package_name, status, customer_type,
        province_id, regency_id, district_id, village_id,
        ktp_file, npwp_file, nib_file, sertifikat_standar_file,
        delete_ktp, delete_npwp, delete_nib, delete_sertifikat
      } = req.body
      
      // Ambil data lama untuk menghapus file yang diganti
      const [oldData]: any = await query('SELECT * FROM customers WHERE id = ?', [id])
      
      // Hapus file lama jika ada file baru atau diminta dihapus
      if (delete_ktp && oldData.ktp_file) deleteFile(oldData.ktp_file)
      if (delete_npwp && oldData.npwp_file) deleteFile(oldData.npwp_file)
      if (delete_nib && oldData.nib_file) deleteFile(oldData.nib_file)
      if (delete_sertifikat && oldData.sertifikat_standar_file) deleteFile(oldData.sertifikat_standar_file)
      
      if (ktp_file && ktp_file !== oldData.ktp_file && oldData.ktp_file) {
        deleteFile(oldData.ktp_file)
      }
      if (npwp_file && npwp_file !== oldData.npwp_file && oldData.npwp_file) {
        deleteFile(oldData.npwp_file)
      }
      if (nib_file && nib_file !== oldData.nib_file && oldData.nib_file) {
        deleteFile(oldData.nib_file)
      }
      if (sertifikat_standar_file && sertifikat_standar_file !== oldData.sertifikat_standar_file && oldData.sertifikat_standar_file) {
        deleteFile(oldData.sertifikat_standar_file)
      }
      
      await query(
        `UPDATE customers 
        SET name = ?, email = ?, phone = ?, address = ?, package_name = ?, status = ?, customer_type = ?,
            province_id = ?, regency_id = ?, district_id = ?, village_id = ?,
            ktp_file = ?, npwp_file = ?, nib_file = ?, sertifikat_standar_file = ?
        WHERE id = ?`,
        [
          name, email, phone, address, package_name, status, customer_type,
          province_id || null, regency_id || null, district_id || null, village_id || null,
          delete_ktp ? null : (ktp_file || oldData.ktp_file || null),
          delete_npwp ? null : (npwp_file || oldData.npwp_file || null),
          delete_nib ? null : (nib_file || oldData.nib_file || null),
          delete_sertifikat ? null : (sertifikat_standar_file || oldData.sertifikat_standar_file || null),
          id
        ]
      )
      
      return res.status(200).json({ message: 'Data pelanggan berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      
      // Ambil data untuk menghapus file terkait
      const [customer]: any = await query('SELECT * FROM customers WHERE id = ?', [id])
      
      if (customer) {
        // Hapus semua file terkait
        if (customer.ktp_file) deleteFile(customer.ktp_file)
        if (customer.npwp_file) deleteFile(customer.npwp_file)
        if (customer.nib_file) deleteFile(customer.nib_file)
        if (customer.sertifikat_standar_file) deleteFile(customer.sertifikat_standar_file)
      }
      
      await query('DELETE FROM customers WHERE id = ?', [id])
      return res.status(200).json({ message: 'Pelanggan berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}