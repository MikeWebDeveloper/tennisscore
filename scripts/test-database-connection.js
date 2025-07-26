const { Client, Databases } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value && !key.startsWith('#')) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }
}

loadEnvFile();

async function testDatabaseConnection() {
  console.log('🔍 Testing Appwrite Database Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = {
    'NEXT_PUBLIC_APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    'NEXT_PUBLIC_APPWRITE_PROJECT': process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
    'APPWRITE_API_KEY': process.env.APPWRITE_API_KEY ? 'SET' : 'NOT SET',
    'APPWRITE_DATABASE_ID': process.env.APPWRITE_DATABASE_ID,
    'APPWRITE_PLAYERS_COLLECTION_ID': process.env.APPWRITE_PLAYERS_COLLECTION_ID,
    'APPWRITE_MATCHES_COLLECTION_ID': process.env.APPWRITE_MATCHES_COLLECTION_ID,
    'APPWRITE_PROFILE_PICTURES_BUCKET_ID': process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID
  };
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
  });
  
  // Check for missing variables
  const missingVars = Object.entries(requiredVars).filter(([key, value]) => !value);
  if (missingVars.length > 0) {
    console.log('\n❌ Missing required environment variables:');
    missingVars.forEach(([key]) => console.log(`   - ${key}`));
    return;
  }
  
  try {
    // Create client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
      .setKey(process.env.APPWRITE_API_KEY);
    
    const databases = new Databases(client);
    
    console.log('\n🔗 Testing database connection...');
    
    // Test players collection
    console.log('📊 Testing players collection...');
    const playersResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID,
      [],
      1
    );
    console.log(`✅ Players collection accessible. Total documents: ${playersResponse.total}`);
    
    // Test matches collection
    console.log('🎾 Testing matches collection...');
    const matchesResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      [],
      1
    );
    console.log(`✅ Matches collection accessible. Total documents: ${matchesResponse.total}`);
    
    console.log('\n🎉 Database connection test successful!');
    
  } catch (error) {
    console.log('\n❌ Database connection failed:');
    console.log('Error:', error.message);
    
    if (error.code) {
      console.log('Error Code:', error.code);
    }
    
    if (error.type) {
      console.log('Error Type:', error.type);
    }
    
    if (error.response) {
      console.log('Response:', error.response);
    }
  }
}

testDatabaseConnection().catch(console.error); 