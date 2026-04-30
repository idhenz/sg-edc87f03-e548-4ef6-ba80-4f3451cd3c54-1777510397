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
      const { customer_id } = req.query

      if (!customer_id) {
        return res.status(400).json({ error: 'customer_id is required' })
      }

      const [rows] = await connection.execute(
        `SELECT a.*, v.name as vendor_name, p.name as product_name 
         FROM activations a
         LEFT JOIN vendors v ON a.vendor_id = v.id
         LEFT JOIN products p ON a.product_id = p.id
         WHERE a.customer_id = ?
         ORDER BY a.created_at DESC`,
        [customer_id]
      )

      return res.status(200).json(rows)
    }

    if (req.method === 'POST') {
      const {
        customer_id,
        product_id,
        vendor_id,
        action_type,
        activation_date,
        notes,
        otc_amount,
      } = req.body

      console.log('Received activation request:', req.body)

      if (!customer_id || !product_id || !vendor_id || !action_type || !activation_date) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['customer_id', 'product_id', 'vendor_id', 'action_type', 'activation_date'],
        })
      }

      if (action_type === 'activation') {
        // 1. Get customer data
        const [customerRows] = await connection.execute(
          'SELECT * FROM customers WHERE id = ?',
          [customer_id]
        )
        const customerData = (customerRows as any[])[0]

        // 2. Get product data
        const [productRows] = await connection.execute(
          'SELECT * FROM products WHERE id = ?',
          [product_id]
        )
        const productData = (productRows as any[])[0]

        // 3. Calculate prorated MRC
        const activationDay = new Date(activation_date).getDate()
        const daysInMonth = new Date(
          new Date(activation_date).getFullYear(),
          new Date(activation_date).getMonth() + 1,
          0
        ).getDate()
        const remainingDays = daysInMonth - activationDay + 1
        const proratedAmount = (productData.price / daysInMonth) * remainingDays

        console.log('Prorated calculation:', {
          activationDay,
          daysInMonth,
          remainingDays,
          monthlyPrice: productData.price,
          proratedAmount
        })

        // 4. Generate Invoice for MRC (Prorated)
        const invoiceNumberMRC = `INV-MRC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
        
        console.log('Creating MRC Invoice:', {
          invoiceNumber: invoiceNumberMRC,
          customerId: customer_id,
          customerName: customerData.name,
          packageName: `${productData.name} - MRC Bulan Pertama (Prorata)`,
          dueDate: activation_date,
          amount: proratedAmount,
          createdAt: currentDate
        })

        await connection.execute(
          `INSERT INTO invoices_outgoing 
           (invoice_number, customer_id, customer_name, package_name, due_date, amount, status, invoice_type, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 'MRC', ?)`,
          [
            invoiceNumberMRC,
            customer_id,
            customerData.name,
            `${productData.name} - MRC Bulan Pertama (Prorata)`,
            activation_date,
            proratedAmount,
            currentDate
          ]
        )

        // 5. Generate Invoice for OTC if amount > 0
        if (otc_amount && parseFloat(otc_amount.toString()) > 0) {
          const invoiceNumberOTC = `INV-OTC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000)}`
          
          console.log('Creating OTC Invoice:', {
            invoiceNumber: invoiceNumberOTC,
            customerId: customer_id,
            customerName: customerData.name,
            packageName: `${productData.name} - Biaya Instalasi`,
            dueDate: activation_date,
            amount: otc_amount,
            createdAt: currentDate
          })

          await connection.execute(
            `INSERT INTO invoices_outgoing 
             (invoice_number, customer_id, customer_name, package_name, due_date, amount, status, invoice_type, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending', 'OTC', ?)`,
            [
              invoiceNumberOTC,
              customer_id,
              customerData.name,
              `${productData.name} - Biaya Instalasi`,
              activation_date,
              otc_amount,
              currentDate
            ]
          )
        }

        // 6. Update customer status to active
        await connection.execute(
          'UPDATE customers SET status = ? WHERE id = ?',
          ['active', customer_id]
        )

        // 7. Insert activation record
        await connection.execute(
          `INSERT INTO activations 
           (customer_id, product_id, vendor_id, action_type, activation_date, notes, otc_amount) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [customer_id, product_id, vendor_id, action_type, activation_date, notes, otc_amount || 0]
        )

        return res.status(201).json({
          message: 'Activation successful',
          invoices: otc_amount && parseFloat(otc_amount.toString()) > 0 
            ? [invoiceNumberMRC, invoiceNumberOTC]
            : [invoiceNumberMRC]
        })
      }

      if (action_type === 'upgrade' || action_type === 'downgrade') {
        // Get product data
        const [productRows] = await connection.execute(
          'SELECT * FROM products WHERE id = ?',
          [product_id]
        )
        const productData = (productRows as any[])[0]

        // Update customer's product
        await connection.execute(
          'UPDATE customers SET product_id = ? WHERE id = ?',
          [product_id, customer_id]
        )

        // Insert activation record
        await connection.execute(
          `INSERT INTO activations 
           (customer_id, product_id, vendor_id, action_type, activation_date, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customer_id, product_id, vendor_id, action_type, activation_date, notes]
        )

        return res.status(201).json({
          message: `${action_type} successful`,
        })
      }

      if (action_type === 'suspend') {
        // Update customer status to suspended
        await connection.execute(
          'UPDATE customers SET status = ? WHERE id = ?',
          ['suspended', customer_id]
        )

        // Insert activation record
        await connection.execute(
          `INSERT INTO activations 
           (customer_id, product_id, vendor_id, action_type, activation_date, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customer_id, product_id, vendor_id, action_type, activation_date, notes]
        )

        return res.status(201).json({
          message: 'Suspension successful',
        })
      }

      if (action_type === 'reactivate') {
        // Update customer status to active
        await connection.execute(
          'UPDATE customers SET status = ? WHERE id = ?',
          ['active', customer_id]
        )

        // Insert activation record
        await connection.execute(
          `INSERT INTO activations 
           (customer_id, product_id, vendor_id, action_type, activation_date, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customer_id, product_id, vendor_id, action_type, activation_date, notes]
        )

        return res.status(201).json({
          message: 'Reactivation successful',
        })
      }

      if (action_type === 'terminate') {
        // Update customer status to inactive
        await connection.execute(
          'UPDATE customers SET status = ? WHERE id = ?',
          ['inactive', customer_id]
        )

        // Insert activation record
        await connection.execute(
          `INSERT INTO activations 
           (customer_id, product_id, vendor_id, action_type, activation_date, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [customer_id, product_id, vendor_id, action_type, activation_date, notes]
        )

        return res.status(201).json({
          message: 'Termination successful',
        })
      }

      return res.status(400).json({ error: 'Invalid action_type' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Activation API Error:', error)
    return res.status(500).json({
      message: 'Terjadi kesalahan pada server',
      error: error.message,
      details: error.stack,
    })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}