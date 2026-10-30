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

// Ending early keeps the score reached on court and names the reason; weather is an interruption, not an ending
test('ending a match after a retirement keeps the court score and shows the reason', async ({ browser, request }) => {
  await request.get('http://localhost:4100/__reset')
  const scorerContext = await browser.newContext()
  try {
    const scorer = await scorerContext.newPage()
    await scorer.goto('http://localhost:3100/en/matches/live/match4')
    await expect(scorer.getByTestId('score-point').first()).toBeVisible()
    // Play to 1:0 in games, 30:0 in the next game (the points-only level logs a point per tap)
    const pointsSaved = async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).pointLog.length
    for (let i = 1; i <= 6; i++) {
      await scorer.getByTestId('score-point').first().click()
      await expect.poll(pointsSaved).toBe(i)
    }
    // Some time passes before the scorer ends the match; it must not count as play
    await scorer.waitForTimeout(2500)
    await scorer.getByRole('button', { name: 'End Match' }).click()
    const dialog = scorer.getByRole('dialog')
    await expect(dialog.getByRole('radio', { name: 'Weather conditions' })).toHaveCount(0)
    await dialog.getByRole('radio', { name: 'Player retired' }).check()
    await expect(dialog.getByText('The score stays as played on court')).toBeVisible()
    await dialog.getByRole('radio', { name: /Latal/ }).check()
    await dialog.getByRole('button', { name: 'End Match' }).click()
    await expect.poll(async () => (await (await request.get('http://localhost:4100/__doc/m/match4')).json()).status).toBe('Completed')
    const ended = await (await request.get('http://localhost:4100/__doc/m/match4')).json()
    expect(ended.retirementReason).toBe('retired')
    expect(ended.winnerId).toBe('pl1')
    const score = JSON.parse(ended.score)
    // Not the old forced 1:0 in sets
    expect(score.sets).toEqual([])
    expect(score.games).toEqual([1, 0])
    expect(score.points).toEqual([2, 0])
    expect(ended.pointLog).toHaveLength(6)
    // The match ended with its last point, not when End Match was confirmed
    const lastPoint = ended.pointLog[5]
    const lastPointTime = (typeof lastPoint === 'string' ? JSON.parse(lastPoint) : lastPoint).timestamp
    expect(new Date(ended.endTime).toISOString()).toBe(new Date(lastPointTime).toISOString())
    const viewer = await scorerContext.newPage()
    await viewer.goto('http://localhost:3100/en/live/match4')
    await expect(viewer.getByText('Completed — Player retired')).toBeVisible()
  } finally {
    await scorerContext.close()
    await request.get('http://localhost:4100/__reset')
  }
})
