import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check auth
  const user = getUserFromRequest(req)
  if (!user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' })
  }

  try {
    if (req.method === 'GET') {
      const { id } = req.query
      
      if (id) {
        const result = await query('SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at FROM routers WHERE id = ?', [id])
        return res.status(200).json((result as any[])[0] || null)
      }
      
      const routers = await query('SELECT id, name, ip_address, api_port, username, is_active, last_sync, created_at FROM routers ORDER BY created_at DESC')
      return res.status(200).json(routers)
    }

    if (req.method === 'POST') {
      const { name, ip_address, api_port, username, password, is_active } = req.body

      if (!name || !ip_address || !username || !password) {
        return res.status(400).json({ message: 'Nama, IP, Username, Password wajib diisi' })
      }

      const result = await query(
        'INSERT INTO routers (name, ip_address, api_port, username, password, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [name, ip_address, api_port || 8728, username, password, is_active !== false]
      )

      return res.status(201).json({ message: 'Router berhasil ditambahkan', id: (result as any).insertId })
    }

    if (req.method === 'PUT') {
      const { id, name, ip_address, api_port, username, password, is_active } = req.body

      if (!id) {
        return res.status(400).json({ message: 'ID router diperlukan' })
      }

      let sql = 'UPDATE routers SET name = ?, ip_address = ?, api_port = ?, username = ?, is_active = ?'
      const params: any[] = [name, ip_address, api_port || 8728, username, is_active !== false]

      if (password) {
        sql += ', password = ?'
        params.push(password)
      }

      sql += ' WHERE id = ?'
      params.push(id)

      await query(sql, params)
      return res.status(200).json({ message: 'Router berhasil diperbarui' })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ message: 'ID router diperlukan' })
      }

      await query('DELETE FROM routers WHERE id = ?', [id])
      return res.status(200).json({ message: 'Router berhasil dihapus' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('[ROUTERS API] Error:', error)
    return res.status(500).json({ message: 'Database error' })
  }
}