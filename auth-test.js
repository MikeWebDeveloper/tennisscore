const { chromium } = require('playwright');

async function testWithAuthentication() {
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

  const testResults = {
    login: null,
    protectedPages: []
  };

  try {
    console.log('🔐 Testing login process...');
    
    // Test login page first
    await page.goto('http://localhost:3000/cs/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check for translation errors on login page
    const loginErrors = allMessages.filter(msg => 
      msg.text.includes('IntlError') || msg.text.includes('translation')
    ).length;
    
    console.log(`   Login page translation errors: ${loginErrors}`);
    
    // Try to login
    await page.fill('input[type="email"]', 'michal.latal@yahoo.co.uk');
    await page.fill('input[type="password"]', 'Mikemike88');
    
    // Clear messages before login attempt
    allMessages.length = 0;
    
    await page.click('button[type="submit"]');
    
    try {
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Login successful');
      testResults.login = 'success';
    } catch (e) {
      console.log('⚠️ Login may have failed or redirected elsewhere');
      testResults.login = 'uncertain';
    }
    
    // Test protected pages
    const protectedPages = [
      { url: '/cs/dashboard', name: 'Czech Dashboard' },
      { url: '/cs/matches', name: 'Czech Matches' },
      { url: '/cs/players', name: 'Czech Players' },
      { url: '/cs/statistics', name: 'Czech Statistics' },
      { url: '/cs/settings', name: 'Czech Settings' }
    ];
    
    for (const testPage of protectedPages) {
      console.log(`\n🧪 Testing: ${testPage.name}`);
      allMessages.length = 0; // Clear messages
      
      try {
        await page.goto(`http://localhost:3000${testPage.url}`, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        await page.waitForTimeout(3000);
        
        // Check for translation errors
        const translationErrors = allMessages.filter(msg => 
          msg.text.includes('IntlError') || 
          msg.text.includes('translation') ||
          msg.text.includes('namespace') ||
          msg.text.includes('missing')
        );
        
        // Take screenshot
        const screenshotName = `logs/auth-test${testPage.url.replace(/\//g, '-')}.png`;
        await page.screenshot({ path: screenshotName, fullPage: true });
        
        // Get page content
        const bodyText = await page.textContent('body');
        const title = await page.title();
        
        const pageResult = {
          url: testPage.url,
          name: testPage.name,
          title,
          translationErrors: translationErrors.length,
          errorDetails: translationErrors,
          containsEnglishText: bodyText.includes('Dashboard') || bodyText.includes('Players') || bodyText.includes('Matches'),
          containsCzechText: bodyText.includes('Hlavní') || bodyText.includes('Statistiky') || bodyText.includes('Hráči'),
          screenshot: screenshotName
        };
        
        testResults.protectedPages.push(pageResult);
        
        console.log(`   Translation errors: ${translationErrors.length}`);
        console.log(`   Contains English: ${pageResult.containsEnglishText}`);
        console.log(`   Contains Czech: ${pageResult.containsCzechText}`);
        
        if (translationErrors.length > 0) {
          console.log('   🚨 Errors found:');
          translationErrors.forEach(error => {
            console.log(`      ${error.type}: ${error.text.substring(0, 150)}`);
          });
        }
        
      } catch (error) {
        testResults.protectedPages.push({
          url: testPage.url,
          name: testPage.name,
          error: error.message
        });
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
  }
  
  // Save results
  require('fs').writeFileSync('logs/auth-test-results.json', JSON.stringify(testResults, null, 2));
  
  console.log('\n📊 AUTHENTICATION TEST SUMMARY:');
  console.log(`Login Status: ${testResults.login}`);
  console.log(`Protected Pages Tested: ${testResults.protectedPages.length}`);
  
  const pagesWithErrors = testResults.protectedPages.filter(p => p.translationErrors > 0);
  console.log(`Pages with Translation Errors: ${pagesWithErrors.length}`);
  
  if (pagesWithErrors.length > 0) {
    console.log('\n🚨 Pages with translation issues:');
    pagesWithErrors.forEach(page => {
      console.log(`   ${page.name}: ${page.translationErrors} errors`);
    });
  }
  
  console.log('\n📄 Detailed results saved to: logs/auth-test-results.json');
  
  await browser.close();
}

testWithAuthentication().catch(console.error);