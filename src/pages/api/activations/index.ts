import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// Helper function untuk generate invoice number
const generateInvoiceNumber = (type: 'OTC' | 'MRC') => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${type}-${year}${month}-${random}`
}

// Helper function untuk hitung prorata MRC
const calculateProratedMRC = (activationDate: string, monthlyPrice: number) => {
  const activation = new Date(activationDate)
  const year = activation.getFullYear()
  const month = activation.getMonth()
  
  // Akhir bulan
  const lastDay = new Date(year, month + 1, 0).getDate()
  const activationDay = activation.getDate()
  
  // Sisa hari (termasuk hari aktivasi)
  const remainingDays = lastDay - activationDay + 1
  
  // Harga per hari
  const pricePerDay = monthlyPrice / lastDay
  
  // MRC Prorata
  const proratedAmount = Math.round(pricePerDay * remainingDays)
  
  return {
    totalDays: lastDay,
    remainingDays,
    pricePerDay: Math.round(pricePerDay),
    proratedAmount
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== ACTIVATION API CALLED ===')
  console.log('Method:', req.method)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  
  try {
    // Verify authentication
    const user = getAuthUser(req)
    if (!user) {
      console.error('Authentication failed - no valid token')
      return res.status(401).json({ message: 'Unauthorized - Please login again' })
    }
    console.log('Authenticated user:', user.email)

    if (req.method === 'POST') {
      const { customer_id, product_id, vendor_id, action_type, activation_date, notes, otc_amount } = req.body

      console.log('Parsed activation data:', { 
        customer_id, 
        product_id, 
        vendor_id, 
        action_type, 
        activation_date, 
        notes, 
        otc_amount 
      })

      if (!customer_id || !action_type || !activation_date) {
        console.error('Validation failed - missing required fields')
        return res.status(400).json({ message: 'Data tidak lengkap: customer_id, action_type, dan activation_date wajib diisi' })
      }

      // Insert ke tabel activations (log history)
      try {
        await query(
          'INSERT INTO activations (customer_id, product_id, vendor_id, action_type, activation_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [customer_id, product_id || null, vendor_id || null, action_type, activation_date, notes || null]
        )
        console.log('Activation record inserted successfully')
      } catch (error: any) {
        console.error('Error inserting activation:', error.message)
        throw new Error(`Gagal insert aktivasi: ${error.message}`)
      }

      // Update status di tabel customers
      try {
        if (action_type === 'termination') {
          await query(
            'UPDATE customers SET current_product_id = NULL, current_vendor_id = NULL, subscription_status = "inactive" WHERE id = ?',
            [customer_id]
          )
          console.log('Customer status updated to inactive')
        } else {
          await query(
            'UPDATE customers SET current_product_id = ?, current_vendor_id = ?, subscription_status = "active" WHERE id = ?',
            [product_id, vendor_id, customer_id]
          )
          console.log('Customer status updated to active')
        }
      } catch (error: any) {
        console.error('Error updating customer status:', error.message)
        throw new Error(`Gagal update status pelanggan: ${error.message}`)
      }

      // AUTO-GENERATE INVOICES (hanya untuk aktivasi baru)
      if (action_type === 'activation' && product_id) {
        try {
          // Ambil data customer dan product
          const customers = await query(
            'SELECT name FROM customers WHERE id = ?',
            [customer_id]
          )
          const products = await query(
            'SELECT name, price FROM products WHERE id = ?',
            [product_id]
          )

          console.log('Customer data:', customers)
          console.log('Product data:', products)

          if (customers.length > 0 && products.length > 0) {
            const customer = customers[0]
            const product = products[0]

            // 1. Generate Invoice OTC (One Time Charge)
            if (otc_amount && otc_amount > 0) {
              const otcInvoiceNumber = generateInvoiceNumber('OTC')
              const otcDueDate = new Date(activation_date)
              otcDueDate.setDate(otcDueDate.getDate() + 7)

              console.log('Creating OTC Invoice:', {
                invoice_number: otcInvoiceNumber,
                customer_name: customer.name,
                amount: otc_amount,
                due_date: otcDueDate.toISOString().split('T')[0]
              })

              // Coba insert dengan invoice_type, jika gagal coba tanpa invoice_type
              try {
                await query(
                  'INSERT INTO invoices_outgoing (invoice_number, customer_name, package_name, due_date, amount, status, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [
                    otcInvoiceNumber,
                    customer.name,
                    `${product.name} - Biaya Registrasi`,
                    otcDueDate.toISOString().split('T')[0],
                    otc_amount,
                    'pending',
                    'OTC'
                  ]
                )
                console.log('OTC Invoice created successfully')
              } catch (invoiceError: any) {
                console.error('Error creating OTC invoice with invoice_type:', invoiceError.message)
                // Fallback: insert tanpa kolom invoice_type
                await query(
                  'INSERT INTO invoices_outgoing (invoice_number, customer_name, package_name, due_date, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
                  [
                    otcInvoiceNumber,
                    customer.name,
                    `${product.name} - Biaya Registrasi (OTC)`,
                    otcDueDate.toISOString().split('T')[0],
                    otc_amount,
                    'pending'
                  ]
                )
                console.log('OTC Invoice created (without invoice_type column)')
              }
            }

            // 2. Generate Invoice MRC (Monthly Recurring Charge) - Prorata
            const mrcInvoiceNumber = generateInvoiceNumber('MRC')
            const prorata = calculateProratedMRC(activation_date, product.price)
            
            const activationDateObj = new Date(activation_date)
            const year = activationDateObj.getFullYear()
            const month = activationDateObj.getMonth()
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
            const mrcDueDate = new Date(year, month, lastDayOfMonth)

            console.log('Creating MRC Invoice:', {
              invoice_number: mrcInvoiceNumber,
              customer_name: customer.name,
              amount: prorata.proratedAmount,
              due_date: mrcDueDate.toISOString().split('T')[0],
              prorata: prorata
            })

            // Coba insert dengan invoice_type, jika gagal coba tanpa invoice_type
            try {
              await query(
                'INSERT INTO invoices_outgoing (invoice_number, customer_name, package_name, due_date, amount, status, invoice_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [
                  mrcInvoiceNumber,
                  customer.name,
                  `${product.name} - MRC Bulan Pertama (Prorata)`,
                  mrcDueDate.toISOString().split('T')[0],
                  prorata.proratedAmount,
                  'pending',
                  'MRC'
                ]
              )
              console.log('MRC Invoice created successfully')
            } catch (invoiceError: any) {
              console.error('Error creating MRC invoice with invoice_type:', invoiceError.message)
              // Fallback: insert tanpa kolom invoice_type
              await query(
                'INSERT INTO invoices_outgoing (invoice_number, customer_name, package_name, due_date, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
                [
                  mrcInvoiceNumber,
                  customer.name,
                  `${product.name} - MRC Bulan Pertama (Prorata)`,
                  mrcDueDate.toISOString().split('T')[0],
                  prorata.proratedAmount,
                  'pending'
                ]
              )
              console.log('MRC Invoice created (without invoice_type column)')
            }
          } else {
            console.warn('Customer or product not found for invoice generation')
          }
        } catch (invoiceError: any) {
          console.error('Error generating invoices:', invoiceError.message)
          // Jangan throw error, invoice generation adalah optional
          console.log('Continuing without invoice generation')
        }
      }

      return res.status(201).json({ message: 'Aktivasi berhasil direkam dan invoice telah dibuat' })
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
    console.error('Activation API Error:', error.message)
    console.error('Stack trace:', error.stack)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}