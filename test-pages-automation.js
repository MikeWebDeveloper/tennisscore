const { chromium } = require('playwright');

const ROUTES_TO_TEST = [
  // Root and Home
  { path: '/en', name: 'English Home' },
  { path: '/cs', name: 'Czech Home' },
  
  // Authentication Pages
  { path: '/en/login', name: 'English Login' },
  { path: '/cs/login', name: 'Czech Login' },
  { path: '/en/signup', name: 'English Signup' },
  { path: '/cs/signup', name: 'Czech Signup' },
  
  // Dashboard
  { path: '/en/dashboard', name: 'English Dashboard' },
  { path: '/cs/dashboard', name: 'Czech Dashboard' },
  
  // Matches
  { path: '/en/matches', name: 'English Matches' },
  { path: '/cs/matches', name: 'Czech Matches' },
  { path: '/en/matches/new', name: 'English New Match' },
  { path: '/cs/matches/new', name: 'Czech New Match' },
  
  // Players
  { path: '/en/players', name: 'English Players' },
  { path: '/cs/players', name: 'Czech Players' },
  
  // Statistics
  { path: '/en/statistics', name: 'English Statistics' },
  { path: '/cs/statistics', name: 'Czech Statistics' },
  
  // Admin
  { path: '/en/admin', name: 'English Admin' },
  { path: '/cs/admin', name: 'Czech Admin' },
  
  // Settings
  { path: '/en/settings', name: 'English Settings' },
  { path: '/cs/settings', name: 'Czech Settings' },
  
  // Error page
  { path: '/en/auth-error', name: 'English Auth Error' },
  { path: '/cs/auth-error', name: 'Czech Auth Error' }
];

const BASE_URL = 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: 'michal.latal@yahoo.co.uk',
  password: 'Mikemike88'
};

async function testAllPages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    summary: {
      totalPages: ROUTES_TO_TEST.length,
      pagesWithErrors: 0,
      totalErrors: 0
    },
    pageResults: []
  };

  // Capture console logs and errors
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('IntlError') || msg.text().includes('translation')) {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // Login first to access protected pages
  console.log('🔐 Logging in to access protected pages...');
  try {
    await page.goto(`${BASE_URL}/en/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Successfully logged in');
  } catch (error) {
    console.log('⚠️ Login failed, some protected pages may not be accessible:', error.message);
  }

  // Test each page
  for (const route of ROUTES_TO_TEST) {
    console.log(`\n🧪 Testing: ${route.name} (${route.path})`);
    
    const pageResult = {
      name: route.name,
      path: route.path,
      status: 'unknown',
      errors: [],
      screenshots: [],
      translationIssues: []
    };

    try {
      // Clear previous console messages
      consoleMessages.length = 0;
      
      // Navigate to page
      await page.goto(`${BASE_URL}${route.path}`, { 
        waitUntil: 'networkidle',
        timeout: 15000 
      });
      
      // Wait a bit for any delayed console errors
      await page.waitForTimeout(2000);
      
      // Check for IntlError or translation issues in console
      const translationErrors = consoleMessages.filter(msg => 
        msg.text.includes('IntlError') || 
        msg.text.includes('translation') ||
        msg.text.includes('namespace') ||
        msg.text.includes('missing key')
      );
      
      if (translationErrors.length > 0) {
        pageResult.errors = translationErrors;
        pageResult.status = 'has_translation_errors';
        results.summary.pagesWithErrors++;
        results.summary.totalErrors += translationErrors.length;
        
        console.log(`❌ ${translationErrors.length} translation errors found`);
        translationErrors.forEach(error => {
          console.log(`   - ${error.text}`);
        });
      } else {
        pageResult.status = 'no_translation_errors';
        console.log('✅ No translation errors detected');
      }
      
      // Take screenshot for visual inspection
      const screenshotPath = `logs/screenshot${route.path.replace(/\//g, '-')}.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      pageResult.screenshots.push(screenshotPath);
      
      // Check for hardcoded English text on Czech pages
      if (route.path.startsWith('/cs')) {
        const bodyText = await page.textContent('body');
        const suspiciousEnglishTexts = [
          'Dashboard', 'Matches', 'Players', 'Statistics', 'Settings',
          'Login', 'Sign up', 'Sign in', 'Create', 'Delete', 'Edit',
          'Save', 'Cancel', 'Submit', 'Loading...', 'Error'
        ];
        
        const foundHardcodedText = suspiciousEnglishTexts.filter(text => 
          bodyText && bodyText.includes(text)
        );
        
        if (foundHardcodedText.length > 0) {
          pageResult.translationIssues = foundHardcodedText;
          console.log(`⚠️ Potential hardcoded English text: ${foundHardcodedText.join(', ')}`);
        }
      }
      
    } catch (error) {
      pageResult.status = 'navigation_error';
      pageResult.errors.push({
        type: 'navigation',
        text: error.message,
        location: null
      });
      console.log(`❌ Navigation error: ${error.message}`);
    }
    
    results.pageResults.push(pageResult);
  }

  // Generate detailed report
  const reportPath = 'logs/translation-audit-report.json';
  require('fs').writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 TESTING COMPLETE`);
  console.log(`Total Pages Tested: ${results.summary.totalPages}`);
  console.log(`Pages with Translation Errors: ${results.summary.pagesWithErrors}`);
  console.log(`Total Translation Errors: ${results.summary.totalErrors}`);
  console.log(`Detailed report saved to: ${reportPath}`);

  await browser.close();
  return results;
}

testAllPages().catch(console.error);