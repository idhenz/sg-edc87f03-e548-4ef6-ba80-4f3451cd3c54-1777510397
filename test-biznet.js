const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testBiznetStorage() {
  console.log('🔄 Testing Biznet GIO Object Storage Connection...\n');

  // 1. Check environment variables
  const accessKey = process.env.BIZNETGIO_ACCESS_KEY;
  const secretKey = process.env.BIZNETGIO_SECRET_KEY;
  const bucketName = process.env.BIZNETGIO_BUCKET_NAME;
  const endpoint = process.env.BIZNETGIO_ENDPOINT;
  const region = process.env.BIZNETGIO_REGION || 'wjv-1';

  console.log('📋 Environment Check:');
  console.log('  Access Key:', accessKey ? `${accessKey.substring(0, 8)}...` : '❌ Missing');
  console.log('  Secret Key:', secretKey ? '✓ Present' : '❌ Missing');
  console.log('  Bucket Name:', bucketName || '❌ Missing');
  console.log('  Endpoint:', endpoint || '❌ Missing');
  console.log('  Region:', region);
  console.log('');

  if (!accessKey || !secretKey || !bucketName || !endpoint) {
    console.log('❌ Missing required environment variables!');
    console.log('\nPlease add these to your .env.local:');
    console.log('  BIZNETGIO_ACCESS_KEY=your_access_key');
    console.log('  BIZNETGIO_SECRET_KEY=your_secret_key');
    console.log('  BIZNETGIO_BUCKET_NAME=your_bucket_name');
    console.log('  BIZNETGIO_ENDPOINT=https://nos.wjv-1.neo.id');
    console.log('  BIZNETGIO_REGION=wjv-1');
    process.exit(1);
  }

  try {
    // 2. Initialize S3 Client
    const s3Client = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for S3-compatible services
    });

    console.log('✅ S3 Client initialized');

    // 3. Test connection - List buckets
    console.log('\n🔍 Testing connection (List Buckets)...');
    const listCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listCommand);
    console.log('✅ Connection successful!');
    console.log('📦 Available buckets:', buckets.Buckets?.map(b => b.Name).join(', ') || 'None');

    // 4. Test upload - Upload a small test file
    console.log('\n📤 Testing file upload...');
    const testContent = `Test upload from ISP Management System at ${new Date().toISOString()}`;
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: 'test-files/test-upload.txt',
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });

    await s3Client.send(uploadCommand);
    console.log('✅ File uploaded successfully!');
    
    const publicUrl = `${endpoint}/${bucketName}/test-files/test-upload.txt`;
    console.log('🌐 Public URL:', publicUrl);

    console.log('\n✨ All tests passed! Biznet GIO Object Storage is ready.');
    console.log('\n🚀 You can now proceed with full implementation.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.$metadata) {
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

testBiznetStorage();