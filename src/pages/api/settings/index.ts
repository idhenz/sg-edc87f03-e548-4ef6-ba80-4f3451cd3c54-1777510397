import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      try {
        const connection = await connectDB()
        const [rows] = await connection.execute(
          'SELECT id, isp_name, isp_address, isp_phone, isp_email, logo_url, invoice_footer, invoice_whatsapp, tax_percentage FROM settings ORDER BY id DESC LIMIT 1'
        )
        await connection.end()

        const settings = (rows as any[])[0] || {}
        
        console.log('=== SETTINGS API GET ===')
        console.log('Logo URL:', settings.logo_url)
        console.log('ISP Name:', settings.isp_name)
        console.log('========================')

        // Fetch banks
        const banksRes = await connectDB()
        const [banksRows] = await banksRes.execute(
          'SELECT id, bank_name, account_number, account_holder, is_active FROM banks WHERE is_active = 1 ORDER BY id ASC'
        )
        await banksRes.end()

        return res.status(200).json({
          settings: {
            ...settings,
            banks: banksRows
          }
        })
      } catch (error: any) {
        console.error('Settings API Error:', error)
        return res.status(500).json({
          message: 'Terjadi kesalahan pada server',
          error: error.message,
        })
      }
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