const { chromium } = require('playwright');

async function checkRouting() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 CHECKING ROUTING ISSUE\n');

  try {
    // Login first
    await page.goto('http://localhost:3000/cs/login', { timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'michal.latal@yahoo.co.uk');
    await page.fill('input[type="password"]', 'Mikemike88');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Check URL paths to see which route is being served
    console.log('📄 Testing Dashboard Routing...');
    await page.goto('http://localhost:3000/cs/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check what component is actually being rendered by looking for specific test content
    const bodyText = await page.textContent('body');
    
    // Check for specific signs of different structures
    const checks = [
      { text: 'useTranslations', description: 'New i18n system component markers' },
      { text: 'data-locale', description: 'Locale-specific attributes' },
      { text: 'next-intl', description: 'Next-intl specific elements' }
    ];

    for (const check of checks) {
      const found = bodyText.includes(check.text);
      console.log(`${found ? '✅' : '❌'} ${check.description}: ${found}`);
    }

    // Check page source for script tags and other clues
    const pageSource = await page.content();
    console.log('\n📋 Page Analysis:');
    console.log(`- Page size: ${pageSource.length} characters`);
    console.log(`- Contains [locale]: ${pageSource.includes('[locale]')}`);
    console.log(`- Contains old (app): ${pageSource.includes('(app)')}`);
    
    // Check for specific English words and their context
    const englishWords = ['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back'];
    console.log('\n🔤 English Word Context:');
    
    for (const word of englishWords) {
      const wordElements = await page.locator(`text="${word}"`).all();
      if (wordElements.length > 0) {
        console.log(`\n"${word}" found ${wordElements.length} times:`);
        
        for (let i = 0; i < Math.min(wordElements.length, 3); i++) {
          try {
            const element = wordElements[i];
            const tagName = await element.evaluate(el => el.tagName);
            const className = await element.evaluate(el => el.className);
            const parentInfo = await element.evaluate(el => ({
              tagName: el.parentElement?.tagName,
              className: el.parentElement?.className,
              id: el.parentElement?.id
            }));
            
            console.log(`  ${i + 1}. <${tagName.toLowerCase()} class="${className}">`);
            console.log(`     Parent: <${parentInfo.tagName?.toLowerCase()} class="${parentInfo.className}" id="${parentInfo.id}">`);
          } catch (e) {
            console.log(`  ${i + 1}. Could not analyze element: ${e.message}`);
          }
        }
      }
    }

    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'routing-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as routing-debug.png');

  } catch (error) {
    console.error('❌ Error during routing check:', error);
  }

  await browser.close();
}

checkRouting().catch(console.error);