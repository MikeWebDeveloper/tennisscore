#!/usr/bin/env node

/**
 * Script to verify environment variables are properly configured
 * Usage: node scripts/verify-env-vars.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// Required environment variables
const requiredVars = [
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

console.log('🔍 Checking environment variables...\n');

let allPresent = true;
let publicVars = [];
let privateVars = [];

for (const varName of requiredVars) {
  const value = process.env[varName];
  const isPresent = !!value;
  const isPublic = varName.startsWith('NEXT_PUBLIC_');
  
  if (isPresent) {
    const maskedValue = value.length > 10 
      ? `${value.slice(0, 8)}...${value.slice(-4)}`
      : `${'*'.repeat(value.length)}`;
    
    console.log(`✅ ${varName}: ${maskedValue}`);
    
    if (isPublic) {
      publicVars.push(varName);
    } else {
      privateVars.push(varName);
    }
  } else {
    console.log(`❌ ${varName}: Missing`);
    allPresent = false;
  }
}

console.log('\n📊 Summary:');
console.log(`📢 Public variables (client-side): ${publicVars.length}`);
console.log(`🔒 Private variables (server-side): ${privateVars.length}`);
console.log(`✅ All required variables present: ${allPresent ? 'Yes' : 'No'}`);

if (!allPresent) {
  console.log('\n❗ Missing environment variables detected!');
  console.log('💡 To fix this:');
  console.log('   1. Run: node scripts/push-env-to-vercel.js test');
  console.log('   2. Or manually add missing variables in Vercel dashboard');
  console.log('   3. Redeploy your application');
  process.exit(1);
}

console.log('\n🎉 All environment variables are properly configured!'); 