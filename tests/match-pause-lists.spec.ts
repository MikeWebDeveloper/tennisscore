import { test, expect } from '@playwright/test'

test.skip(!process.env.FAKE_APPWRITE || !process.env.MATCH_PAUSE_E2E, 'run separately with the isolated fake backend')

test('pause and resume preserve the score and update spectators', async ({ browser, request }) => {
  await request.get('http://localhost:4100/__reset')
  const scorerContext = await browser.newContext()
  const viewerContext = await browser.newContext()
  try {
    const scorer = await scorerContext.newPage()
    const viewer = await viewerContext.newPage()
    await scorer.goto('http://localhost:3100/en/matches/live/match4')
    await viewer.goto('http://localhost:3100/en/watch/match4')
    await expect(scorer.getByTestId('score-point').first()).toBeVisible()
    await scorer.getByRole('button', { name: 'Pause match' }).click()
    await scorer.getByRole('radio', { name: 'Rain or weather' }).check()
    await scorer.getByRole('dialog').getByRole('button', { name: 'Pause match' }).click()
    await expect(scorer.getByText('Match interrupted — Rain or weather')).toBeVisible()
    await expect(scorer.getByTestId('score-point').first()).toBeDisabled()
    await expect(viewer.getByText('Match interrupted — Rain or weather')).toBeVisible({ timeout: 15000 })
    const paused = await (await request.get('http://localhost:4100/__doc/m/match4')).json()
    expect(paused.isPaused).toBe(true)
    expect(paused.pauseReason).toBe('rain')
    expect(paused.pointLog).toHaveLength(0)
    await scorer.reload()
    await expect(scorer.getByText('Match interrupted — Rain or weather')).toBeVisible()
    await scorer.getByRole('button', { name: 'Resume match' }).click()
    await expect(scorer.getByTestId('score-point').first()).toBeEnabled()
    await expect(viewer.getByText('Live', { exact: true })).toBeVisible({ timeout: 15000 })
    const resumed = await (await request.get('http://localhost:4100/__doc/m/match4')).json()
    expect(resumed.isPaused).toBe(false)
    expect(resumed.pauseReason).toBe('')
    expect(resumed.score).toBe(paused.score)
  } finally {
    await scorerContext.close()
    await viewerContext.close()
    await request.get('http://localhost:4100/__reset')
  }
})
