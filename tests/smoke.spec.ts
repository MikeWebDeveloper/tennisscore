import { test, expect } from '@playwright/test'

const base = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Smoke', () => {
  test('admin page renders and search present', async ({ page }) => {
    await page.goto(`${base}/en/admin`)
    await expect(page.getByRole('heading', { name: /All Matches/i })).toBeVisible()
    await expect(page.locator('input[placeholder*="Search by player name"]').first()).toBeVisible()
  })

  test('players page renders', async ({ page }) => {
    await page.goto(`${base}/cs/players`)
    await expect(page.locator('body')).toBeVisible()
  })
})
