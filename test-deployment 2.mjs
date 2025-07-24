#!/usr/bin/env node

import { chromium } from 'playwright';

async function testDeployment() {
  console.log('🚀 Testing test.tenis.click deployment...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Test 1: Clear cache page (should always work)
    console.log('1️⃣ Testing clear-cache page...');
    try {
      await page.goto('https://test.tenis.click/clear-cache.html', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      console.log('✅ Clear-cache page loads successfully');
    } catch (error) {
      console.log('❌ Clear-cache page failed:', error.message);
    }
    
    // Test 2: Root page redirect
    console.log('\n2️⃣ Testing root page redirect...');
    try {
      const response = await page.goto('https://test.tenis.click', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      const finalUrl = page.url();
      console.log(`✅ Root page redirected to: ${finalUrl}`);
      
      if (finalUrl.includes('/login')) {
        console.log('✅ Correctly redirected to login (user not authenticated)');
      } else if (finalUrl.includes('/dashboard')) {
        console.log('✅ Correctly redirected to dashboard (user authenticated)');
      } else {
        console.log('⚠️  Unexpected redirect target:', finalUrl);
      }
    } catch (error) {
      if (error.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        console.log('❌ REDIRECT LOOP DETECTED!');
      } else {
        console.log('❌ Root page failed:', error.message);
      }
    }
    
    // Test 3: Direct login page access
    console.log('\n3️⃣ Testing direct login page access...');
    try {
      await page.goto('https://test.tenis.click/login', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      const loginTitle = await page.title();
      console.log('✅ Login page loads successfully');
      console.log(`   Title: ${loginTitle}`);
      
      // Check for login form
      const hasLoginForm = await page.locator('form').count() > 0;
      if (hasLoginForm) {
        console.log('✅ Login form is present');
      }
    } catch (error) {
      if (error.message.includes('ERR_TOO_MANY_REDIRECTS')) {
        console.log('❌ REDIRECT LOOP on login page!');
      } else {
        console.log('❌ Login page failed:', error.message);
      }
    }
    
    // Test 4: Check console errors
    console.log('\n4️⃣ Checking for console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Wait a bit to catch any delayed errors
    await page.waitForTimeout(2000);
    
    console.log('\n✨ Deployment test complete!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDeployment().catch(console.error);