import { test, expect } from '@playwright/test'

// Run separately with PLAYER_CREATE_E2E=1 and one worker. Other fixture tests
// reset the same in-memory database, so this suite is excluded from normal runs.
test.skip(!process.env.FAKE_APPWRITE || !process.env.PLAYER_CREATE_E2E, 'requires a dedicated fake Appwrite run')
const FAKE = 'http://localhost:4100'
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

test.beforeEach(async ({ request, page }) => {
  // Verify that the running app actually reads this fixture before submitting a
  // create action. The opt-in flag alone cannot guarantee backend isolation.
  const marker = `Fixture${Date.now()}`
  expect((await request.get(`${FAKE}/__reset?marker=${marker}`)).ok()).toBeTruthy()
  await page.goto('/en/players')
  await expect(page.getByText(new RegExp(marker))).toHaveCount(1)
})

test.afterEach(async ({ request }) => { await request.get(`${FAKE}/__reset`) })

test('dashboard creates a player and the new profile appears in the player list', async ({ page, request }) => {
  await page.goto('/en/dashboard')
  await page.getByRole('button', { name: 'Add Player', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('input[name="firstName"]').fill('Fixture')
  await dialog.locator('input[name="lastName"]').fill('Baseline')
  await dialog.getByRole('button', { name: 'Create Player', exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.goto('/en/players')
  await expect(page.getByText(/Baseline.*Fixture/)).toHaveCount(1)
  const response = await request.get(`${FAKE}/v1/databases/d/collections/p/documents`)
  const result = await response.json()
  expect(result.documents.filter((p: { firstName: string; lastName: string }) => p.firstName === 'Fixture' && p.lastName === 'Baseline')).toHaveLength(1)
})

test('a failed save shows an error and leaves the entered details available', async ({ page, request }) => {
  await page.goto('/en/dashboard')
  await page.getByRole('button', { name: 'Add Player', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name="firstName"]').fill('Fixture')
  await dialog.locator('input[name="lastName"]').fill('Retry')
  await request.get(`${FAKE}/__fail-player-create?on=1`)
  await dialog.getByRole('button', { name: 'Create Player', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible({ timeout: 20_000 })
  await expect(dialog.locator('input[name="lastName"]')).toHaveValue('Retry')
  await request.get(`${FAKE}/__fail-player-create?on=0`)
  await dialog.getByRole('button', { name: 'Create Player', exact: true }).click()
  await expect(dialog).toBeHidden()
})

test('selecting main player leaves the existing main player untouched', async ({ page, request }) => {
  await page.goto('/en/dashboard')
  await page.getByRole('button', { name: 'Add Player', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name="firstName"]').fill('Fixture')
  await dialog.locator('input[name="lastName"]').fill('MainGuard')
  await dialog.getByRole('checkbox', { name: 'Set as Main Player' }).check()
  await dialog.getByRole('button', { name: 'Create Player', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('main player')
  const main = await (await request.get(`${FAKE}/__doc/p/pl1`)).json()
  expect(main.isMainPlayer).toBe(true)
  const result = await (await request.get(`${FAKE}/v1/databases/d/collections/p/documents`)).json()
  expect(result.documents.filter((p: { lastName: string }) => p.lastName === 'MainGuard')).toHaveLength(0)
})
