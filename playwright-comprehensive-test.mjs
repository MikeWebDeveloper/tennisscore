import { chromium } from 'playwright';
import fs from 'fs';

async function comprehensiveTest() {
  console.log('🎾 Starting TennisScore Comprehensive Visual Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Homepage with performance monitoring
    console.log('📱 Testing homepage with performance...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for key elements
    const hasNav = await page.locator('nav').count() > 0;
    const hasMain = await page.locator('main').count() > 0;
    console.log(`🧭 Navigation: ${hasNav ? '✅' : '❌'}`);
    console.log(`📋 Main content: ${hasMain ? '✅' : '❌'}`);
    
    await page.screenshot({ path: 'screenshots/homepage-detailed.png', fullPage: true });
    
    // Test 2: Interactive Dashboard Testing
    console.log('📊 Testing dashboard interactions...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for interactive elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    console.log(`🔘 Buttons found: ${buttons}`);
    console.log(`🔗 Links found: ${links}`);
    
    // Test clicking on "Add Player" button if it exists
    const addPlayerBtn = page.locator('button:has-text("Add Player"), a:has-text("Add Player")');
    if (await addPlayerBtn.count() > 0) {
      console.log('👤 Testing Add Player button...');
      await addPlayerBtn.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/add-player-dialog.png', fullPage: true });
      console.log('✅ Add Player dialog screenshot saved');
    }
    
    await page.screenshot({ path: 'screenshots/dashboard-interactive.png', fullPage: true });
    
    // Test 3: Matches Page with Data Loading
    console.log('🎾 Testing matches page with data...');
    await page.goto('http://localhost:3001/matches');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential data loading
    await page.waitForTimeout(3000);
    
    // Check for match cards
    const matchCards = await page.locator('[data-testid="match-card"], .match-card, .card').count();
    console.log(`🎾 Match cards found: ${matchCards}`);
    
    // Test view match button if available
    const viewButtons = page.locator('button:has-text("View"), a:has-text("View")');
    if (await viewButtons.count() > 0) {
      console.log('👁️ Testing view match functionality...');
      await viewButtons.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'screenshots/match-details.png', fullPage: true });
      console.log('✅ Match details screenshot saved');
    }
    
    await page.screenshot({ path: 'screenshots/matches-detailed.png', fullPage: true });
    
    // Test 4: Players Page
    console.log('👥 Testing players page...');
    await page.goto('http://localhost:3001/players');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for player cards
    const playerCards = await page.locator('[data-testid="player-card"], .player-card, .card').count();
    console.log(`👤 Player cards found: ${playerCards}`);
    
    await page.screenshot({ path: 'screenshots/players-detailed.png', fullPage: true });
    
    // Test 5: Settings Page
    console.log('⚙️ Testing settings page...');
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');
    
    // Check for settings sections
    const settingsSections = await page.locator('section, .settings-section, .card').count();
    console.log(`⚙️ Settings sections found: ${settingsSections}`);
    
    await page.screenshot({ path: 'screenshots/settings-detailed.png', fullPage: true });
    
    // Test 6: Admin Page
    console.log('🔧 Testing admin page...');
    await page.goto('http://localhost:3001/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for admin features
    const adminTables = await page.locator('table').count();
    const adminButtons = await page.locator('button').count();
    console.log(`📊 Admin tables found: ${adminTables}`);
    console.log(`🔘 Admin buttons found: ${adminButtons}`);
    
    await page.screenshot({ path: 'screenshots/admin-detailed.png', fullPage: true });
    
    // Test 7: Responsive Design Testing
    console.log('📱 Testing responsive design...');
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/mobile-dashboard.png', fullPage: true });
    
    // Check for mobile menu
    const mobileMenu = await page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger').count();
    console.log(`🍔 Mobile menu found: ${mobileMenu > 0 ? '✅' : '❌'}`);
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/tablet-dashboard.png', fullPage: true });
    
    // Desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Test 8: Accessibility Testing
    console.log('♿ Testing accessibility...');
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    console.log(`🖼️ Images with alt text: ${imagesWithAlt}/${images}`);
    
    // Check for heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    console.log(`📝 Headings found: ${headings}`);
    
    // Check for ARIA labels
    const ariaLabels = await page.locator('[aria-label]').count();
    console.log(`🏷️ Elements with ARIA labels: ${ariaLabels}`);
    
    await page.screenshot({ path: 'screenshots/accessibility-test.png', fullPage: true });
    
    // Test 9: Performance Monitoring
    console.log('⚡ Testing performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    console.log('📊 Performance Metrics:');
    console.log(`  Load Time: ${performanceMetrics.loadTime?.toFixed(2)}ms`);
    console.log(`  DOM Content Loaded: ${performanceMetrics.domContentLoaded?.toFixed(2)}ms`);
    console.log(`  First Paint: ${performanceMetrics.firstPaint?.toFixed(2)}ms`);
    console.log(`  First Contentful Paint: ${performanceMetrics.firstContentfulPaint?.toFixed(2)}ms`);
    
    // Test 10: Error Monitoring
    console.log('🔍 Monitoring for errors...');
    const errors = [];
    const warnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Navigate through all pages to catch errors
    const pages = ['', '/dashboard', '/matches', '/players', '/settings', '/admin'];
    for (const pagePath of pages) {
      await page.goto(`http://localhost:3001${pagePath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    if (errors.length > 0) {
      console.log('⚠️ Errors found:', errors);
    } else {
      console.log('✅ No errors detected');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️ Warnings found:', warnings);
    } else {
      console.log('✅ No warnings detected');
    }
    
    console.log('🎉 Comprehensive testing completed successfully!');
    console.log('📸 All screenshots saved in screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

comprehensiveTest().catch(console.error); 