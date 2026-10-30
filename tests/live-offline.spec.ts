import { test, expect, type Page } from '@playwright/test'

// Real-browser rehearsal of the offline story on the actual scoring screen.
// Needs the fake backend (see tools/fake-appwrite.js) and an app built against it; skipped otherwise.
test.skip(!process.env.FAKE_APPWRITE, 'set FAKE_APPWRITE=1 with the fake backend running')

const FAKE = 'http://localhost:4100'
const pointButtons = (page: Page) => page.getByTestId('score-point')
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

test.afterEach(async ({ page, context }) => {
  // Stop background retries before Playwright closes the context; otherwise a
  // failed server action can leave the worker waiting on an in-flight request.
  await context.setOffline(false)
  if (!page.isClosed()) await page.goto('about:blank', { waitUntil: 'commit' })
})

test('keeps the screen awake while a match is in progress', async ({ page }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  await expect(pointButtons(page).first()).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as any).__wakeLocks)).toBeGreaterThanOrEqual(1)
})

for (const [locale, caption, first, second] of [
  ['en', 'Serve', '1st serve', '2nd serve'],
  ['cs', 'Podání', '1. podání', '2. podání'],
] as const) {
  test(`${locale}: serve buttons are labelled "${caption}", selectable, at least 44px tall and shown in the score`, async ({ page, request }) => {
    await page.goto(`/${locale}/matches/live/match4`, { waitUntil: 'networkidle' })
    const firstButton = page.getByRole('button', { name: first, exact: true })
    const secondButton = page.getByRole('button', { name: second, exact: true })
    const chip = page.locator('main [data-serve-chip]')
    await expect(page.getByRole('group', { name: caption, exact: true })).toBeVisible()
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toHaveText(first)
    expect((await firstButton.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    expect((await secondButton.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    await secondButton.click()
    await expect(secondButton).toHaveAttribute('aria-pressed', 'true')
    await expect(firstButton).toHaveAttribute('aria-pressed', 'false')
    await expect(chip).toHaveText(second)
    // Spectators see it too: the second serve is saved into the stored score
    await expect.poll(async () => JSON.parse((await (await request.get(`${FAKE}/__doc/m/match4`)).json()).score).serve, { timeout: 5000 }).toBe('second')
    await firstButton.click()
    await expect(firstButton).toHaveAttribute('aria-pressed', 'true')
    await expect(chip).toHaveText(first)
    await expect.poll(async () => JSON.parse((await (await request.get(`${FAKE}/__doc/m/match4`)).json()).score).serve, { timeout: 5000 }).toBeUndefined()
  })
}

test('point controls work from the keyboard and stay in place as points are scored', async ({ page }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  const point = pointButtons(page).first()
  await expect(point).toBeVisible()
  const initial = await point.boundingBox()
  await point.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => savedPoints(page.request)).toBe(1)
  const updated = await point.boundingBox()
  expect(initial).not.toBeNull()
  expect(updated).not.toBeNull()
  // Browser subpixel rounding and the press animation can vary by a fraction
  // of a pixel; meaningful movement of the scoring target must stay under 1px.
  expect(Math.abs(updated!.y - initial!.y)).toBeLessThan(1)
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect.poll(() => savedPoints(page.request)).toBe(0)
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
