import { test, expect } from '@playwright/test'

// Data screens against the fake backend (tools/fake-appwrite.js): the lists must load and show real numbers.
test.skip(!process.env.FAKE_APPWRITE, 'set FAKE_APPWRITE=1 with the fake backend running')

test.use({ viewport: { width: 390, height: 844 }, isMobile: true })
const T = { timeout: 20_000 } // first render after a cold start can be slow

test('matches page loads the list (no connectivity error) with scoreboard cards', async ({ page }) => {
  await page.goto('/en/matches', { waitUntil: 'load' })
  await expect(page.getByText('Unable to load matches')).toHaveCount(0)
  await expect(page.getByText('Latal Michal').first()).toBeVisible(T)
  await expect(page.getByText(/Showing \d+ of \d+ matches/).first()).toBeVisible(T)
})

test('dashboard counts completed matches (status casing) instead of showing zeros', async ({ page }) => {
  await page.goto('/en/dashboard', { waitUntil: 'load' })
  await expect(page.getByText('Welcome back').first()).toBeVisible(T)
  // at least one won match out of the completed ones (zeros mean the status comparison broke)
  await expect(page.getByText(/[1-9]\d*\/[1-9]\d* Matches Won/).first()).toBeVisible(T)
  await expect(page.getByText('Recent Matches').first()).toBeVisible(T)
  await expect(page.getByRole('link', { name: /Resume Match/ })).toHaveAttribute('href', /\/matches\/live\//)
  await page.getByRole('main').getByText('Performance Insights', { exact: true }).click()
  await expect(page.getByRole('main').getByText('View detailed statistics')).toBeVisible()
})

test('filtering an already loaded match list does not replace results with loading skeletons', async ({ page }) => {
  await page.goto('/en/matches', { waitUntil: 'load' })
  await expect(page.getByText('Latal Michal').first()).toBeVisible(T)
  await page.getByRole('searchbox').fill('Latal')
  expect(await page.locator('.animate-pulse').count()).toBe(0)
})
