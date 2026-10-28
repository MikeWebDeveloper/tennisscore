import { test, expect } from '@playwright/test'

test.skip(!process.env.FAKE_APPWRITE, 'requires the local fake Appwrite backend')

test('statistics renders finite match-pattern numbers for saved array scores', async ({ page }) => {
  await page.goto('/en/statistics')
  await expect(page.getByText('Games per Match', { exact: true }).first()).toBeVisible()
  await expect(page.locator('main')).not.toContainText('NaN')
  await expect(page.locator('main')).not.toContainText('Infinity')
})
