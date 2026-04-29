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
    const documentType = Array.isArray(fields.type) ? fields.type[0] : fields.type

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    if (!documentType || !['ktp', 'npwp'].includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' })
    }

    const fileBuffer = fs.readFileSync(file.filepath)
    
    const fileUrl = await uploadFile(fileBuffer, file.originalFilename || 'document', {
      folder: `customers/${documentType}`,
      contentType: file.mimetype || 'image/jpeg',
    })

    fs.unlinkSync(file.filepath)

    return res.status(200).json({ fileUrl })
  } catch (error: any) {
    console.error('Document upload error:', error)
    return res.status(500).json({ message: 'Failed to upload document', error: error.message })
  }
}