import { test, expect } from '@playwright/test'

// Shared Input styles on an authenticated page, using fixtures instead of real credentials.
test.skip(!process.env.FAKE_APPWRITE, 'requires the local fake Appwrite player list')

test.describe('iPhone form viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  for (const locale of ['en', 'cs']) {
    test(`${locale}: form controls do not trigger focus zoom and the viewport fits the screen`, async ({ page }) => {
      await page.goto(`/${locale}/players`)
      const controls = page.locator('main input[role="searchbox"]:visible')
      await expect(controls).toHaveCount(1)
      for (const control of await controls.all()) await expect(control).toHaveCSS('font-size', '16px')
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
      expect(viewport).toContain('width=device-width')
      expect(viewport).toContain('initial-scale=1')
      expect(viewport).toContain('viewport-fit=cover')
      expect(viewport).not.toContain('user-scalable=no')
      expect(viewport).not.toContain('maximum-scale=1')
      await controls.last().focus()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })
  }
})

test.describe('landscape touch viewport', () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })
  test('keeps shared input fields at 16px when a phone rotates', async ({ page }) => {
    await page.goto('/en/players')
    await expect(page.locator('main input[role="searchbox"]:visible').first()).toHaveCSS('font-size', '16px')
  })
})

test('desktop keeps compact form typography', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/en/players')
  await expect(page.locator('main input[role="searchbox"]:visible').first()).toHaveCSS('font-size', '14px')
})
