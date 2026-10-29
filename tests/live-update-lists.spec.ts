import { test, expect } from '@playwright/test'

// This mutates only the isolated fake fixture, so run it separately.
test.skip(!process.env.FAKE_APPWRITE || !process.env.LIVE_UPDATE_E2E, 'run separately with the isolated fake backend')

test('compact spectator score updates without reloading the document', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  let loads = 0
  page.on('domcontentloaded', () => { loads += 1 })
  try {
    await page.goto('/en/watch/match1')
    const points = page.locator('[data-side="p1"] [data-points]')
    await expect(points).toHaveText('30')
    // A spectator has no direct Appwrite access; the server endpoint must supply updates.
    await page.route('http://localhost:4100/**', route => route.abort())
    const response = await request.patch('http://localhost:4100/v1/databases/d/collections/m/documents/match1', {
      data: { data: { score: JSON.stringify({ sets: [[6, 4]], games: [2, 1], points: [1, 3], isTiebreak: false, tiebreakPoints: [0, 0] }) } },
    })
    expect(response.ok()).toBe(true)
    await expect(points).toHaveText('15', { timeout: 15_000 })
    expect(loads).toBe(1)
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})
