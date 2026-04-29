import { google } from 'googleapis'

interface UploadFileParams {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}

export async function uploadToGoogleDrive({ fileBuffer, fileName, mimeType }: UploadFileParams) {
  try {
    // Parse private key from environment variable
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    
    if (!privateKey || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      throw new Error('Google Drive credentials are not configured')
    }

    // Authenticate with Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
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