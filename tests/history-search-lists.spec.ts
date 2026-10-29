import { test, expect } from '@playwright/test'

// The fixture is modified here; run this scenario separately.
test.skip(!process.env.FAKE_APPWRITE || !process.env.HISTORY_SEARCH_E2E, 'run separately with the isolated fake backend')

test('search finds an opponent beyond the first 30 matches', async ({ page, request }) => {
  await request.get('http://localhost:4100/__seed-search')
  try {
    await page.goto('/en/matches')
    await page.getByRole('searchbox').fill('Opponent')
    await expect(page.getByRole('link', { name: /Opponent Old/ })).toBeVisible({ timeout: 15_000 })
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})
