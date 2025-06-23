#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Pushing environment variables to Vercel...');

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      const value = trimmedLine.substring(equalIndex + 1).trim();
      if (key && value) {
        envVars[key] = value;
      }
    }
  }
});

// List of required environment variables for Vercel
const requiredVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT',
  'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
  'NEXT_PUBLIC_APPWRITE_PLAYERS_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID',
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PLAYERS_COLLECTION_ID',
  'APPWRITE_MATCHES_COLLECTION_ID',
  'APPWRITE_PROFILE_PICTURES_BUCKET_ID',
  'SESSION_SECRET'
];

console.log(`📋 Found ${Object.keys(envVars).length} environment variables in .env.local`);
console.log(`🎯 Setting ${requiredVars.length} required variables in Vercel...\n`);

let successCount = 0;
let errorCount = 0;

// Set each environment variable in Vercel
for (const varName of requiredVars) {
  if (envVars[varName]) {
    try {
      console.log(`⏳ Setting ${varName}...`);
      
      // Escape special characters for shell
      const escapedValue = envVars[varName].replace(/"/g, '\\"');
      
      // Use vercel env add command
      const command = `echo "${escapedValue}" | vercel env add ${varName} production --force`;
      execSync(command, { stdio: 'pipe' });
      
      console.log(`✅ ${varName} set successfully`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to set ${varName}:`, error.message);
      errorCount++;
    }
  } else {
    console.warn(`⚠️  ${varName} not found in .env.local`);
    errorCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`✅ Successfully set: ${successCount} variables`);
console.log(`❌ Failed/Missing: ${errorCount} variables`);

if (successCount > 0) {
  console.log('\n🚀 Triggering new deployment...');
  try {
    execSync('vercel --prod --yes', { stdio: 'inherit' });
    console.log('\n🎉 Deployment triggered successfully!');
    console.log('🔗 Your app will be available shortly at your production URL');
  } catch (error) {
    console.error('\n❌ Failed to trigger deployment:', error.message);
    console.log('💡 You can manually deploy by running: vercel --prod');
  }
} else {
  console.log('\n⚠️  No environment variables were set. Please check your .env.local file.');
} 