#!/usr/bin/env node

// Simple test to verify the live match URL works
const https = require('https');

const matchId = '6868fa310014b6130788';
const testUrl = `https://tennisscore-git-test-michallatal-yahoocouks-projects.vercel.app/live/${matchId}`;

console.log(`🧪 Testing live match URL: ${testUrl}`);
console.log('═'.repeat(80));

https.get(testUrl, (res) => {
  console.log(`📊 Response Status: ${res.statusCode}`);
  console.log(`🏷️  Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Check if the response contains "Unknown Player"
    if (data.includes('Unknown Player')) {
      console.log('❌ ISSUE FOUND: Page still shows "Unknown Player"');
      
      // Try to extract the player names from the HTML
      const playerMatches = data.match(/Unknown Player/g);
      if (playerMatches) {
        console.log(`   Found ${playerMatches.length} instances of "Unknown Player"`);
      }
    } else {
      console.log('✅ SUCCESS: No "Unknown Player" found in response');
      
      // Try to find actual player names
      if (data.includes('Sofie') || data.includes('Adriana')) {
        console.log('✅ SUCCESS: Found actual player names in response');
      } else {
        console.log('⚠️  Could not detect player names in response');
      }
    }
    
    // Check for any error messages
    if (data.includes('error') || data.includes('Error')) {
      console.log('⚠️  Response may contain error messages');
    }
    
    console.log(`📏 Response size: ${data.length} bytes`);
  });
  
}).on('error', (err) => {
  console.error('❌ Request failed:', err.message);
  
  if (err.code === 'ENOTFOUND') {
    console.log('🌐 The URL might not be accessible or the deployment might not be live');
  }
});