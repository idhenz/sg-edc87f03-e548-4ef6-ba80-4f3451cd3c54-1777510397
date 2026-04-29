import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { uploadFile } from '@/lib/biznetStorage'

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
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 })
    
    const [fields, files] = await form.parse(req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const fileBuffer = fs.readFileSync(file.filepath)
    
    const fileUrl = await uploadFile(fileBuffer, file.originalFilename || 'logo', {
      folder: 'settings/logos',
      contentType: file.mimetype || 'image/png',
    })

    fs.unlinkSync(file.filepath)

    return res.status(200).json({ fileUrl })
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return res.status(500).json({ message: 'Failed to upload logo', error: error.message })
  }
}