const { chromium } = require('playwright');

async function testCzechLocalization() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Store console errors
  const consoleErrors = [];
  const translationErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      if (text.includes('IntlError') || text.includes('MISSING_MESSAGE')) {
        translationErrors.push(text);
      }
    }
  });

  const results = {
    pages: {},
    consoleErrors: [],
    translationErrors: [],
    englishTextFound: [],
    keyStatus: {}
  };

  // Test credentials for login if needed
  const testCredentials = {
    email: 'michal.latal@yahoo.co.uk',
    password: 'Mikemike88'
  };

  console.log('🚀 Starting Czech Localization Validation...\n');

  try {
    // Phase 1: Navigate to Czech locale and login if needed
    console.log('📍 Phase 1: Accessing Czech Interface');
    
    // Wait for server to be ready
    await page.goto('http://localhost:3000/cs', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check if we need to login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('🔐 Logging in with test credentials...');
      
      // Wait for login form to be ready
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      await page.fill('input[type="email"]', testCredentials.email);
      await page.fill('input[type="password"]', testCredentials.password);
      
      // Click login button
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      console.log('✅ Successfully logged in');
    }

    // Phase 2: Test critical pages
    const pagesToTest = [
      { url: '/cs/dashboard', name: 'Dashboard' },
      { url: '/cs/statistics', name: 'Statistics' },
      { url: '/cs/matches', name: 'Matches' },
      { url: '/cs/players', name: 'Players' },
      { url: '/cs/admin', name: 'Admin' }
    ];

    for (const testPage of pagesToTest) {
      console.log(`\n📄 Testing ${testPage.name} page: ${testPage.url}`);
      
      try {
        await page.goto(`http://localhost:3000${testPage.url}`, { timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.waitForTimeout(3000); // Allow React components to render
        
        // Capture page content
        const pageText = await page.textContent('body');
        const pageResults = {
          url: testPage.url,
          name: testPage.name,
          englishWords: [],
          consoleErrors: [...consoleErrors],
          translationErrors: [...translationErrors],
          screenshot: null
        };

        // Check for common English words that shouldn't appear in Czech interface
        const englishPatterns = [
          'Opponent Analysis',
          'No opponent data available yet',
          'Play more matches to see',
          'Completed',
          'Singles',
          'Doubles',
          'Live',
          'Watch Live',
          'Created by',
          'Showing matches',
          'Deep Dive Analytics',
          'of matches',
          'Final',
          'Loading...',
          'Error:',
          'Save',
          'Cancel',
          'Delete',
          'Edit',
          'Add',
          'Create',
          'Back to matches',
          'Share results'
        ];

        englishPatterns.forEach(pattern => {
          if (pageText.includes(pattern)) {
            pageResults.englishWords.push(pattern);
            results.englishTextFound.push({
              page: testPage.name,
              text: pattern,
              url: testPage.url
            });
          }
        });

        // Take screenshot
        const screenshotPath = `screenshot-${testPage.name.toLowerCase()}-czech.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        pageResults.screenshot = screenshotPath;

        // Test specific translation keys by checking elements
        console.log(`  🔍 Checking specific translation keys...`);
        
        // Statistics page specific checks
        if (testPage.url.includes('/statistics')) {
          // Check for opponent analysis section
          const opponentSection = await page.locator('text=Analýza soupeřů').first().isVisible().catch(() => false);
          results.keyStatus['statistics.opponentAnalysis'] = opponentSection ? '✅ Working' : '❌ Missing/Incorrect';
          
          // Check for no opponent data message
          const noDataMessage = await page.locator('text=zatím nejsou k dispozici žádná data').first().isVisible().catch(() => false);
          results.keyStatus['statistics.noOpponentData'] = noDataMessage ? '✅ Working' : '❌ Missing/Incorrect';
        }

        // Matches page specific checks
        if (testPage.url.includes('/matches')) {
          // Look for showing matches summary
          const showingMatches = await page.locator('[data-testid*="showing"], text*="Zobrazuje se"').first().isVisible().catch(() => false);
          results.keyStatus['common.showingMatchesSummary'] = showingMatches ? '✅ Working' : '❌ Missing/Incorrect';
          
          // Check for completed status
          const completedStatus = await page.locator('text=Dokončeno').first().isVisible().catch(() => false);
          results.keyStatus['match.completed'] = completedStatus ? '✅ Working' : '❌ Missing/Incorrect';
        }

        // Admin page specific checks
        if (testPage.url.includes('/admin')) {
          const adminMatches = await page.locator('text*="Zobrazuje se zápasy"').first().isVisible().catch(() => false);
          results.keyStatus['admin.showingMatches'] = adminMatches ? '✅ Working' : '❌ Missing/Incorrect';
        }

        results.pages[testPage.name] = pageResults;
        console.log(`  ✅ Completed ${testPage.name} analysis`);
        console.log(`     - English words found: ${pageResults.englishWords.length}`);
        console.log(`     - Console errors: ${pageResults.consoleErrors.length}`);
        
        // Clear errors for next page
        consoleErrors.length = 0;
        translationErrors.length = 0;
        
      } catch (error) {
        console.log(`  ❌ Error testing ${testPage.name}: ${error.message}`);
        results.pages[testPage.name] = {
          url: testPage.url,
          name: testPage.name,
          error: error.message,
          englishWords: [],
          consoleErrors: [],
          translationErrors: []
        };
      }
    }

    // Phase 3: Interactive element testing
    console.log('\n🎮 Phase 3: Testing Interactive Elements');
    
    // Test form interactions, dialogs, etc.
    try {
      await page.goto('http://localhost:3000/cs/players');
      await page.waitForLoadState('networkidle');
      
      // Try to trigger create player dialog if it exists
      const createButton = await page.locator('button:has-text("Vytvořit"), button:has-text("Přidat"), [data-testid*="create"]').first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        await page.waitForTimeout(1000);
        
        // Check dialog content
        const dialogText = await page.textContent('[role="dialog"], .dialog, [data-testid*="dialog"]').catch(() => '');
        const dialogEnglish = ['Create', 'Add Player', 'Save', 'Cancel'].filter(word => dialogText.includes(word));
        if (dialogEnglish.length > 0) {
          results.englishTextFound.push({
            page: 'Player Dialog',
            text: dialogEnglish.join(', '),
            url: '/cs/players'
          });
        }
      }
    } catch (error) {
      console.log(`  ⚠️ Interactive testing error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error);
    results.criticalError = error.message;
  }

  // Compile final results
  results.consoleErrors = [...new Set(consoleErrors)];
  results.translationErrors = [...new Set(translationErrors)];
  
  console.log('\n📊 TESTING COMPLETE - GENERATING REPORT...\n');
  
  // Generate detailed report
  console.log('='.repeat(80));
  console.log('🇨🇿 CZECH LOCALIZATION VALIDATION REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📋 SUMMARY:');
  console.log(`- Pages tested: ${Object.keys(results.pages).length}`);
  console.log(`- English text instances found: ${results.englishTextFound.length}`);
  console.log(`- Console errors: ${results.consoleErrors.length}`);
  console.log(`- Translation errors: ${results.translationErrors.length}`);
  
  if (results.englishTextFound.length > 0) {
    console.log('\n❌ ENGLISH TEXT STILL PRESENT:');
    results.englishTextFound.forEach((item, index) => {
      console.log(`${index + 1}. Page: ${item.page}`);
      console.log(`   Text: "${item.text}"`);
      console.log(`   URL: ${item.url}\n`);
    });
  } else {
    console.log('\n✅ NO ENGLISH TEXT FOUND - EXCELLENT!');
  }
  
  if (results.translationErrors.length > 0) {
    console.log('\n❌ TRANSLATION ERRORS:');
    results.translationErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ NO TRANSLATION ERRORS DETECTED');
  }
  
  console.log('\n🔑 SPECIFIC KEY STATUS:');
  Object.entries(results.keyStatus).forEach(([key, status]) => {
    console.log(`   ${key}: ${status}`);
  });
  
  console.log('\n📄 PAGE-BY-PAGE RESULTS:');
  Object.entries(results.pages).forEach(([pageName, pageData]) => {
    console.log(`\n${pageName} (${pageData.url}):`);
    if (pageData.error) {
      console.log(`   ❌ Error: ${pageData.error}`);
    } else {
      console.log(`   English words: ${pageData.englishWords.length}`);
      console.log(`   Console errors: ${pageData.consoleErrors.length}`);
      console.log(`   Screenshot: ${pageData.screenshot || 'None'}`);
      if (pageData.englishWords.length > 0) {
        console.log(`   Found: ${pageData.englishWords.join(', ')}`);
      }
    }
  });
  
  if (results.consoleErrors.length > 0) {
    console.log('\n🚨 CONSOLE ERRORS:');
    results.consoleErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION COMPLETE');
  console.log('='.repeat(80));

  await browser.close();
  return results;
}

// Run the test
testCzechLocalization().catch(console.error);