import { test, expect } from '@playwright/test'

// Rematch on the fake backend: the finished sample "match3" (Latal vs Dvořák) starts again with one tap.
test.skip(!process.env.FAKE_APPWRITE, 'requires the fake Appwrite backend')

const FAKE = 'http://localhost:4100'
test.use({ viewport: { width: 390, height: 844 }, isMobile: true })

test('a finished match starts its rematch with one tap, with the same players and rules', async ({ page, request }) => {
  await request.get(`${FAKE}/__reset`)
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
