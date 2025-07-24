#!/usr/bin/env node

/**
 * Script to push environment variables to Vercel for specific branches
 * Usage: node scripts/push-env-to-vercel.js [branch-name]
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get branch name from command line argument or default to 'test'
const targetBranch = process.argv[2] || 'test';

// Read environment variables from backup file
const envBackupPath = path.join(__dirname, '..', '.env.local.backup');

if (!fs.existsSync(envBackupPath)) {
  console.error('❌ .env.local.backup file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envBackupPath, 'utf8');
const envLines = envContent.split('\n').filter(line => 
  line.trim() && !line.startsWith('#') && line.includes('=')
);

console.log(`🚀 Pushing environment variables to Vercel (will apply to all branches including: ${targetBranch})`);
console.log(`📄 Found ${envLines.length} environment variables\n`);

for (const line of envLines) {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  
  if (!key || !value) continue;
  
  // Set for both preview (test branches) and production environments
  const environments = ['preview', 'production'];
  
  for (const env of environments) {
    try {
      console.log(`⏳ Setting ${key} for ${env}...`);
      
      // Use the correct vercel env add syntax with stdin
      const command = `vercel env add ${key} ${env} --force`;
      
      // Execute the command with the value as stdin
      execSync(command, { 
        input: value,
        stdio: ['pipe', 'pipe', 'inherit']
      });
      
      console.log(`✅ ${key} set successfully for ${env}`);
    } catch (error) {
      console.error(`❌ Failed to set ${key} for ${env}:`, error.message);
    }
  }
}

console.log(`\n🎉 Environment variables setup complete! Available for all branches including: ${targetBranch}`);
console.log('\n📝 Next steps:');
console.log('1. Trigger a new deployment for your test branch');
console.log('2. Check the deployment logs for any environment variable issues');
console.log('3. Test login functionality on the deployed URL'); 