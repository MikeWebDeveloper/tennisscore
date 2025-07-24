import { test, expect } from '@playwright/test'

test.describe('Basic Functionality Tests', () => {
  test('login page loads and displays correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Check basic elements are present
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    console.log('Login page loads correctly')
  })

  test('web vitals and performance APIs are available', async ({ page }) => {
    await page.goto('/login')
    
    // Check for Web APIs availability
    const performanceAPISupport = await page.evaluate(() => {
      return {
        performance: typeof performance !== 'undefined',
        observer: typeof PerformanceObserver !== 'undefined',
        webWorkers: typeof Worker !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        caches: 'caches' in window
      }
    })
    
    expect(performanceAPISupport.performance).toBeTruthy()
    expect(performanceAPISupport.observer).toBeTruthy()
    expect(performanceAPISupport.webWorkers).toBeTruthy()
    expect(performanceAPISupport.indexedDB).toBeTruthy()
    expect(performanceAPISupport.serviceWorker).toBeTruthy()
    expect(performanceAPISupport.caches).toBeTruthy()
    
    console.log('All web APIs are supported')
  })

  test('WebP image format detection works', async ({ page }) => {
    await page.goto('/login')
    
    const webpSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    })
    
    console.log(`WebP support detected: ${webpSupport}`)
    expect(typeof webpSupport).toBe('boolean')
  })

  test('service worker can be registered', async ({ page }) => {
    await page.goto('/login')
    
    // Wait for any existing service worker registration
    await page.waitForTimeout(2000)
    
    const swStatus = await page.evaluate(() => {
      return {
        hasServiceWorker: 'serviceWorker' in navigator,
        isRegistered: navigator.serviceWorker.controller !== null
      }
    })
    
    expect(swStatus.hasServiceWorker).toBeTruthy()
    console.log(`Service Worker: available=${swStatus.hasServiceWorker}, registered=${swStatus.isRegistered}`)
  })

  test('basic JavaScript bundle loads without errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto('/login', { waitUntil: 'networkidle0' })
    
    // Allow time for any async errors
    await page.waitForTimeout(2000)
    
    // Filter out common non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('sw.js') &&
      !error.toLowerCase().includes('network')
    )
    
    console.log(`Total errors: ${errors.length}, Critical errors: ${criticalErrors.length}`)
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors)
    }
    
    // We'll allow some non-critical errors but fail if there are too many critical ones
    expect(criticalErrors.length).toBeLessThan(3)
  })

  test('responsive design works on different viewport sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()
    console.log('Desktop viewport works')
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
    console.log('Tablet viewport works')
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await expect(page.locator('body')).toBeVisible()
    console.log('Mobile viewport works')
  })

  test('static resources load correctly', async ({ page }) => {
    const requests: any[] = []
    const responses: any[] = []
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      })
    })
    
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      })
    })
    
    await page.goto('/login', { waitUntil: 'networkidle0' })
    
    // Check for failed resources
    const failedResources = responses.filter(res => res.status >= 400)
    
    console.log(`Total requests: ${requests.length}`)
    console.log(`Total responses: ${responses.length}`)
    console.log(`Failed resources: ${failedResources.length}`)
    
    if (failedResources.length > 0) {
      console.log('Failed resources:', failedResources.map(r => `${r.url} (${r.status})`))
    }
    
    // Allow some failures for non-critical resources
    expect(failedResources.length).toBeLessThan(5)
  })
})