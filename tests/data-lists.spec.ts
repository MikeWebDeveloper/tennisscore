import { test, expect } from '@playwright/test'
import fs from 'node:fs'

// Settings "Your data" and the doubles serve card, on the fake backend
test.skip(!process.env.FAKE_APPWRITE, 'requires the fake Appwrite backend')


// Read-only: no reset, which would wipe what tests in the other worker just created
test('settings exports every match as a CSV and shows the trash', async ({ page }) => {
  await page.goto('/en/settings', { waitUntil: 'load' })
  const main = page.locator('main')
  await expect(main.getByRole('heading', { name: 'Your data' })).toBeVisible()
  await expect(main.getByText('The trash is empty.')).toBeVisible({ timeout: 15_000 })
  const [download] = await Promise.all([page.waitForEvent('download'), main.getByRole('button', { name: 'Download CSV' }).click()])
  expect(download.suggestedFilename()).toMatch(/^tenis-click-\d{4}-\d{2}-\d{2}\.csv$/)
  const csv = fs.readFileSync((await download.path())!, 'utf8')
  expect(csv.charCodeAt(0)).toBe(0xfeff)
  const lines = csv.slice(1).trim().split('\r\n')
  expect(lines[0]).toBe('ID,Date,Tournament,Type,Player / team 1,Player / team 2,Score,Status,Winner,End reason,Detail level,Points')
  expect(lines.length).toBeGreaterThan(3)
  expect(csv).toContain('match3,')
})

test('a doubles match shows each partner\'s own serve points', async ({ page }) => {
  await page.goto('/en/matches/match2', { waitUntil: 'load' })
  const card = page.locator('main section', { has: page.getByRole('heading', { name: 'Serve by player' }) })
  await expect(card).toBeVisible({ timeout: 15_000 })
  await expect(card.locator('[data-doubles-serve-row]')).toHaveCount(1)
  await expect(card).toContainText('Points on serve 4/4 (100 %)')
})
