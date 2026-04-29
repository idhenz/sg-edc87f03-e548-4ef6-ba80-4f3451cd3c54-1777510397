import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const [settings]: any = await query('SELECT * FROM settings WHERE id = 1')
      
      if (!settings) {
        // Jika belum ada data settings, return default
        return res.status(200).json({
          settings: {
            id: 1,
            isp_name: 'Nama ISP Anda',
            isp_address: '',
            isp_phone: '',
            tax_percentage: 11.00,
            logo_url: null,
            invoice_whatsapp: '',
            bank_name: '',
            bank_account_number: '',
            bank_account_name: '',
          }
        })
      }
      
      return res.status(200).json({ settings })
    }

    if (req.method === 'PUT') {
      const {
        isp_name,
        isp_address,
        isp_phone,
        tax_percentage,
        logo_url,
        invoice_whatsapp,
        bank_name,
        bank_account_number,
        bank_account_name,
      } = req.body

      // Cek apakah settings sudah ada
      const [existing]: any = await query('SELECT id FROM settings WHERE id = 1')

      if (existing) {
        // Update existing settings
        await query(
          `UPDATE settings SET 
            isp_name = ?, 
            isp_address = ?, 
            isp_phone = ?, 
            tax_percentage = ?, 
            logo_url = ?, 
            invoice_whatsapp = ?, 
            bank_name = ?, 
            bank_account_number = ?, 
            bank_account_name = ?
          WHERE id = 1`,
          [
            isp_name,
            isp_address || null,
            isp_phone || null,
            tax_percentage || 11.00,
            logo_url || null,
            invoice_whatsapp || null,
            bank_name || null,
            bank_account_number || null,
            bank_account_name || null,
          ]
        )
      } else {
        // Insert new settings
        await query(
          `INSERT INTO settings 
          (id, isp_name, isp_address, isp_phone, tax_percentage, logo_url, invoice_whatsapp, bank_name, bank_account_number, bank_account_name) 
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            isp_name,
            isp_address || null,
            isp_phone || null,
            tax_percentage || 11.00,
            logo_url || null,
            invoice_whatsapp || null,
            bank_name || null,
            bank_account_number || null,
            bank_account_name || null,
          ]
        )
      }

      return res.status(200).json({ message: 'Pengaturan berhasil disimpan' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}