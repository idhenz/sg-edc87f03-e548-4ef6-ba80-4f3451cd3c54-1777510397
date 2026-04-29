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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vendors')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filename: (name, ext) => {
        const timestamp = Date.now()
        return `mou_${timestamp}${ext}`
      },
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Upload error:', err)
        return res.status(500).json({ message: 'Upload failed', error: err.message })
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      const fileUrl = `/uploads/vendors/${path.basename(file.filepath)}`
      return res.status(200).json({ fileUrl })
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return res.status(500).json({ message: 'Failed to upload file', error: error.message })
  }
}