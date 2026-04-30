import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== INVOICE OUTGOING API CALLED ===')
  console.log('Method:', req.method)
  
  try {
    // Verify authentication
    const user = getAuthUser(req)
    if (!user) {
      console.error('Authentication failed')
      return res.status(401).json({ message: 'Unauthorized' })
    }
    console.log('Authenticated user:', user.email)

    if (req.method === 'GET') {
      console.log('Fetching invoices outgoing...')
      const invoices = await query('SELECT * FROM invoices_outgoing ORDER BY created_at DESC')
      console.log('Fetched invoices count:', invoices.length)
      return res.status(200).json({ invoices })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('Invoice Outgoing API Error:', error.message)
    console.error('Stack:', error.stack)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan pada server', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}