const { chromium } = require('playwright');

async function deepDebug() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 DEEP DEBUG: Finding Source of English Text\n');

  // Capture all console logs
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });

  try {
    // Login first
    await page.goto('http://localhost:3000/cs/login', { timeout: 30000 });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', 'michal.latal@yahoo.co.uk');
    await page.fill('input[type="password"]', 'Mikemike88');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Go to dashboard
    await page.goto('http://localhost:3000/cs/dashboard', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📄 Dashboard loaded, starting investigation...\n');

    // 1. Check localStorage and sessionStorage
    console.log('🗄️ BROWSER STORAGE CHECK:');
    const localStorage = await page.evaluate(() => {
      const local = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        local[key] = window.localStorage.getItem(key);
      }
      return local;
    });

    const sessionStorage = await page.evaluate(() => {
      const session = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        session[key] = window.sessionStorage.getItem(key);
      }
      return session;
    });

    Object.entries(localStorage).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.includes('Save') || value.includes('Delete') || value.includes('Completed'))) {
        console.log(`   LocalStorage[${key}]: ${value.substring(0, 100)}...`);
      }
    });

    Object.entries(sessionStorage).forEach(([key, value]) => {
      if (typeof value === 'string' && (value.includes('Save') || value.includes('Delete') || value.includes('Completed'))) {
        console.log(`   SessionStorage[${key}]: ${value.substring(0, 100)}...`);
      }
    });

    // 2. Check JavaScript global variables
    console.log('\n🌐 JAVASCRIPT GLOBALS CHECK:');
    const globalVars = await page.evaluate(() => {
      const globals = {};
      const englishWords = ['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back', 'Completed', 'Live'];
      
      // Check window properties
      for (const prop in window) {
        try {
          const value = window[prop];
          if (typeof value === 'string') {
            englishWords.forEach(word => {
              if (value.includes(word)) {
                globals[`window.${prop}`] = value.substring(0, 100);
              }
            });
          } else if (typeof value === 'object' && value !== null) {
            const str = JSON.stringify(value);
            englishWords.forEach(word => {
              if (str.includes(word)) {
                globals[`window.${prop}`] = str.substring(0, 100);
              }
            });
          }
        } catch (e) {
          // Skip properties that can't be accessed
        }
      }
      
      return globals;
    });

    Object.entries(globalVars).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}...`);
    });

    // 3. Check all text nodes in DOM
    console.log('\n📝 DOM TEXT NODES ANALYSIS:');
    const textNodes = await page.evaluate(() => {
      const englishWords = ['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back', 'Completed', 'Live'];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const foundNodes = [];
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text) {
          englishWords.forEach(word => {
            if (text.includes(word)) {
              foundNodes.push({
                text: text.substring(0, 50),
                parentTag: node.parentElement?.tagName,
                parentClass: node.parentElement?.className,
                parentId: node.parentElement?.id
              });
            }
          });
        }
      }
      
      return foundNodes;
    });

    console.log(`   Found ${textNodes.length} text nodes with English words:`);
    textNodes.forEach((node, index) => {
      console.log(`   ${index + 1}. Text: "${node.text}"`);
      console.log(`      Parent: <${node.parentTag?.toLowerCase()} class="${node.parentClass}" id="${node.parentId}">`);
    });

    // 4. Check React component props and state
    console.log('\n⚛️ REACT DEVTOOLS CHECK:');
    const reactData = await page.evaluate(() => {
      // Try to access React DevTools data if available
      const reactFiber = document.querySelector('[data-reactroot]')?._reactInternalFiber ||
                         document.querySelector('#__next')?._reactInternalFiber ||
                         document.querySelector('#root')?._reactInternalFiber;
      
      if (reactFiber) {
        return 'React fiber found - would need React DevTools for detailed inspection';
      }
      
      return 'No React fiber access available';
    });

    console.log(`   ${reactData}`);

    // 5. Check CSS generated content
    console.log('\n🎨 CSS GENERATED CONTENT CHECK:');
    const cssContent = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const found = [];
      
      for (const el of elements) {
        const before = getComputedStyle(el, ':before').content;
        const after = getComputedStyle(el, ':after').content;
        
        if (before && before !== 'none' && before !== '""') {
          const content = before.replace(/"/g, '');
          if (['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back', 'Completed', 'Live'].some(word => content.includes(word))) {
            found.push({ element: el.tagName, class: el.className, content: `::before ${content}` });
          }
        }
        
        if (after && after !== 'none' && after !== '""') {
          const content = after.replace(/"/g, '');
          if (['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back', 'Completed', 'Live'].some(word => content.includes(word))) {
            found.push({ element: el.tagName, class: el.className, content: `::after ${content}` });
          }
        }
      }
      
      return found;
    });

    if (cssContent.length > 0) {
      console.log(`   Found ${cssContent.length} CSS generated content with English:`);
      cssContent.forEach((item, index) => {
        console.log(`   ${index + 1}. <${item.element.toLowerCase()} class="${item.class}"> - ${item.content}`);
      });
    } else {
      console.log('   No CSS generated content with English words found');
    }

    // 6. Console logs analysis
    console.log('\n📋 CONSOLE LOGS ANALYSIS:');
    const relevantLogs = consoleLogs.filter(log => 
      ['Save', 'Delete', 'Edit', 'Add', 'Create', 'Back', 'Completed', 'Live'].some(word => log.includes(word))
    );
    
    if (relevantLogs.length > 0) {
      console.log(`   Found ${relevantLogs.length} relevant console logs:`);
      relevantLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log}`);
      });
    } else {
      console.log('   No relevant console logs found');
    }

    console.log('\n✅ Deep debug complete!');

  } catch (error) {
    console.error('❌ Error during deep debug:', error);
  }

  await browser.close();
}

deepDebug().catch(console.error);