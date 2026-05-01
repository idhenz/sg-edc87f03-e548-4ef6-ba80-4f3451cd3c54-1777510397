import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import { uploadToBiznetStorage } from '@/lib/biznetStorage'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    
    const invoice_id = Array.isArray(fields.invoice_id) ? fields.invoice_id[0] : fields.invoice_id
    const bank_id = Array.isArray(fields.bank_id) ? fields.bank_id[0] : fields.bank_id
    const amountStr = Array.isArray(fields.amount) ? fields.amount[0] : fields.amount
    const payment_date = Array.isArray(fields.payment_date) ? fields.payment_date[0] : fields.payment_date
    const transfer_from = Array.isArray(fields.transfer_from) ? fields.transfer_from[0] : fields.transfer_from
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes

    if (!invoice_id || !bank_id || !amountStr || !payment_date) {
      return res.status(400).json({ message: 'Data tidak lengkap' })
    }

    const amount = parseFloat(amountStr)

    const invoiceResult = await query(
      'SELECT id, amount, tax_amount, total_amount, paid_amount FROM invoices_outgoing WHERE id = ?',
      [invoice_id]
    )

    if (!invoiceResult || invoiceResult.length === 0) {
      return res.status(404).json({ message: 'Invoice tidak ditemukan' })
    }

    const invoice = invoiceResult[0]
    const remaining = parseFloat(invoice.total_amount || invoice.amount) - parseFloat(invoice.paid_amount || '0')
    
    if (amount > remaining) {
      return res.status(400).json({ 
        message: `Nominal pembayaran (${amount.toLocaleString('id-ID')}) melebihi sisa tagihan (${remaining.toLocaleString('id-ID')})` 
      })
    }

    // Determine new status
    let newStatus = 'pending'
    if (amount >= remaining) {
      newStatus = 'paid'
    } else if (amount > 0) {
      newStatus = 'partial'
    }

    // Upload bukti transfer
    let proofUrl = null
    const proofFile = Array.isArray(files.proof) ? files.proof[0] : files.proof
    
    if (proofFile) {
      const fileBuffer = fs.readFileSync(proofFile.filepath)
      const fileName = `payment-proof/${Date.now()}-${proofFile.originalFilename}`
      
      proofUrl = await uploadFile(fileBuffer, fileName, proofFile.mimetype || 'application/octet-stream')
    }

    // Insert payment confirmation
    await query(
      `INSERT INTO payment_confirmations 
       (invoice_id, bank_id, amount, payment_date, transfer_from, notes, proof_url, status, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [invoice_id, bank_id, amount, payment_date, transfer_from, notes, proofUrl, user.id]
    )

    // Update invoice paid_amount
    const newPaidAmount = parseFloat(invoice.paid_amount || '0') + amount
    await query(
      'UPDATE invoices_outgoing SET paid_amount = ?, status = ? WHERE id = ?',
      [newPaidAmount, newPaidAmount >= parseFloat(invoice.total_amount || invoice.amount) ? 'paid' : 'partial', invoice_id]
    )

    return res.status(200).json({ 
      message: 'Konfirmasi pembayaran berhasil disimpan dan menunggu verifikasi',
      paid_amount: newPaidAmount
    })
  } catch (error: any) {
    console.error('[PAYMENT_CONFIRM_ERROR]', error)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    })
  }
}