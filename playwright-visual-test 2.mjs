import { chromium } from 'playwright';
import fs from 'fs';

async function visualTest() {
  console.log('🎾 Starting TennisScore Visual Test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual inspection
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Homepage
    console.log('📱 Testing homepage...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });
    console.log('✅ Homepage screenshot saved');
    
    // Test 2: Dashboard
    console.log('📊 Testing dashboard...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });
    console.log('✅ Dashboard screenshot saved');
    
    // Test 3: Matches page
    console.log('🎾 Testing matches page...');
    await page.goto('http://localhost:3001/matches');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/matches.png', fullPage: true });
    console.log('✅ Matches page screenshot saved');
    
    // Test 4: Players page
    console.log('👥 Testing players page...');
    await page.goto('http://localhost:3001/players');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/players.png', fullPage: true });
    console.log('✅ Players page screenshot saved');
    
    // Test 5: Settings page
    console.log('⚙️ Testing settings page...');
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/settings.png', fullPage: true });
    console.log('✅ Settings page screenshot saved');
    
    // Test 6: Admin page
    console.log('🔧 Testing admin page...');
    await page.goto('http://localhost:3001/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/admin.png', fullPage: true });
    console.log('✅ Admin page screenshot saved');
    
    // Test 7: Mobile viewport
    console.log('📱 Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/dashboard-mobile.png', fullPage: true });
    console.log('✅ Mobile dashboard screenshot saved');
    
    // Test 8: Tablet viewport
    console.log('📱 Testing tablet viewport...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/dashboard-tablet.png', fullPage: true });
    console.log('✅ Tablet dashboard screenshot saved');
    
    // Test 9: Language toggle (if available)
    console.log('🌐 Testing language toggle...');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for language toggle button
    const langToggle = page.locator('[data-testid="language-toggle"], button:has-text("EN"), button:has-text("CS")');
    if (await langToggle.count() > 0) {
      await langToggle.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/language-toggle.png', fullPage: true });
      console.log('✅ Language toggle screenshot saved');
    } else {
      console.log('⚠️ Language toggle not found');
    }
    
    // Test 10: Check for any console errors
    console.log('🔍 Checking for console errors...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('⚠️ Console errors found:', errors);
    } else {
      console.log('✅ No console errors detected');
    }
    
    console.log('🎉 Visual testing completed successfully!');
    console.log('📸 Screenshots saved in screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Visual test failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

visualTest().catch(console.error); 