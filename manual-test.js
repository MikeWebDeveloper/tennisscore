const { chromium } = require('playwright');

async function testSinglePage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });

  try {
    console.log('🧪 Testing Czech Dashboard...');
    await page.goto('http://localhost:3000/cs/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for React to hydrate and any console errors to appear
    await page.waitForTimeout(5000);
    
    console.log('\n📊 Console Messages:');
    consoleMessages.forEach(msg => {
      if (msg.type === 'error' || msg.text.includes('IntlError') || msg.text.includes('translation')) {
        console.log(`${msg.type.toUpperCase()}: ${msg.text}`);
      }
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'logs/manual-test-cs-dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved to logs/manual-test-cs-dashboard.png');
    
    // Get page title and check for obvious errors
    const title = await page.title();
    const bodyText = await page.textContent('body');
    
    console.log(`\n📄 Page Title: ${title}`);
    console.log(`📄 Body contains "Error": ${bodyText.includes('Error')}`);
    console.log(`📄 Body contains "IntlError": ${bodyText.includes('IntlError')}`);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  // Keep browser open for manual inspection
  console.log('\n✋ Browser kept open for manual inspection. Close manually when done.');
  // await browser.close();
}

testSinglePage().catch(console.error);