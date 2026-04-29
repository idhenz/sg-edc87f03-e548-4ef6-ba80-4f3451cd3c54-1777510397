import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { customer_id, product_id, vendor_id, action_type, activation_date, notes } = req.body

      if (!customer_id || !action_type || !activation_date) {
        return res.status(400).json({ message: 'Data tidak lengkap' })
      }

      // Insert ke tabel activations (log history)
      await query(
        'INSERT INTO activations (customer_id, product_id, vendor_id, action_type, activation_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_id, product_id || null, vendor_id || null, action_type, activation_date, notes || null]
      )

      // Update status di tabel customers
      if (action_type === 'termination') {
        // Jika berhenti berlangganan, set product & vendor ke NULL, status inactive
        await query(
          'UPDATE customers SET current_product_id = NULL, current_vendor_id = NULL, subscription_status = "inactive" WHERE id = ?',
          [customer_id]
        )
      } else {
        // Aktivasi, upgrade, atau downgrade -> update product & vendor, status active
        await query(
          'UPDATE customers SET current_product_id = ?, current_vendor_id = ?, subscription_status = "active" WHERE id = ?',
          [product_id, vendor_id, customer_id]
        )
      }

      return res.status(201).json({ message: 'Aktivasi berhasil direkam' })
    }

    if (req.method === 'GET') {
      const { customer_id } = req.query

      if (!customer_id) {
        return res.status(400).json({ message: 'Customer ID tidak ditemukan' })
      }

      const results = await query(`
        SELECT 
          a.id,
          a.action_type,
          a.activation_date,
          a.notes,
          a.created_at,
          p.name as product_name,
          p.speed as product_speed,
          p.price as product_price,
          v.name as vendor_name
        FROM activations a
        LEFT JOIN products p ON a.product_id = p.id
        LEFT JOIN vendors v ON a.vendor_id = v.id
        WHERE a.customer_id = ?
        ORDER BY a.activation_date DESC, a.created_at DESC
      `, [customer_id])

      return res.status(200).json({ history: results })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Activation API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}