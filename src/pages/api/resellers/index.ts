import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const resellers = await query('SELECT * FROM resellers ORDER BY id DESC');
      return res.status(200).json(resellers);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('[RESELLERS_ERROR]', error);
    return res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
}