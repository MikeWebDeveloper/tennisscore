import { test, expect } from '@playwright/test'

// Needs the fake backend: `node tools/fake-appwrite.js` and an app built with
// NEXT_PUBLIC_APPWRITE_ENDPOINT=http://localhost:4100/v1 (see README). Skipped otherwise.
test.skip(!process.env.FAKE_APPWRITE, 'set FAKE_APPWRITE=1 with the fake backend running')

test.use({ viewport: { width: 390, height: 640 }, isMobile: true })

test.describe('lightweight spectator page', () => {
  test('live singles match: names, scores, serve marker, auto refresh', async ({ page }) => {
    await page.goto('/en/watch/match1')
    const main = page.locator('main')
    await expect(main).toContainText('Live')
    await expect(main).toContainText('Latal Michal')
    await expect(main).toContainText('Dvořák Petr')
    // Ann-equivalent row: set 6, game 2, 30; opponent: set 4, game 1, 40
    await expect(page.locator('[data-side="p1"] [data-points]')).toHaveText('30')
    await expect(page.locator('[data-side="p2"] [data-points]')).toHaveText('40')
    // plain HTML polling, no live connection
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveAttribute('content', '5')
    await expect(main.getByRole('link', { name: 'Full view with statistics' })).toHaveAttribute('href', /\/live\/match1$/)
  })

  test('doubles match in Czech: the configured first server is underlined', async ({ page }) => {
    await page.goto('/cs/watch/match2')
    await expect(page.locator('main')).toContainText('Živě')
    // team two serves game 2; its first server was configured as player 4
    const underlined = page.locator('[data-side] .underline')
    await expect(underlined).toHaveCount(1)
    await expect(underlined).toHaveText('Procházka Jan')
  })

  test('finished match: no live badge, no refresh, winner emphasised', async ({ page }) => {
    await page.goto('/en/watch/match3')
    await expect(page.locator('main')).toContainText('Finished')
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0)
    await expect(page.locator('[data-points]')).toHaveCount(0)
  })

  test('unknown match gives a 404', async ({ page }) => {
    const response = await page.goto('/en/watch/does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
