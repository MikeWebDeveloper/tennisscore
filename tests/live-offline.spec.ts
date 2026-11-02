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

test('corrects a point scored for the wrong player, and the score and saved log follow', async ({ page, request }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  // Player one wins three points, but the scorer tapped the wrong side for the first one
  for (let i = 0; i < 3; i++) {
    await pointButtons(page).first().click()
    await expect.poll(() => savedPoints(request)).toBe(i + 1)
  }
  await page.getByRole('tab', { name: 'Points' }).click()
  await page.locator('button[data-edit-point]').last().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Correct point 1' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Save correction' }).click()
  await expect(page.getByText('Point corrected, score recalculated')).toBeVisible()
  await expect.poll(async () => {
    const doc = await (await request.get(`${FAKE}/__doc/m/match4`)).json()
    return (doc.pointLog as string[]).map(point => JSON.parse(point).winner).join(',')
  }).toBe('p2,p1,p1')
  await expect.poll(async () => JSON.parse((await (await request.get(`${FAKE}/__doc/m/match4`)).json()).score).points).toEqual([2, 1])
})

test('the share dialog shows a QR code of the watch link for people at the court', async ({ page }) => {
  await page.goto('/en/matches/live/match4', { waitUntil: 'networkidle' })
  await page.locator('main').getByRole('button', { name: 'Share', exact: true }).click()
  const code = page.getByRole('dialog').getByRole('img', { name: 'Scan to watch the match live' })
  await expect(code).toBeVisible()
  await expect(code).toHaveAttribute('src', /^data:image\/png;base64,/)
  expect((await code.boundingBox())?.width).toBeGreaterThanOrEqual(150)
})

// Here rather than in its own file: this file's tests run one after another after each reset,
// so no other test can reset the fake backend while the new match is checked
test('a finished match starts its rematch with one tap, with the same players and rules', async ({ page, request }) => {
  await page.goto('/en/matches/match3', { waitUntil: 'load' })
  await page.locator('main').getByRole('link', { name: 'Rematch' }).first().click()
  await expect(page).toHaveURL(/\/en\/matches\/new\?rematch=match3/)
  const main = page.locator('main')
  await expect(main.getByRole('heading', { name: 'Rematch' })).toBeVisible()
  await expect(main.getByText('Latal Michal')).toBeVisible()
  await expect(main.getByText('Dvořák Petr')).toBeVisible()
  await main.getByRole('button', { name: 'Start match' }).click()
  await page.waitForURL(/\/en\/matches\/live\/(?!match3)[^/]+$/)
  const id = page.url().split('/').pop()
  const saved = await (await request.get(`${FAKE}/__doc/m/${id}`)).json()
  expect(saved).toMatchObject({ playerOneId: 'pl1', playerTwoId: 'pl2', status: 'In Progress' })
  expect(JSON.parse(saved.matchFormat)).toMatchObject({ sets: 3, noAd: false, finalSetTiebreak: 'standard' })
})
