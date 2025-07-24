#!/usr/bin/env node

/**
 * Debug script for redirect loop issues
 * Run this to check for common configuration problems
 */

const fs = require('fs');
const path = require('path');

console.log('=== Redirect Loop Debug Script ===\n');

// Check next.config.mjs
console.log('1. Checking next.config.mjs...');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (content.includes("output: 'standalone'") && !content.includes('// output:')) {
    console.log('❌ ISSUE FOUND: output: "standalone" is active');
    console.log('   This causes static file issues on Vercel. Comment it out.');
  } else {
    console.log('✅ output: "standalone" is disabled or commented');
  }
  
  if (content.includes('trailingSlash: true')) {
    console.log('⚠️  WARNING: trailingSlash: true can cause redirect loops');
  }
} else {
  console.log('❌ next.config.mjs not found');
}

// Check vercel.json
console.log('\n2. Checking vercel.json...');
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelJsonPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  if (vercelConfig.redirects) {
    console.log('⚠️  WARNING: Found redirects in vercel.json:');
    console.log(JSON.stringify(vercelConfig.redirects, null, 2));
  } else {
    console.log('✅ No redirects found in vercel.json');
  }
  
  if (vercelConfig.rewrites) {
    console.log('ℹ️  Rewrites found:', vercelConfig.rewrites.length);
  }
} else {
  console.log('✅ No vercel.json found (this is OK)');
}

// Check middleware
console.log('\n3. Checking middleware configuration...');
const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check if middleware is bypassed
  if (middlewareContent.includes('return NextResponse.next()') && 
      middlewareContent.indexOf('return NextResponse.next()') < 
      middlewareContent.indexOf('const isAppRoute')) {
    console.log('✅ Middleware is bypassed (temporary fix active)');
  } else {
    console.log('⚠️  Middleware is active - could cause redirects');
  }
  
  // Check matcher configuration
  const matcherMatch = middlewareContent.match(/matcher:\s*\[([\s\S]*?)\]/);
  if (matcherMatch) {
    console.log('ℹ️  Middleware matcher pattern found');
    if (!matcherMatch[1].includes('.*\\\\..*')) {
      console.log('⚠️  Matcher might not exclude all static files');
    }
  }
} else {
  console.log('❌ Middleware not found');
}

// Check environment variables
console.log('\n4. Checking environment variables...');
const envVars = [
  'NEXT_PUBLIC_APPWRITE_ENDPOINT',
  'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
  'APPWRITE_API_KEY'
];

envVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName} is set`);
  } else {
    console.log(`❌ ${varName} is NOT set`);
  }
});

// Check build output
console.log('\n5. Checking build artifacts...');
const nextFolder = path.join(process.cwd(), '.next');
if (fs.existsSync(nextFolder)) {
  const buildId = path.join(nextFolder, 'BUILD_ID');
  if (fs.existsSync(buildId)) {
    console.log('✅ Build artifacts exist');
    console.log(`   Build ID: ${fs.readFileSync(buildId, 'utf8').trim()}`);
  } else {
    console.log('⚠️  Build might be incomplete');
  }
} else {
  console.log('❌ No .next folder - run npm run build');
}

// Deployment recommendations
console.log('\n=== Deployment Checklist ===');
console.log('1. Clear Vercel cache: vercel --force');
console.log('2. Clear browser cache and cookies for test.tenis.click');
console.log('3. Deploy with: vercel --prod');
console.log('4. Check deployment logs for any build errors');
console.log('5. If using Cloudflare, ensure SSL is set to "Full"');
console.log('\n=== Additional Debugging ===');
console.log('- Check Vercel deployment logs for build errors');
console.log('- Try incognito/private browsing to rule out cache issues');
console.log('- Use curl to test without browser redirects:');
console.log('  curl -I https://test.tenis.click');
console.log('  curl -I https://test.tenis.click/login');