import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { query } from '@/lib/db';
import { uploadFile } from '@/lib/biznetStorage';

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
  console.log('[PAYMENT_API] ========== START ==========')
  console.log('[PAYMENT_API] Method:', req.method)
  console.log('[PAYMENT_API] Headers:', req.headers)
  
  if (req.method !== 'POST') {
    console.log('[PAYMENT_API] ERROR: Method not allowed')
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new IncomingForm({ 
    uploadDir: '/tmp', 
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024 // 5MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('[PAYMENT_API] Form parse error:', err);
      return res.status(500).json({ message: 'Failed to parse form data', error: err.message });
    }

    console.log('[PAYMENT_API] Fields received:', fields)
    console.log('[PAYMENT_API] Files received:', files)

    try {
      // Extract user session
      const userSessionStr = Array.isArray(fields.user_session) ? fields.user_session[0] : fields.user_session;
      if (!userSessionStr) {
        console.log('[PAYMENT_API] ERROR: No user session')
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const user = JSON.parse(userSessionStr);
      console.log('[PAYMENT_API] User authenticated:', user.email, 'Role:', user.role)

      // Extract form data
      const invoice_id = Array.isArray(fields.invoice_id) ? fields.invoice_id[0] : fields.invoice_id;
      const bank_id = Array.isArray(fields.bank_id) ? fields.bank_id[0] : fields.bank_id;
      const amount = Array.isArray(fields.amount) ? fields.amount[0] : fields.amount;
      const payment_date = Array.isArray(fields.payment_date) ? fields.payment_date[0] : fields.payment_date;
      const transfer_from = Array.isArray(fields.transfer_from) ? fields.transfer_from[0] : fields.transfer_from || '';
      const notes = Array.isArray(fields.notes) ? fields.notes[0] : fields.notes || '';
      const proof = Array.isArray(files.proof) ? files.proof[0] : files.proof;

      console.log('[PAYMENT_API] Extracted data:')
      console.log('[PAYMENT_API] - invoice_id:', invoice_id)
      console.log('[PAYMENT_API] - bank_id:', bank_id)
      console.log('[PAYMENT_API] - amount:', amount)
      console.log('[PAYMENT_API] - payment_date:', payment_date)
      console.log('[PAYMENT_API] - transfer_from:', transfer_from)
      console.log('[PAYMENT_API] - notes:', notes)
      console.log('[PAYMENT_API] - proof file:', proof?.originalFilename, proof?.mimetype)

      if (!invoice_id || !bank_id || !amount || !payment_date || !proof) {
        console.log('[PAYMENT_API] ERROR: Missing required fields')
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Upload proof to Biznet GIO Storage
      console.log('[PAYMENT_API] Uploading file to Biznet Storage...')
      let proofUrl = '';
      if (proof && proof.filepath) {
        const fileBuffer = fs.readFileSync(proof.filepath);
        const fileName = `payment-proofs/${Date.now()}-${proof.originalFilename}`;
        console.log('[PAYMENT_API] File buffer size:', fileBuffer.length)
        console.log('[PAYMENT_API] File name:', fileName)
        
        proofUrl = await uploadFile(fileBuffer, fileName, proof.mimetype || 'application/octet-stream');
        console.log('[PAYMENT_API] Upload success! URL:', proofUrl)
        
        // Delete temp file
        fs.unlinkSync(proof.filepath);
        console.log('[PAYMENT_API] Temp file deleted')
      }

      // Insert payment confirmation
      console.log('[PAYMENT_API] Inserting payment confirmation to database...')
      const insertResult = await query(
        `INSERT INTO payment_confirmations 
         (invoice_id, bank_id, amount, payment_date, transfer_from, notes, proof_url, confirmed_by, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')`,
        [invoice_id, bank_id, amount, payment_date, transfer_from, notes, proofUrl, user.id]
      ) as any;
      
      console.log('[PAYMENT_API] Insert result:', insertResult)

      // Update invoice paid_amount
      console.log('[PAYMENT_API] Updating invoice paid_amount...')
      const updateResult = await query(
        `UPDATE invoices_outgoing 
         SET paid_amount = COALESCE(paid_amount, 0) + ?, 
             status = IF(COALESCE(paid_amount, 0) + ? >= total_amount, 'paid', 'partial')
         WHERE id = ?`,
        [amount, amount, invoice_id]
      );
      
      console.log('[PAYMENT_API] Update result:', updateResult)
      console.log('[PAYMENT_API] SUCCESS! Payment confirmed')

      return res.status(200).json({ 
        message: 'Payment confirmed successfully',
        payment_id: insertResult.insertId,
        proof_url: proofUrl
      });

    } catch (error: any) {
      console.error('[PAYMENT_API] ERROR:', error);
      console.error('[PAYMENT_API] Error message:', error.message);
      console.error('[PAYMENT_API] Error stack:', error.stack);
      return res.status(500).json({ 
        message: 'Terjadi kesalahan pada server', 
        error: error.message 
      });
    } finally {
      console.log('[PAYMENT_API] ========== END ==========')
    }
  });
}