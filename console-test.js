const { chromium } = require('playwright');

async function captureConsoleErrors() {
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
  });

  page.on('pageerror', error => {
    allMessages.push({
      type: 'pageerror',
      text: error.message,
      location: null,
      timestamp: new Date().toISOString()
    });
  });

  const pagesToTest = [
    { url: 'http://localhost:3000/cs/dashboard', name: 'Czech Dashboard' },
    { url: 'http://localhost:3000/en/dashboard', name: 'English Dashboard' },
    { url: 'http://localhost:3000/cs/matches', name: 'Czech Matches' },
    { url: 'http://localhost:3000/cs/players', name: 'Czech Players' },
    { url: 'http://localhost:3000/cs/statistics', name: 'Czech Statistics' }
  ];

  const results = {};

  for (const pageTest of pagesToTest) {
    console.log(`\n🧪 Testing: ${pageTest.name}`);
    allMessages.length = 0; // Clear previous messages
    
    try {
      await page.goto(pageTest.url, { 
        waitUntil: 'networkidle',
        timeout: 20000 
      });
      
      // Wait for React hydration and any async operations
      await page.waitForTimeout(3000);
      
      // Filter for translation/error related messages
      const relevantMessages = allMessages.filter(msg => 
        msg.type === 'error' || 
        msg.text.includes('IntlError') || 
        msg.text.includes('translation') ||
        msg.text.includes('namespace') ||
        msg.text.includes('missing') ||
        msg.text.includes('MISSING_MESSAGE') ||
        msg.text.includes('useTranslations')
      );
      
      results[pageTest.name] = {
        url: pageTest.url,
        totalMessages: allMessages.length,
        errorMessages: relevantMessages,
        success: true
      };
      
      console.log(`   Total console messages: ${allMessages.length}`);
      console.log(`   Translation-related errors: ${relevantMessages.length}`);
      
      if (relevantMessages.length > 0) {
        console.log('   🚨 Translation errors found:');
        relevantMessages.forEach(msg => {
          console.log(`      ${msg.type}: ${msg.text.substring(0, 200)}`);
        });
      }
      
    } catch (error) {
      results[pageTest.name] = {
        url: pageTest.url,
        success: false,
        error: error.message
      };
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  // Save detailed results
  require('fs').writeFileSync('logs/console-errors-detailed.json', JSON.stringify(results, null, 2));
  
  console.log('\n📊 SUMMARY:');
  Object.entries(results).forEach(([name, result]) => {
    if (result.success) {
      console.log(`   ${name}: ${result.errorMessages.length} translation errors`);
    } else {
      console.log(`   ${name}: FAILED - ${result.error}`);
    }
  });
  
  console.log('\n📄 Detailed results saved to: logs/console-errors-detailed.json');
  
  await browser.close();
}

captureConsoleErrors().catch(console.error);