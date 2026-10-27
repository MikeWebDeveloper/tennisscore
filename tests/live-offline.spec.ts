import { test, expect, type Page } from '@playwright/test'

// Real-browser rehearsal of the offline story on the actual scoring screen.
// Needs the fake backend (see tools/fake-appwrite.js) and an app built against it; skipped otherwise.
test.skip(!process.env.FAKE_APPWRITE, 'set FAKE_APPWRITE=1 with the fake backend running')

const FAKE = 'http://localhost:4100'
const pointButtons = (page: Page) => page.locator('div.cursor-pointer.h-32')
const badge = (page: Page) => page.locator('[data-sync-state]')
const savedPoints = async (request: any) => {
  const doc = await (await request.get(`${FAKE}/__doc/m/match4`)).json()
  return (doc.pointLog as string[]).length
}

test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

test.beforeEach(async ({ request, page }) => {
  await request.get(`${FAKE}/__reset`)
  // Count Screen Wake Lock requests (the headless browser has no real lock)
  await page.addInitScript(() => {
    ;(window as any).__wakeLocks = 0
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: async () => { (window as any).__wakeLocks++; return { release: async () => {}, addEventListener() {} } } },
    })
  })
})

test('keeps the screen awake while a match is in progress', async ({ page }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  await expect(pointButtons(page).first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as any).__wakeLocks)).toBeGreaterThanOrEqual(1)
})

test('network drops mid-match: badge shows "unsent", then everything syncs when back online', async ({ page, context, request }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  await expect(pointButtons(page).first()).toBeVisible()

  await pointButtons(page).first().click()
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'synced')
  expect(await savedPoints(request)).toBe(1)

  await context.setOffline(true)
  await pointButtons(page).first().click()
  await pointButtons(page).nth(1).click()
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'unsent', { timeout: 20_000 })
  expect(await savedPoints(request)).toBe(1) // nothing new reached the server

  await context.setOffline(false)
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'synced', { timeout: 30_000 })
  await expect.poll(() => savedPoints(request), { timeout: 30_000 }).toBe(3)
})

test('server outage + page reload: unsent points survive in the browser and are pushed later', async ({ page, request }) => {
  test.setTimeout(240_000) // retries run on a 10 s timer; CI runners are slower than a laptop
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  await expect(pointButtons(page).first()).toBeVisible()
  await pointButtons(page).first().click()
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'synced')

  await request.get(`${FAKE}/__fail?on=1`)
  await pointButtons(page).first().click()
  await pointButtons(page).first().click()
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'unsent', { timeout: 90_000 })
  expect(await savedPoints(request)).toBe(1)

  // Reload while the backend is still down: the server copy has 1 point, the browser has 3
  await page.waitForTimeout(500) // let the IndexedDB write settle
  // The page keeps retrying the failed save, so the network is never idle: wait for the UI instead
  await page.reload({ waitUntil: 'load' })
  await expect(pointButtons(page).first()).toBeVisible()

  // Backend recovers; the recovered local progress is pushed
  await request.get(`${FAKE}/__fail?on=0`)
  await expect.poll(() => savedPoints(request), { timeout: 40_000 }).toBe(3)
  await expect(badge(page)).toHaveAttribute('data-sync-state', 'synced', { timeout: 30_000 })
})
