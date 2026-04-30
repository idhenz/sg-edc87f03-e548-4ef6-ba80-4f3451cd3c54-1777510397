import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { deleteFile } from '@/lib/biznetStorage'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  status: string
  customer_type: string
  province_id: number | null
  regency_id: number | null
  district_id: number | null
  village_id: number | null
  ktp_file: string | null
  npwp_file: string | null
  nib_file: string | null
  sertifikat_standar_file: string | null
  created_at: string
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { id, search } = req.query

  if (id) {
    const customer = await query(
      `SELECT c.*, 
        ps.username as pppoe_username,
        ps.is_active as pppoe_online,
        ps.remote_address as pppoe_ip,
        ps.uptime as pppoe_uptime,
        ps.last_login as pppoe_last_login
      FROM customers c
      LEFT JOIN pppoe_secrets ps ON c.pppoe_secret_id = ps.id
      WHERE c.id = ?`,
      [id]
    )
    return res.status(200).json(customer[0] || null)
  }

  let sql = `
    SELECT c.*,
      ps.username as pppoe_username,
      ps.is_active as pppoe_online
    FROM customers c
    LEFT JOIN pppoe_secrets ps ON c.pppoe_secret_id = ps.id
  `
  const params: any[] = []

  if (search) {
    sql += ' WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?'
    const searchPattern = `%${search}%`
    params.push(searchPattern, searchPattern, searchPattern)
  }

  sql += ' ORDER BY c.created_at DESC'

  const customers = await query(sql, params)
  return res.status(200).json(customers)
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  const {
    name, email, phone, address, province_id, regency_id, district_id, village_id,
    postal_code, installation_address, installation_province_id, installation_regency_id,
    installation_district_id, installation_village_id, installation_postal_code,
    status, notes, reseller_id, pppoe_secret_id
  } = req.body

  if (!name || !phone) {
    return res.status(400).json({ message: 'Nama dan telepon wajib diisi' })
  }

  if (pppoe_secret_id) {
    const existingPPPoE = await query(
      'SELECT id FROM customers WHERE pppoe_secret_id = ? AND id != ?',
      [pppoe_secret_id, 0]
    )
    if (existingPPPoE && existingPPPoE.length > 0) {
      return res.status(400).json({ message: 'Akun PPPoE ini sudah digunakan pelanggan lain' })
    }
  }

  const result = await query(
    `INSERT INTO customers (
      name, email, phone, address, province_id, regency_id, district_id, village_id,
      postal_code, installation_address, installation_province_id, installation_regency_id,
      installation_district_id, installation_village_id, installation_postal_code,
      status, notes, reseller_id, pppoe_secret_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, email, phone, address, province_id, regency_id, district_id, village_id,
      postal_code, installation_address, installation_province_id, installation_regency_id,
      installation_district_id, installation_village_id, installation_postal_code,
      status, notes, reseller_id, pppoe_secret_id, user.id
    ]
  )

  if (pppoe_secret_id) {
    await query('UPDATE pppoe_secrets SET customer_id = ? WHERE id = ?', [
      (result as any).insertId,
      pppoe_secret_id
    ])
  }

  return res.status(201).json({
    message: 'Pelanggan berhasil ditambahkan',
    id: (result as any).insertId
  })
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, user: any) {
  const {
    id, name, email, phone, address, province_id, regency_id, district_id, village_id,
    postal_code, installation_address, installation_province_id, installation_regency_id,
    installation_district_id, installation_village_id, installation_postal_code,
    status, notes, reseller_id, pppoe_secret_id
  } = req.body

  if (!id) {
    return res.status(400).json({ message: 'ID pelanggan diperlukan' })
  }

  if (pppoe_secret_id) {
    const existingPPPoE = await query(
      'SELECT id FROM customers WHERE pppoe_secret_id = ? AND id != ?',
      [pppoe_secret_id, id]
    )
    if (existingPPPoE && existingPPPoE.length > 0) {
      return res.status(400).json({ message: 'Akun PPPoE ini sudah digunakan pelanggan lain' })
    }
  }

  const oldCustomer = await query('SELECT pppoe_secret_id FROM customers WHERE id = ?', [id])
  const oldPPPoEId = oldCustomer[0]?.pppoe_secret_id

  await query(
    `UPDATE customers SET
      name = ?, email = ?, phone = ?, address = ?, province_id = ?, regency_id = ?,
      district_id = ?, village_id = ?, postal_code = ?, installation_address = ?,
      installation_province_id = ?, installation_regency_id = ?, installation_district_id = ?,
      installation_village_id = ?, installation_postal_code = ?, status = ?, notes = ?,
      reseller_id = ?, pppoe_secret_id = ?
    WHERE id = ?`,
    [
      name, email, phone, address, province_id, regency_id, district_id, village_id,
      postal_code, installation_address, installation_province_id, installation_regency_id,
      installation_district_id, installation_village_id, installation_postal_code,
      status, notes, reseller_id, pppoe_secret_id, id
    ]
  )

  if (oldPPPoEId && oldPPPoEId !== pppoe_secret_id) {
    await query('UPDATE pppoe_secrets SET customer_id = NULL WHERE id = ?', [oldPPPoEId])
  }

  if (pppoe_secret_id) {
    await query('UPDATE pppoe_secrets SET customer_id = ? WHERE id = ?', [id, pppoe_secret_id])
  }

  return res.status(200).json({ message: 'Pelanggan berhasil diperbarui' })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const user = getUserFromRequest(req)
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      await handleGet(req, res)
      return
    }

    if (req.method === 'POST') {
      await handlePost(req, res, user)
      return
    }

    if (req.method === 'PUT') {
      await handlePut(req, res, user)
      return
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error: any) {
    console.error('API Error:', error)
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message })
  }
}