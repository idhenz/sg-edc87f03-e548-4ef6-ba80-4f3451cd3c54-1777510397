import type { NextApiRequest, NextApiResponse } from 'next'
import { getConnection } from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let connection
  
  try {
    connection = await getConnection()

    if (req.method === 'GET') {
      const [rows] = await connection.execute(
        `SELECT id, isp_name, isp_address, isp_phone, isp_email, logo_url, 
                invoice_whatsapp, tax_percentage, bank_name, bank_account_number, bank_account_name
         FROM settings ORDER BY id DESC LIMIT 1`
      )

      const settings = (rows as any[])[0] || {}
      
      console.log('=== SETTINGS API GET ===')
      console.log('Settings found:', settings)
      console.log('ISP Name:', settings.isp_name)
      console.log('ISP Email:', settings.isp_email)
      console.log('Logo URL:', settings.logo_url)
      console.log('Tax Percentage:', settings.tax_percentage)
      console.log('========================')

      // Fetch banks from banks table
      const [banksRows] = await connection.execute(
        'SELECT id, bank_name, account_number, account_holder, is_active FROM banks WHERE is_active = 1 ORDER BY id ASC'
      )

      return res.status(200).json({
        settings: {
          ...settings,
          banks: banksRows
        }
      })
    }

    if (req.method === 'PUT') {
      const { 
        isp_name, 
        isp_address, 
        isp_phone, 
        isp_email,
        logo_url, 
        invoice_whatsapp, 
        tax_percentage,
        bank_name,
        bank_account_number,
        bank_account_name
      } = req.body

      console.log('=== UPDATING SETTINGS ===')
      console.log('Data received:', {
        isp_name,
        isp_email,
        isp_phone,
        logo_url,
        tax_percentage,
        bank_name,
        bank_account_number
      })
      console.log('=========================')

      const [existingRows] = await connection.execute(
        'SELECT id FROM settings LIMIT 1'
      )
      
      const existing = (existingRows as any[])[0]

      if (existing) {
        await connection.execute(
          `UPDATE settings 
           SET isp_name = ?, isp_address = ?, isp_phone = ?, isp_email = ?, 
               logo_url = ?, invoice_whatsapp = ?, tax_percentage = ?,
               bank_name = ?, bank_account_number = ?, bank_account_name = ?
           WHERE id = ?`,
          [isp_name, isp_address, isp_phone, isp_email, logo_url, invoice_whatsapp, tax_percentage, 
           bank_name, bank_account_number, bank_account_name, existing.id]
        )
        console.log('Settings updated successfully')
      } else {
        await connection.execute(
          `INSERT INTO settings 
           (isp_name, isp_address, isp_phone, isp_email, logo_url, invoice_whatsapp, tax_percentage,
            bank_name, bank_account_number, bank_account_name) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [isp_name, isp_address, isp_phone, isp_email, logo_url, invoice_whatsapp, tax_percentage,
           bank_name, bank_account_number, bank_account_name]
        )
        console.log('Settings created successfully')
      }

      return res.status(200).json({ message: 'Settings berhasil diperbarui' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Settings API Error:', error)
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message,
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}