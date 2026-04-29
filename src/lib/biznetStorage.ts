import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.BIZNETGIO_REGION || 'wjv-1',
  endpoint: process.env.BIZNETGIO_ENDPOINT || 'https://nos.wjv-1.neo.id',
  credentials: {
    accessKeyId: process.env.BIZNETGIO_ACCESS_KEY || '',
    secretAccessKey: process.env.BIZNETGIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.BIZNETGIO_BUCKET_NAME || 'dokumen'
const ENDPOINT = process.env.BIZNETGIO_ENDPOINT || 'https://nos.wjv-1.neo.id'

export interface UploadOptions {
  folder?: string
  fileName?: string
  contentType?: string
}

export async function uploadFile(
  fileBuffer: Buffer,
  originalFileName: string,
  options: UploadOptions = {}
): Promise<string> {
  const { folder = 'uploads', fileName, contentType } = options

  const timestamp = Date.now()
  const sanitizedName = fileName || originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const key = `${folder}/${timestamp}-${sanitizedName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType || 'application/octet-stream',
    ACL: 'public-read',
  })

  await s3Client.send(command)

  const publicUrl = `${ENDPOINT}/${BUCKET_NAME}/${key}`
  return publicUrl
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const key = fileUrl.split(`${BUCKET_NAME}/`)[1]
    if (!key) return

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting file from Biznet GIO:', error)
  }
}