import { test, expect } from '@playwright/test'
import fs from 'node:fs'

// The match overview dashboard, the flow tab and the PDF report, on the fake sample "insights1":
// Latal beats Novotný 6:3 6:4, holding from 0:40 in the third game. Read-only.
// Everything is looked up inside <main>: while Next.js streams the page, a hidden copy of the
// content sits under <body> for a moment. The fake backend leaves short sample player ids
// unresolved, so names show as "Neznámý hráč" here.
test.skip(!process.env.FAKE_APPWRITE, 'requires the fake Appwrite backend')

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('shows the dashboard in Czech without sideways scrolling', async ({ page }) => {
    await page.goto('/cs/matches/insights1')
    const dashboard = page.locator('main [data-match-dashboard]')
    await expect(dashboard).toBeVisible()
    await expect(dashboard.getByText('Průběh zápasu')).toBeVisible()
    await expect(dashboard.locator('[data-momentum-chart] svg')).toBeVisible()
    await expect(dashboard.locator('[data-set-row]')).toHaveCount(2)
    await expect(dashboard.locator('[data-game-tile]')).toHaveCount(19)
    await expect(dashboard.locator('[data-moments]')).toContainText('Obrat z 0:40')
    await expect(dashboard.locator('[data-key-numbers]')).toContainText('Vyhrané body')
    // Nothing wider than the phone
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('lists every game on the flow tab', async ({ page }) => {
    await page.goto('/cs/matches/insights1')
    await page.getByRole('tab', { name: 'Průběh' }).click()
    const games = page.locator('main [data-flow-game]')
    await expect(games).toHaveCount(19)
    await expect(games.nth(2)).toContainText('obrat z 0:40')
    await expect(games.nth(2)).toContainText('podává')
    await expect(games.nth(2)).toContainText('3 brejkboly zachráněny')
  })
})

test('downloads the match report as a PDF with Czech letters', async ({ page }) => {
  await page.goto('/cs/matches/insights1')
  await expect(page.locator('main [data-match-dashboard]')).toBeVisible()
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    page.locator('main [data-match-dashboard] [data-pdf-export]').click(),
  ])
  // Plain letters only, so every phone and mail client keeps the name
  expect(download.suggestedFilename()).toMatch(/^tenis-click-[a-z0-9-]+-2026-10-26\.pdf$/)
  const file = await download.path()
  const bytes = fs.readFileSync(file!)
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  // Three pages and the embedded Inter font (the built-in PDF fonts have no ř or ů)
  expect(bytes.toString('latin1').match(/\/Type \/Page\b/g)?.length).toBe(3)
  expect(bytes.toString('latin1')).toContain('Inter')
})
