#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying environment variables to Vercel...');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Environment variables to deploy
const varsToSet = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT',
  'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
  'NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PLAYERS_COLLECTION_ID',
  'APPWRITE_MATCHES_COLLECTION_ID',
  'APPWRITE_PROFILE_PICTURES_BUCKET_ID',
  'SESSION_SECRET'
];

// Set each environment variable
for (const varName of varsToSet) {
  if (envVars[varName]) {
    try {
      console.log(`Setting ${varName}...`);
      
      // Use echo to pipe the value to vercel env add
      const command = `echo "${envVars[varName]}" | vercel env add ${varName} production`;
      execSync(command, { stdio: 'inherit' });
      
      console.log(`✅ ${varName} set successfully`);
    } catch (error) {
      console.error(`❌ Failed to set ${varName}:`, error.message);
    }
  } else {
    console.warn(`⚠️  ${varName} not found in .env.local`);
  }
}

console.log('\n🎉 Environment variables deployment complete!');
console.log('🔄 Triggering new deployment...');

// Trigger a new deployment
try {
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('✅ Deployment triggered successfully!');
} catch (error) {
  console.error('❌ Failed to trigger deployment:', error.message);
} 