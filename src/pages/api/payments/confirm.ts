import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { uploadFile } from '@/lib/biznetStorage'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getAuthUser(req)
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
    const amount = Array.isArray(fields.amount) ? fields.amount[0] : fields.amount
    const payment_date = Array.isArray(fields.payment_date) ? fields.payment_date[0] : fields.payment_date
    const transfer_from = Array.isArray(fields.transfer_from) ? fields.transfer_from[0] : fields.transfer_from
    const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes

    if (!invoice_id || !bank_id || !amount || !payment_date) {
      return res.status(400).json({ message: 'Data tidak lengkap' })
    }

    // Upload bukti transfer
    let proofUrl = null
    const proofFile = Array.isArray(files.proof) ? files.proof[0] : files.proof
    
    if (proofFile) {
      const fileBuffer = fs.readFileSync(proofFile.filepath)
      const fileName = `payment-proof/${Date.now()}-${proofFile.originalFilename}`
      
      proofUrl = await uploadFile(fileBuffer, fileName, proofFile.mimetype || 'application/octet-stream')
    }

    // Insert payment confirmation - explicitly convert all optional values to null
    await query(
      `INSERT INTO payment_confirmations 
       (invoice_id, bank_id, amount, payment_date, transfer_from, proof_url, notes, confirmed_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice_id, 
        bank_id, 
        amount, 
        payment_date, 
        transfer_from ? transfer_from : null,
        proofUrl ? proofUrl : null,
        notes ? notes : null,
        user.id, 
        'verified'
      ]
    )

    // Update invoice status to paid
    await query(
      'UPDATE invoices_outgoing SET status = ? WHERE id = ?',
      ['paid', invoice_id]
    )

    return res.status(201).json({ 
      message: 'Konfirmasi pembayaran berhasil, status invoice diperbarui',
      proof_url: proofUrl 
    })
  } catch (error: any) {
    console.error('Payment Confirmation Error:', error.message)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    })
  }
}