#!/usr/bin/env node

import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('🚀 Testing test.tenis.click authentication flow...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual confirmation
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    // Clear any existing state
    await context.clearCookies();
    
    // Test 1: Navigate to root page
    console.log('1️⃣ Testing root page redirect...');
    try {
      await page.goto('https://test.tenis.click', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      const currentUrl = page.url();
      console.log(`✅ Successfully navigated. Current URL: ${currentUrl}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-root-redirect.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-root-redirect.png');
      
    } catch (error) {
      console.log('❌ Root page error:', error.message);
      await page.screenshot({ path: 'test-root-error.png' });
    }
    
    // Test 2: Test login page
    console.log('\n2️⃣ Testing login page...');
    try {
      if (!page.url().includes('/login')) {
        await page.goto('https://test.tenis.click/login', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
      }
      
      // Wait for login form
      await page.waitForSelector('form', { timeout: 5000 });
      
      // Take screenshot
      await page.screenshot({ 
        path: 'test-login-page.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-login-page.png');
      
      // Test login functionality
      console.log('\n3️⃣ Testing login functionality...');
      
      // Fill in credentials
      await page.fill('input[name="email"]', 'michal.latal@yahoo.co.uk');
      await page.fill('input[name="password"]', 'Mikemike88');
      
      await page.screenshot({ 
        path: 'test-login-filled.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-login-filled.png');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      
      await page.screenshot({ 
        path: 'test-dashboard.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: test-dashboard.png');
      console.log('✅ Login successful! Redirected to dashboard');
      
    } catch (error) {
      console.log('❌ Login test error:', error.message);
      await page.screenshot({ path: 'test-login-error.png' });
    }
    
    console.log('\n✨ Authentication flow test complete!');
    console.log('📁 Screenshots saved in the current directory');
    
    // Keep browser open for 5 seconds to observe
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthFlow().catch(console.error);