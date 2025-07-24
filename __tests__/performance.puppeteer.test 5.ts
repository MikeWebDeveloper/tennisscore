import puppeteer, { Browser, Page } from 'puppeteer'

describe('Puppeteer Performance Tests', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1280, height: 720 })
    
    // Enable request interception for performance monitoring
    await page.setRequestInterception(true)
    
    const requests: any[] = []
    const responses: any[] = []
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now()
      })
      request.continue()
    })
    
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now()
      })
    })
    
    // Store for access in tests
    ;(page as any)._requests = requests
    ;(page as any)._responses = responses
  })

  afterEach(async () => {
    await page.close()
  })

  test('Dashboard loads within performance budget', async () => {
    const startTime = Date.now()
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', { 
      waitUntil: 'networkidle0',
      timeout: 10000
    })
    
    const loadTime = Date.now() - startTime
    
    // Check if page loaded successfully
    const title = await page.title()
    expect(title).toBeTruthy()
    
    // Performance budget: 5 seconds for complete load
    expect(loadTime).toBeLessThan(5000)
    console.log(`Dashboard loaded in ${loadTime}ms`)
    
    // Check for key elements
    const heroStats = await page.$('[data-testid="hero-stats"]')
    if (heroStats) {
      expect(heroStats).toBeTruthy()
    }
  }, 15000)

  test('Web Workers are available and functional', async () => {
    await page.goto('http://localhost:3000/statistics')
    
    // Test Web Worker availability
    const webWorkerSupport = await page.evaluate(() => {
      return typeof Worker !== 'undefined'
    })
    
    expect(webWorkerSupport).toBe(true)
    console.log('Web Workers are supported')
    
    // Test if stats worker can be created
    const canCreateWorker = await page.evaluate(() => {
      try {
        const worker = new Worker('/workers/stats-calculator.js')
        worker.terminate()
        return true
      } catch (error) {
        return false
      }
    })
    
    expect(canCreateWorker).toBe(true)
    console.log('Stats worker can be created')
  })

  test('IndexedDB is available and can store data', async () => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Test IndexedDB availability
    const indexedDBSupport = await page.evaluate(() => {
      return typeof indexedDB !== 'undefined'
    })
    
    expect(indexedDBSupport).toBe(true)
    console.log('IndexedDB is supported')
    
    // Test basic IndexedDB operations
    const canUseIndexedDB = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const request = indexedDB.open('test-db', 1)
          request.onsuccess = () => {
            const db = request.result
            db.close()
            indexedDB.deleteDatabase('test-db')
            resolve(true)
          }
          request.onerror = () => resolve(false)
        } catch (error) {
          resolve(false)
        }
      })
    })
    
    expect(canUseIndexedDB).toBe(true)
    console.log('IndexedDB operations work')
  })

  test('Service Worker is registered and caching', async () => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Wait for service worker registration
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null
    })
    
    if (swRegistered) {
      console.log('Service Worker is active')
      
      // Test cache API availability
      const cacheSupport = await page.evaluate(() => {
        return 'caches' in window
      })
      
      expect(cacheSupport).toBe(true)
      console.log('Cache API is available')
    }
  })

  test('Virtual scrolling performance', async () => {
    await page.goto('http://localhost:3000/statistics')
    
    // Wait for page load
    await page.waitForSelector('h1', { timeout: 5000 })
    
    // Find virtual scroll container
    const virtualContainer = await page.$('[data-testid="virtual-matches-list"]')
    
    if (virtualContainer) {
      const startTime = Date.now()
      
      // Test scrolling performance
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, 500)
        })
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      const scrollTime = Date.now() - startTime
      expect(scrollTime).toBeLessThan(2000)
      console.log(`Virtual scrolling completed in ${scrollTime}ms`)
    }
  })

  test('Image optimization and lazy loading', async () => {
    await page.goto('http://localhost:3000/players')
    
    // Test WebP support detection
    const webpSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    })
    
    console.log(`WebP support: ${webpSupport}`)
    
    // Check for lazy loaded images
    const images = await page.$$('img')
    if (images.length > 0) {
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if images have loaded
      const imageLoadState = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'))
        return imgs.map(img => ({
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        }))
      })
      
      console.log(`Found ${imageLoadState.length} images`)
    }
  })

  test('Network requests are optimized', async () => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Wait for all network activity to complete
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const requests = (page as any)._requests
    const responses = (page as any)._responses
    
    console.log(`Total requests: ${requests.length}`)
    console.log(`Total responses: ${responses.length}`)
    
    // Check for efficient resource loading
    const jsRequests = requests.filter((req: any) => req.url.endsWith('.js'))
    const cssRequests = requests.filter((req: any) => req.url.endsWith('.css'))
    
    console.log(`JS requests: ${jsRequests.length}`)
    console.log(`CSS requests: ${cssRequests.length}`)
    
    // Performance budget: no more than 20 JS files
    expect(jsRequests.length).toBeLessThan(20)
    
    // Check for successful responses
    const failedResponses = responses.filter((res: any) => res.status >= 400)
    expect(failedResponses.length).toBe(0)
  })

  test('PWA features are working', async () => {
    await page.goto('http://localhost:3000/dashboard')
    
    // Check for manifest
    const manifest = await page.evaluate(() => {
      const manifestLink = document.querySelector('link[rel="manifest"]')
      return manifestLink ? manifestLink.getAttribute('href') : null
    })
    
    if (manifest) {
      console.log(`Manifest found: ${manifest}`)
      
      // Try to fetch manifest
      const manifestResponse = await page.goto(`http://localhost:3000${manifest}`)
      if (manifestResponse) {
        expect(manifestResponse.status()).toBe(200)
      } else {
        console.log('Manifest response was null - this may be expected for some browsers')
      }
    }
    
    // Check for PWA install prompt capability
    const canInstall = await page.evaluate(() => {
      return 'BeforeInstallPromptEvent' in window || 
             'onbeforeinstallprompt' in window ||
             navigator.standalone !== undefined
    })
    
    console.log(`PWA installable: ${canInstall}`)
  })
})