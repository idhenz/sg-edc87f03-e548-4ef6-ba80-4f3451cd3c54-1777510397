import { google } from 'googleapis'

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

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: Buffer.from(fileBuffer),
      },
      fields: 'id, webViewLink, webContentLink',
    })

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    // Get direct download link
    const file = await drive.files.get({
      fileId: response.data.id!,
      fields: 'webContentLink',
    })

    return {
      fileId: response.data.id,
      fileUrl: file.data.webContentLink || response.data.webViewLink || '',
    }
  } catch (error: any) {
    console.error('Google Drive Upload Error:', error)
    throw new Error(`Failed to upload to Google Drive: ${error.message}`)
  }
}