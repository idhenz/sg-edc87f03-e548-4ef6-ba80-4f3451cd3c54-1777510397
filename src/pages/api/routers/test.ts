import type { NextApiRequest, NextApiResponse } from 'next'
import { RouterOSAPI } from 'node-routeros'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { ip_address, api_port, username, password } = req.body

  if (!ip_address || !username || !password) {
    return res.status(400).json({ success: false, message: 'IP, Username, Password harus diisi' })
  }

  try {
    console.log('[ROUTER TEST] Connecting to:', ip_address, 'port:', api_port || 8728)
    
    const conn = new RouterOSAPI({
      host: ip_address,
      user: username,
      password: password,
      port: api_port || 8728,
      timeout: 10
    })

    await conn.connect()
    const identity = await conn.write('/system/identity/print')
    await conn.close()

    console.log('[ROUTER TEST] Success, identity:', identity[0]?.name)
    
    return res.status(200).json({
      success: true,
      identity: identity[0]?.name || 'Unknown'
    })
  } catch (error: any) {
    console.error('[ROUTER TEST] Failed:', error.message)
    return res.status(200).json({
      success: false,
      message: error.message || 'Tidak dapat terhubung ke router'
    })
  }
}