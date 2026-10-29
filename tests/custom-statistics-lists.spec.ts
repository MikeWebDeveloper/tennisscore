import { test, expect } from '@playwright/test'

test.skip(!process.env.FAKE_APPWRITE || !process.env.CUSTOM_STATS_E2E, 'run separately with the isolated fake backend')

test('match setup saves the selected custom statistics', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  try {
    await page.goto('/en/matches/new')
    await page.getByRole('button', { name: /Singles/ }).click()
    await page.getByRole('checkbox').nth(0).check()
    await page.getByRole('checkbox').nth(1).check()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: /Skip tournament/ }).click()
    await page.getByRole('button', { name: 'Best of 1' }).click()
    await page.getByRole('button', { name: 'Advantage', exact: true }).click()
    await page.getByRole('button', { name: 'Full set' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: /Custom statistics/ }).click()
    await page.getByRole('checkbox', { name: 'Serve placement' }).check()
    await page.getByRole('checkbox', { name: 'Rally length' }).check()
    await page.getByRole('button', { name: 'Start match', exact: true }).click()
    await page.waitForURL(/\/matches\/live\//)
    const id = page.url().split('/').pop()!
    const match = await (await request.get(`http://localhost:4100/__doc/m/${id}`)).json()
    expect(match.detailLevel).toBe('custom')
    expect(JSON.parse(match.matchFormat).customModeConfig.categories).toEqual(['serve-placement', 'rally-type'])
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})

test('custom serve statistics survive reload and appear in the match table', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  try {
    const format = JSON.stringify({ sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard', customModeConfig: { enabled: true, level: '2', categories: ['serve-placement'] } })
    await request.patch('http://localhost:4100/v1/databases/d/collections/m/documents/match4', { data: { data: { detailLevel: 'custom', matchFormat: format } } })
    await page.goto('/en/matches/live/match4')
    await page.getByTestId('score-point').first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /Aces/ }).click()
    // Aces offer net cord, out of the court and on the T; "out of the court" is stored as wide
    await expect(dialog.getByRole('button', { name: 'Net cord', exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Out of the court', exact: true }).click()
    await expect.poll(async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length).toBe(1)
    const document = await (await request.get('http://localhost:4100/__doc/m/match4')).json()
    expect(JSON.parse(document.pointLog[0]).servePlacement).toBe('wide')
    await page.getByTestId('score-point').first().click()
    await dialog.getByRole('button', { name: /^Winner/ }).click()
    await dialog.getByRole('button', { name: 'Wide', exact: true }).click()
    await expect.poll(async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length).toBe(2)
    await expect(dialog).toHaveCount(0)
    await page.goto('/en/matches/match4')
    await page.getByRole('tab', { name: /Statistics/ }).click()
    await expect(page.getByText('Serve placement — Wide')).toBeVisible()
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})

test('records all selected categories and shows only recorded values', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  try {
    const format = JSON.stringify({ sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard', customModeConfig: { enabled: true, level: '2', categories: ['serve-placement', 'serve-speed', 'return-quality', 'rally-type'] } })
    await request.patch('http://localhost:4100/v1/databases/d/collections/m/documents/match4', { data: { data: { detailLevel: 'custom', matchFormat: format } } })
    await page.goto('/en/matches/live/match4')
    await page.getByTestId('score-point').first().click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /^Winner/ }).click()
    await dialog.getByRole('button', { name: 'Wide', exact: true }).click()
    await dialog.getByRole('button', { name: 'Fast', exact: true }).click()
    await dialog.getByRole('button', { name: 'Neutral', exact: true }).click()
    await dialog.getByRole('button', { name: 'Save point', exact: true }).click()
    await expect.poll(async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length).toBe(1)
    const doc = await (await request.get('http://localhost:4100/__doc/m/match4')).json()
    expect(JSON.parse(doc.pointLog[0])).toMatchObject({ servePlacement: 'wide', customFields: { serveSpeed: 'fast', returnQuality: 'neutral', rallyLength: 3 } })
    await page.goto('/en/matches/match4')
    await page.getByRole('tab', { name: /Statistics/ }).click()
    await expect(page.getByText('Serve speed — Fast')).toBeVisible()
    await expect(page.getByText('Return quality — Neutral')).toBeVisible()
    await expect(page.getByText('Average rally: 3 shots (1 recorded)')).toBeVisible()
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})

// The live page reloads the match after every save; that reload used to strip winnerType,
// so only the latest return winner stayed a return and the earlier ones turned regular
test('every return winner stays a return after the page reloads the match', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  try {
    await request.patch('http://localhost:4100/v1/databases/d/collections/m/documents/match4', { data: { data: { detailLevel: 'detailed' } } })
    await page.goto('/en/matches/live/match4')
    const dialog = page.getByRole('dialog')
    const pointCount = async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length
    for (let i = 1; i <= 3; i++) {
      // Player one serves, so player two's winner is the receiver's
      await page.getByTestId('score-point').nth(1).click()
      await dialog.getByRole('button', { name: /^Winner/ }).click()
      await dialog.getByRole('button', { name: 'Return forehand', exact: true }).click()
      await dialog.getByRole('button', { name: 'Cross Court', exact: true }).click()
      await expect.poll(pointCount).toBe(i)
      await expect(dialog).toHaveCount(0)
    }
    // Let the post-save reload finish before reading what is stored
    await page.waitForTimeout(1500)
    const saved = (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.map((point: string) => JSON.parse(point))
    expect(saved.map((point: { winnerType?: string }) => point.winnerType)).toEqual(['return', 'return', 'return'])
    expect(saved.map((point: { lastShotType?: string }) => point.lastShotType)).toEqual(['forehand', 'forehand', 'forehand'])
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})

// A return can also end the point as the receiver's error
test('a missed return is recorded as a return error and counted in the statistics', async ({ page, request }) => {
  await request.get('http://localhost:4100/__reset')
  try {
    await request.patch('http://localhost:4100/v1/databases/d/collections/m/documents/match4', { data: { data: { detailLevel: 'detailed' } } })
    await page.goto('/en/matches/live/match4')
    const dialog = page.getByRole('dialog')
    // Player one serves and wins the point because player two missed the return
    await page.getByTestId('score-point').first().click()
    await dialog.getByRole('button', { name: /^Unforced Error/ }).click()
    await dialog.getByRole('button', { name: 'Return backhand', exact: true }).click()
    await dialog.getByRole('button', { name: 'Net', exact: true }).click()
    await expect.poll(async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length).toBe(1)
    const saved = JSON.parse((await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog[0])
    expect(saved).toMatchObject({ pointOutcome: 'unforced_error', lastShotType: 'backhand', winnerType: 'return', shotDirection: 'net' })
    await page.goto('/en/matches/match4')
    await page.getByRole('tab', { name: /Statistics/ }).click()
    await page.getByText('Unforced Errors', { exact: true }).first().click()
    await expect(page.getByText('Return or regular shot')).toBeVisible()
  } finally {
    await request.get('http://localhost:4100/__reset')
  }
})
