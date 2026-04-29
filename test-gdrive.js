const { google } = require('googleapis')
require('dotenv').config({ path: '.env.local' })

// Fix private key format
const getPrivateKey = () => {
  const key = process.env.GOOGLE_PRIVATE_KEY
  if (!key) return undefined
  
  let formattedKey = key
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1)
  }
  
  return formattedKey.replace(/\\n/g, '\n')
}

async function testGoogleDrive() {
  console.log('\n🔍 Testing Google Drive Connection...\n')
  
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = getPrivateKey()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  // Check environment variables
  console.log('📋 Environment Variables Status:')
  console.log(`✓ GOOGLE_CLIENT_EMAIL: ${clientEmail ? '✅ Set' : '❌ Not Set'}`)
  console.log(`✓ GOOGLE_PRIVATE_KEY: ${privateKey ? '✅ Set (' + privateKey.length + ' chars)' : '❌ Not Set'}`)
  console.log(`✓ GOOGLE_DRIVE_FOLDER_ID: ${folderId ? '✅ Set' : '❌ Not Set'}`)
  
  if (!clientEmail || !privateKey || !folderId) {
    console.error('\n❌ Missing credentials! Please check your .env.local file.\n')
    return
  }

  try {
    // Test authentication
    console.log('\n🔐 Authenticating with Google...')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })
    console.log('✅ Authentication successful!')

    // Test folder access
    console.log('\n📁 Accessing folder...')
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, createdTime)',
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    })

    if (response.data.files && response.data.files.length > 0) {
      response.data.files.forEach((file, index) => {
        console.log(`\n${index + 1}. ${file.name}`)
        console.log(`   Type: ${file.mimeType}`)
        console.log(`   Created: ${file.createdTime}`)
        console.log(`   Link: ${file.webViewLink}`)
      })
    } else {
      console.log('   (Folder is empty)')
    }

    console.log('\n✅ Google Drive connection test SUCCESSFUL!\n')
    console.log('🎉 You can now upload files from your ISP application.\n')

  } catch (error) {
    console.error('\n❌ Google Drive test FAILED!')
    console.error('Error:', error.message)
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 Tip: Your private key format might be incorrect.')
      console.error('   Make sure the private key includes:')
      console.error('   -----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----')
    } else if (error.message.includes('File not found')) {
      console.error('\n💡 Tip: The folder ID might be wrong, or the service account')
      console.error('   does not have access to the folder.')
      console.error('   Share the folder with:', clientEmail)
    }
    console.error()
  }
}

testGoogleDrive()