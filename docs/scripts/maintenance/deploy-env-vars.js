#!/usr/bin/env node

/**
 * Script to help with Vercel environment variable deployment
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT', 
  'APPWRITE_API_KEY',
  'APPWRITE_DATABASE_ID',
  'APPWRITE_PLAYERS_COLLECTION_ID',
  'APPWRITE_MATCHES_COLLECTION_ID',
  'NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID',
  'APPWRITE_PROFILE_PICTURES_BUCKET_ID'
]

console.log('🚀 TennisScore Vercel Environment Variables Setup')
console.log('=' .repeat(50))

console.log('\n📋 Required Environment Variables:')
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  const status = value ? '✅' : '❌'
  console.log(`${status} ${envVar}${value ? ` = ${value.substring(0, 20)}...` : ' (missing)'}`)
})

console.log('\n🔧 To set these in Vercel:')
console.log('1. Go to your Vercel project dashboard')
console.log('2. Navigate to Settings > Environment Variables')
console.log('3. Add each required variable with their values')

console.log('\n💡 Tips:')
console.log('- NEXT_PUBLIC_ variables are exposed to the browser')
console.log('- Non-NEXT_PUBLIC_ variables are server-side only')
console.log('- Make sure bucket ID matches your Appwrite setup')

if (process.argv.includes('--vercel-commands')) {
  console.log('\n📝 Vercel CLI Commands:')
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
      console.log(`vercel env add ${envVar} production`)
    }
  })
}

console.log('\n✨ After setting variables, redeploy your application') 