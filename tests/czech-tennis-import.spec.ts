import { test, expect } from '@playwright/test'

test.describe('Czech Tennis Import', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
    
    // Login if needed (you might need to adjust this based on your auth flow)
    // For now, assume we can access the players page directly or are already logged in
  })

  test('should search and display Czech tennis players', async ({ page }) => {
    // Navigate to players page
    await page.goto('http://localhost:3000/cs/players')
    await page.waitForLoadState('networkidle')

    // Look for the "Create Player" or import button to open the dialog
    // You might need to adjust this selector based on your actual UI
    const createButton = page.locator('text="Vytvořit hráče"').or(page.locator('text="Create Player"')).first()
    await createButton.click()

    // Look for the "Import from Czech Rankings" button
    const importButton = page.locator('text="Import from Czech Rankings"').or(page.locator('text="Importovat z českých žebříčků"')).first()
    await importButton.click()

    // Wait for the dialog to open
    await page.waitForSelector('[role="dialog"]')
    
    // Wait for index to load
    await page.waitForFunction(() => {
      const debugText = document.querySelector('[class*="bg-muted/30"]')?.textContent
      return debugText && debugText.includes('isIndexLoading=false')
    }, { timeout: 10000 })

    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search by name"]')
    await searchInput.fill('latalova')

    // Wait a bit for debouncing
    await page.waitForTimeout(500)

    // Check if results appear
    const resultsContainer = page.locator('.space-y-2')
    
    // Look for search results or debug info
    const debugInfo = page.locator('[class*="bg-muted/30"]')
    const debugText = await debugInfo.textContent()
    
    console.log('Debug info:', debugText)

    // Check if we have results
    const hasResults = debugText?.includes('results=') && !debugText.includes('results=0')
    
    if (hasResults) {
      // Results should be visible
      await expect(resultsContainer.locator('div').first()).toBeVisible()
      
      // Should show player cards with names
      const playerCards = resultsContainer.locator('[role="button"]').or(resultsContainer.locator('.cursor-pointer'))
      await expect(playerCards.first()).toBeVisible()
    } else {
      // Print debug information
      console.log('Search did not return results. Debug info:', debugText)
      
      // Check console logs for more info
      const consoleLogs: string[] = []
      page.on('console', msg => consoleLogs.push(msg.text()))
      
      console.log('Console logs:', consoleLogs.filter(log => 
        log.includes('ChunkedPlayerSearch') || 
        log.includes('search') || 
        log.includes('mounted') ||
        log.includes('aborted')
      ))
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/results/czech-import-test.png', fullPage: true })
  })

  test('should find specific players by name', async ({ page }) => {
    // Navigate to players and open import dialog (similar setup as above)
    await page.goto('http://localhost:3000/cs/players')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('text="Vytvořit hráče"').or(page.locator('text="Create Player"')).first()
    await createButton.click()

    const importButton = page.locator('text="Import from Czech Rankings"').or(page.locator('text="Importovat z českých žebříčků"')).first()
    await importButton.click()

    await page.waitForSelector('[role="dialog"]')
    
    // Wait for index to load
    await page.waitForFunction(() => {
      const debugText = document.querySelector('[class*="bg-muted/30"]')?.textContent
      return debugText && debugText.includes('isIndexLoading=false')
    }, { timeout: 10000 })

    // Test multiple searches
    const searches = ['sofie', 'karlikova', 'latalova']
    
    for (const searchTerm of searches) {
      const searchInput = page.locator('input[placeholder*="Search by name"]')
      await searchInput.fill('')
      await searchInput.fill(searchTerm)
      
      await page.waitForTimeout(500)
      
      const debugInfo = page.locator('[class*="bg-muted/30"]')
      const debugText = await debugInfo.textContent()
      
      console.log(`Search for "${searchTerm}":`, debugText)
      
      // Take screenshot for each search
      await page.screenshot({ 
        path: `tests/results/search-${searchTerm}.png`, 
        fullPage: true 
      })
    }
  })
})