import { test, expect, type Page } from '@playwright/test'

// Runs with the PLAYWRIGHT=1 auth bypass. Page data may fail to load without a backend;
// these tests only cover the app shell, which must render regardless.

const html = (page: Page) => page.evaluate(() => document.documentElement.className)
const setTheme = (page: Page, theme: string) =>
  page.addInitScript((t) => { if (!localStorage.getItem('theme')) localStorage.setItem('theme', t) }, theme)

test.describe('mobile shell (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  for (const locale of ['en', 'cs']) {
    test(`${locale}: one <main>, no horizontal overflow, flat tab bar`, async ({ page }) => {
      await page.goto(`/${locale}/matches`, { waitUntil: 'networkidle' })
      await expect(page.locator('main')).toHaveCount(1)

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)

      const tabBar = page.locator('nav.fixed.bottom-0')
      await expect(tabBar).toBeVisible()
      await expect(tabBar.locator('a')).toHaveCount(5) // 4 destinations + New

      // No tab label may be clipped by truncation (long Czech words)
      const clipped = await tabBar.locator('span.truncate').evaluateAll((els) =>
        els.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent)
      )
      expect(clipped).toEqual([])
    })
  }

  test('tab bar links navigate in one tap', async ({ page }) => {
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    await page.locator('nav.fixed.bottom-0 a[href$="/players"]').click()
    await expect(page).toHaveURL(/\/en\/players/)
  })

  test('drawer opens and closes, and locks page scroll while open', async ({ page }) => {
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    await expect(page.locator('aside.fixed.left-0.z-50')).toBeVisible()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await page.getByRole('button', { name: 'Collapse navigation' }).click()
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('')
  })

  test('header button cycles dark → dim → light and persists across reload', async ({ page }) => {
    await setTheme(page, 'dark')
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    const cycle = page.getByRole('button', { name: 'Change theme' })
    expect(await html(page)).toMatch(/\bdark\b/)
    await cycle.click()
    expect(await html(page)).toMatch(/\bdim\b/)
    await cycle.click()
    expect(await html(page)).toMatch(/\blight\b/)
    await page.reload({ waitUntil: 'networkidle' })
    expect(await html(page)).toMatch(/\blight\b/)
  })

  test('each theme has a distinct page background', async ({ browser }) => {
    const seen = new Set<string>()
    for (const theme of ['dark', 'dim', 'light']) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      await setTheme(page, theme)
      await page.goto('/en/matches', { waitUntil: 'networkidle' })
      seen.add(await page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      await ctx.close()
    }
    expect(seen.size).toBe(3)
  })
})

test.describe('desktop shell (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('sidebar, single <main>, theme picker', async ({ page }) => {
    await setTheme(page, 'dark')
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('nav.fixed.bottom-0')).toBeHidden()
    await page.getByRole('radio', { name: 'Light' }).click()
    expect(await html(page)).toMatch(/\blight\b/)
    await expect(page.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true')
  })

  test('"N" opens new match, but not while typing in a field', async ({ page }) => {
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    await page.keyboard.press('n')
    await expect(page).toHaveURL(/\/matches\/new/)

    await page.goto('/en/matches/new', { waitUntil: 'networkidle' })
    const input = page.locator('input[type="text"], input:not([type])').first()
    if (await input.count()) {
      await input.focus()
      await page.keyboard.press('n')
      await expect(page).toHaveURL(/\/matches\/new/)
    }
  })

  test('print stylesheet hides app chrome', async ({ page }) => {
    await page.goto('/en/matches', { waitUntil: 'networkidle' })
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('aside').first()).toBeHidden()
  })
})
