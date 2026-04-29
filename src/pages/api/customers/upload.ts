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

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'customers')
  
  // Buat folder jika belum ada
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filename: (name, ext, part) => {
      const timestamp = Date.now()
      const originalName = part.originalFilename || 'file'
      const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
      return `${timestamp}_${sanitized}`
    },
  })

  try {
    const [fields, files] = await form.parse(req)
    
    const uploadedFile = files.file?.[0]
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileName = path.basename(uploadedFile.filepath)
    const fileUrl = `/uploads/customers/${fileName}`

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl,
      fileName,
    })
  } catch (error: any) {
    console.error('Upload Error:', error)
    return res.status(500).json({ message: 'Failed to upload file', error: error.message })
  }
}