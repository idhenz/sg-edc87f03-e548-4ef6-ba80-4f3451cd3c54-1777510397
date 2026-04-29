import { google } from 'googleapis'
import { Readable } from 'stream'

interface UploadFileParams {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}

// Fix \n format in private key from environment variables
const getPrivateKey = () => {
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) return undefined
  
  // If the key is wrapped in quotes, remove them
  let formattedKey = key
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1)
  }
  
  // Replace literal '\n' string with actual newline characters
  return formattedKey.replace(/\\n/g, '\n')
}

export async function uploadToGoogleDrive({ fileBuffer, fileName, mimeType }: UploadFileParams) {
  try {
    console.log('Initializing Google Drive upload for:', fileName)
    
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const privateKey = getPrivateKey()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!clientEmail || !privateKey || !folderId) {
      console.error('Missing Google Drive credentials:', { 
        hasEmail: !!clientEmail, 
        hasKey: !!privateKey, 
        hasFolderId: !!folderId 
      })
      throw new Error('Kredensial Google Drive tidak lengkap. Periksa pengaturan Environment Anda.')
    }

    // Authenticate with Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    }

    const media = {
      mimeType,
      body: Readable.from(fileBuffer)
    }

    console.log('Uploading file to Google Drive...')
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true
    })

    console.log('File uploaded successfully:', file.data.id)

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      },
      supportsAllDrives: true
    })

    // Get direct download link
    const file = await drive.files.get({
      fileId: file.data.id!,
      fields: 'webContentLink',
    })

    return {
      fileId: file.data.id,
      fileUrl: file.data.webContentLink || file.data.webViewLink || '',
    }
  } catch (error: any) {
    console.error('Google Drive Upload Error:', error)
    throw new Error(`Failed to upload to Google Drive: ${error.message}`)
  }
}