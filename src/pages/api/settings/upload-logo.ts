import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logo')
    
    // Buat folder jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filename: (name, ext, part) => {
        return `logo-${Date.now()}${ext}`
      },
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Upload failed', error: err.message })
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      const fileName = path.basename(file.filepath)
      const fileUrl = `/uploads/logo/${fileName}`

      return res.status(200).json({ fileUrl })
    })
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to upload logo', error: error.message })
  }
}