import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { query } from '@/lib/db';
import { uploadToBiznetStorage } from '@/lib/biznetStorage';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getUserFromFormData(fields: any) {
  if (fields.user_session && fields.user_session[0]) {
    try {
      return JSON.parse(fields.user_session[0]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const user = getUserFromFormData(fields);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const invoice_id = fields.invoice_id?.[0];
    const bank_id = fields.bank_id?.[0];
    const amount = fields.amount?.[0];
    const payment_date = fields.payment_date?.[0];
    const transfer_from = fields.transfer_from?.[0] || null;
    const notes = fields.notes?.[0] || null;
    const proofFile = files.proof?.[0];

    if (!invoice_id || !bank_id || !amount || !payment_date || !proofFile) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    // Upload proof to Biznet Storage
    let proofUrl = null;
    if (proofFile) {
      const fileBuffer = fs.readFileSync(proofFile.filepath);
      const fileName = `payment_proof_${Date.now()}_${proofFile.originalFilename}`;
      proofUrl = await uploadToBiznetStorage(fileBuffer, fileName, proofFile.mimetype || 'application/octet-stream');
      
      // Clean up temp file
      fs.unlinkSync(proofFile.filepath);
    }

    // Insert payment confirmation with correct column names
    await query(
      `INSERT INTO payment_confirmations 
       (invoice_id, bank_id, amount, payment_date, transfer_from, notes, proof_url, confirmed_by, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')`,
      [invoice_id, bank_id, amount, payment_date, transfer_from, notes, proofUrl, user.id]
    );

    // Update invoice paid_amount and status
    await query(
      `UPDATE invoices_outgoing 
       SET paid_amount = paid_amount + ?, 
           status = CASE 
             WHEN (paid_amount + ?) >= total_amount THEN 'paid'
             ELSE 'partial'
           END
       WHERE id = ?`,
      [amount, amount, invoice_id]
    );

    return res.status(200).json({ 
      message: 'Pembayaran berhasil dikonfirmasi',
      proof_url: proofUrl 
    });

  } catch (error: any) {
    console.error('[PAYMENT_CONFIRM_ERROR]', error);
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message 
    });
  }
}