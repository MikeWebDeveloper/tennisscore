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

// The body is a scroll container (overflow-x: hidden); overscroll-behavior on it stopped the
// mouse wheel from ever reaching the page, so on a PC only dragging the scrollbar worked
test.describe('desktop mouse wheel', () => {
  test.use({ viewport: { width: 1280, height: 600 } })
  for (const path of ['/en/dashboard', '/cs/statistics', '/en/matches/match3']) {
    test(`scrolls ${path} with the mouse wheel`, async ({ page }) => {
      await page.goto(path)
      // Wait for content tall enough to scroll (networkidle can hang on pages that keep polling)
      await expect.poll(() => page.evaluate(() => document.scrollingElement!.scrollHeight > innerHeight + 50)).toBe(true)
      await page.mouse.move(700, 350)
      await page.mouse.wheel(0, 400)
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
    })
  }
})

// A tappable statistics row used to get the phone touch-target layout, which collapsed its bar to 2px
test.describe('statistics on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  test('tappable rows keep a full-width comparison bar', async ({ page }) => {
    await page.goto('/en/matches/match1')
    await page.getByRole('tab', { name: /Statistics/ }).click()
    const row = page.locator('[data-stat-toggle]').first()
    await expect(row).toBeVisible()
    const barWidth = await row.locator('[data-comparison-bar]').evaluate(el => el.getBoundingClientRect().width)
    expect(barWidth).toBeGreaterThan(150)
  })
})
