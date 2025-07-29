const { chromium } = require('playwright');

async function captureAllConsoleMessages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const allMessages = [];
  
  page.on('console', msg => {
    allMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      timestamp: new Date().toISOString()
    });
    
    // Log in real-time for debugging
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    const errorMsg = {
      type: 'pageerror',
      text: error.message,
      location: null,
      timestamp: new Date().toISOString()
    };
    allMessages.push(errorMsg);
    console.log(`[pageerror] ${error.message}`);
  });

  console.log('🧪 Testing Czech Dashboard with full console logging...\n');
  
  try {
    await page.goto('http://localhost:3000/cs/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('\n⏳ Waiting for React hydration and async operations...');
    await page.waitForTimeout(5000);
    
    console.log('\n📊 Final Summary:');
    console.log(`Total console messages captured: ${allMessages.length}`);
    
    // Save all messages for detailed analysis
    require('fs').writeFileSync('logs/all-console-messages.json', JSON.stringify(allMessages, null, 2));
    
    // Take screenshot of the actual page
    await page.screenshot({ path: 'logs/czech-dashboard-current.png', fullPage: true });
    
    // Get some page content for analysis
    const title = await page.title();
    const bodyText = await page.textContent('body');
    
    console.log(`\nPage Title: ${title}`);
    console.log(`Page contains Dashboard text: ${bodyText.includes('Dashboard')}`);
    console.log(`Page contains Czech text: ${bodyText.includes('Hlavní přehled') || bodyText.includes('Statistiky')}`);
    
    // Check for specific translation patterns
    const hasTranslationErrors = allMessages.some(msg => 
      msg.text.includes('IntlError') || 
      msg.text.includes('useTranslations') ||
      msg.text.includes('translation') ||
      msg.text.includes('namespace')
    );
    
    console.log(`Translation errors detected: ${hasTranslationErrors}`);
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  await browser.close();
}

captureAllConsoleMessages().catch(console.error);