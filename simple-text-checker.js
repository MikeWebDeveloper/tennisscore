const { chromium } = require('playwright');

async function checkCzechPages() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 SIMPLE CZECH TEXT VALIDATION\n');

  try {
    // Login first
    await page.goto('http://localhost:3000/cs/login', { timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'michal.latal@yahoo.co.uk');
    await page.fill('input[type="password"]', 'Mikemike88');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const pagesToCheck = [
      { url: '/cs/statistics', name: 'Statistics' },
      { url: '/cs/matches', name: 'Matches' },
      { url: '/cs/dashboard', name: 'Dashboard' },
      { url: '/cs/players', name: 'Players' }
    ];

    const problematicWords = [
      'Opponent Analysis',
      'No opponent data available yet',
      'Completed', 
      'Live',
      'Save',
      'Cancel', 
      'Delete',
      'Edit',
      'Add',
      'Create',
      'Back',
      'Final',
      'Showing',
      'Watch Live'
    ];

    for (const pageInfo of pagesToCheck) {
      console.log(`\n📄 Checking ${pageInfo.name}: ${pageInfo.url}`);
      
      await page.goto(`http://localhost:3000${pageInfo.url}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(3000);

      // Get all text content
      const bodyText = await page.textContent('body');
      
      console.log(`   Page text length: ${bodyText.length} characters`);
      
      // Check each problematic word
      const foundWords = [];
      for (const word of problematicWords) {
        if (bodyText.includes(word)) {
          foundWords.push(word);
          
          // Try to find the element containing this word for more context
          try {
            const element = await page.locator(`text="${word}"`).first();
            const isVisible = await element.isVisible();
            if (isVisible) {
              const parentHtml = await element.evaluate(el => el.parentElement?.outerHTML || el.outerHTML);
              console.log(`   ❌ Found "${word}" in: ${parentHtml.substring(0, 150)}...`);
            }
          } catch (e) {
            console.log(`   ❌ Found "${word}" (could not locate element)`);
          }
        }
      }
      
      if (foundWords.length === 0) {
        console.log(`   ✅ No problematic English words found!`);
      } else {
        console.log(`   📊 Found ${foundWords.length} English words: ${foundWords.join(', ')}`);
      }
    }

    // Special focus on Statistics page for opponent analysis
    console.log('\n🎯 DEEP DIVE: Statistics Page Opponent Analysis');
    await page.goto('http://localhost:3000/cs/statistics', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Check specific sections
    const sections = await page.locator('section, div[class*="section"], div[class*="card"]').all();
    console.log(`   Found ${sections.length} potential sections`);

    for (let i = 0; i < Math.min(sections.length, 10); i++) {
      const section = sections[i];
      const text = await section.textContent().catch(() => '');
      
      if (text.includes('Opponent') || text.includes('Analysis') || text.includes('nemeses') || text.includes('bunnies')) {
        console.log(`   📍 Section ${i + 1} contains opponent-related text:`);
        console.log(`      Text: ${text.substring(0, 200)}...`);
        
        const html = await section.innerHTML().catch(() => 'N/A');
        console.log(`      HTML: ${html.substring(0, 300)}...`);
      }
    }

    // Check for specific Czech translations that should be present
    console.log('\n✅ CHECKING FOR EXPECTED CZECH TRANSLATIONS:');
    const expectedCzech = [
      'Analýza soupeřů',
      'Dokončeno', 
      'Živě',
      'Uložit',
      'Zrušit',
      'Smazat',
      'Upravit',
      'Přidat',
      'Vytvořit',
      'Zpět'
    ];

    for (const pageInfo of pagesToCheck) {
      await page.goto(`http://localhost:3000${pageInfo.url}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');
      
      console.log(`\n📄 ${pageInfo.name} - Czech translations present:`);
      for (const czechWord of expectedCzech) {
        const found = bodyText.includes(czechWord);
        console.log(`   ${found ? '✅' : '❌'} "${czechWord}"`);
      }
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }

  await browser.close();
}

checkCzechPages().catch(console.error);