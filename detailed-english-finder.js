const { chromium } = require('playwright');

async function findEnglishText() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 DETAILED ENGLISH TEXT FINDER\n');

  try {
    // Login first
    await page.goto('http://localhost:3000/cs/login', { timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'michal.latal@yahoo.co.uk');
    await page.fill('input[type="password"]', 'Mikemike88');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Test specific user-reported issues
    const testCases = [
      {
        url: '/cs/statistics',
        name: 'Statistics - Opponent Analysis',
        checks: [
          { text: 'Opponent Analysis', expectedCzech: 'Analýza soupeřů' },
          { text: 'No opponent data available yet', expectedCzech: 'Zatím nejsou k dispozici žádná data o soupeřích' },
          { text: 'Play more matches to see your nemeses and bunnies', expectedCzech: 'Czech translation needed' }
        ]
      },
      {
        url: '/cs/matches',
        name: 'Matches Page',
        checks: [
          { text: 'Completed', expectedCzech: 'Dokončeno' },
          { text: 'Showing', expectedCzech: 'Zobrazuje se' },
          { text: 'Final', expectedCzech: 'Finále' }
        ]
      },
      {
        url: '/cs/dashboard',
        name: 'Dashboard',
        checks: [
          { text: 'Live', expectedCzech: 'Živě' },
          { text: 'Watch Live', expectedCzech: 'Sledovat živě' }
        ]
      }
    ];

    const findings = [];

    for (const testCase of testCases) {
      console.log(`\n📄 Testing: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      await page.goto(`http://localhost:3000${testCase.url}`, { timeout: 30000 });
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(3000);

      for (const check of testCase.checks) {
        console.log(`\n🔍 Looking for: "${check.text}"`);
        
        try {
          // Find elements containing this text
          const elements = await page.locator(`text="${check.text}"`).all();
          const elementsContaining = await page.locator(`:text("${check.text}")`).all();
          
          console.log(`   Exact matches: ${elements.length}`);
          console.log(`   Containing matches: ${elementsContaining.length}`);
          
          if (elements.length > 0 || elementsContaining.length > 0) {
            // Get the HTML context
            const allElements = [...elements, ...elementsContaining];
            for (let i = 0; i < Math.min(allElements.length, 3); i++) {
              const element = allElements[i];
              const html = await element.innerHTML().catch(() => 'N/A');
              const outerHTML = await element.evaluate(el => el.outerHTML).catch(() => 'N/A');
              const textContent = await element.textContent().catch(() => 'N/A');
              
              findings.push({
                page: testCase.name,
                englishText: check.text,
                expectedCzech: check.expectedCzech,
                foundIn: {
                  innerHTML: html,
                  outerHTML: outerHTML.substring(0, 200) + '...',
                  textContent: textContent
                }
              });
              
              console.log(`   Found in element ${i + 1}:`);
              console.log(`   Text Content: "${textContent}"`);
              console.log(`   HTML: ${outerHTML.substring(0, 100)}...`);
            }
          } else {
            console.log(`   ✅ "${check.text}" not found - Good!`);
          }
        } catch (error) {
          console.log(`   ⚠️ Error checking "${check.text}": ${error.message}`);
        }
      }

      // Also check for common button/UI text
      const commonEnglishWords = ['Save', 'Cancel', 'Delete', 'Edit', 'Add', 'Create', 'Back'];
      console.log(`\n🔤 Checking common UI words...`);
      
      for (const word of commonEnglishWords) {
        const count = await page.locator(`text="${word}"`).count();
        if (count > 0) {
          console.log(`   ❌ Found "${word}" (${count} times)`);
          
          // Get first occurrence details
          try {
            const firstElement = page.locator(`text="${word}"`).first();
            const context = await firstElement.evaluate(el => {
              return {
                tagName: el.tagName,
                className: el.className,
                textContent: el.textContent,
                parentTag: el.parentElement?.tagName,
                parentClass: el.parentElement?.className
              };
            });
            
            console.log(`     Context: <${context.tagName.toLowerCase()} class="${context.className}">`);
            console.log(`     Parent: <${context.parentTag?.toLowerCase()} class="${context.parentClass}">`);
            
            findings.push({
              page: testCase.name,
              englishText: word,
              expectedCzech: `Translation needed for "${word}"`,
              foundIn: context
            });
          } catch (err) {
            console.log(`     Could not get context: ${err.message}`);
          }
        }
      }
    }

    // Generate detailed report
    console.log('\n' + '='.repeat(80));
    console.log('📊 DETAILED ENGLISH TEXT FINDINGS REPORT');
    console.log('='.repeat(80));
    
    console.log(`\nTotal issues found: ${findings.length}`);
    
    // Group by page
    const byPage = {};
    findings.forEach(finding => {
      if (!byPage[finding.page]) byPage[finding.page] = [];
      byPage[finding.page].push(finding);
    });

    Object.entries(byPage).forEach(([pageName, pageFindings]) => {
      console.log(`\n📄 ${pageName} (${pageFindings.length} issues):`);
      
      pageFindings.forEach((finding, index) => {
        console.log(`\n${index + 1}. English Text: "${finding.englishText}"`);
        console.log(`   Expected Czech: "${finding.expectedCzech}"`);
        
        if (typeof finding.foundIn === 'object' && finding.foundIn.tagName) {
          console.log(`   Element: <${finding.foundIn.tagName.toLowerCase()}>`);
          console.log(`   Class: "${finding.foundIn.className}"`);
          console.log(`   Text: "${finding.foundIn.textContent}"`);
        } else if (finding.foundIn?.innerHTML) {
          console.log(`   HTML Context: ${finding.foundIn.innerHTML.substring(0, 100)}...`);
        }
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎯 RECOMMENDATIONS FOR FIXES');
    console.log('='.repeat(80));

    // Analyze patterns and suggest fixes
    const commonWords = {};
    findings.forEach(finding => {
      const word = finding.englishText;
      if (!commonWords[word]) commonWords[word] = [];
      commonWords[word].push(finding.page);
    });

    console.log('\n📝 Translation Keys Needed:');
    Object.entries(commonWords).forEach(([word, pages]) => {
      const czechSuggestions = {
        'Save': 'Uložit',
        'Cancel': 'Zrušit', 
        'Delete': 'Smazat',
        'Edit': 'Upravit',
        'Add': 'Přidat',
        'Create': 'Vytvořit',
        'Back': 'Zpět',
        'Completed': 'Dokončeno',
        'Live': 'Živě',
        'Opponent Analysis': 'Analýza soupeřů',
        'Final': 'Finále'
      };
      
      console.log(`   ${word}: "${czechSuggestions[word] || 'Translation needed'}"`);
      console.log(`     Found on pages: ${[...new Set(pages)].join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }

  await browser.close();
}

findEnglishText().catch(console.error);