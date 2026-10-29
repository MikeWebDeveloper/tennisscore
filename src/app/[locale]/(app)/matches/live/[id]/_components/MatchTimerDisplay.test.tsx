import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchTimerDisplay } from './MatchTimerDisplay'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function render(props: Parameters<typeof MatchTimerDisplay>[0]) {
  const container = document.createElement('div')
  const root = createRoot(container)
  await act(async () => root.render(<MatchTimerDisplay {...props} />))
  return { container, cleanup: () => act(() => root.unmount()) }
}

describe('MatchTimerDisplay', () => {
  it('stops at the last recorded point while the match is interrupted', async () => {
    // Started in February and interrupted 90 minutes later; the clock must not keep counting to today.
    const { container, cleanup } = await render({ startTime: '2026-02-09T10:00:00.000Z', endTime: null, setDurations: [], isMatchComplete: false, isPaused: true, pausedAt: '2026-02-09T11:30:00.000Z' })
    expect(container.textContent).toContain('1h 30m')
    expect(container.textContent).not.toContain('●')
    cleanup()
  })

  it('hides the duration of an interrupted match with no recorded points', async () => {
    const { container, cleanup } = await render({ startTime: '2026-02-09T10:00:00.000Z', endTime: null, setDurations: [], isMatchComplete: false, isPaused: true, pausedAt: null })
    expect(container.textContent).toBe('')
    cleanup()
  })

  it('hides an implausible span when a match was resumed months after it started', async () => {
    // Real case: two points on 9 February, two more on 29 October, then interrupted
    const { container, cleanup } = await render({ startTime: '2026-02-09T18:08:00.000Z', endTime: null, setDurations: [], isMatchComplete: false, isPaused: true, pausedAt: '2026-10-29T07:12:57.000Z' })
    expect(container.textContent).not.toMatch(/\d+h/)
    cleanup()
  })

  it('labels set durations through translations', async () => {
    const { container, cleanup } = await render({ startTime: '2026-02-09T10:00:00.000Z', endTime: '2026-02-09T11:00:00.000Z', setDurations: [1_800_000], isMatchComplete: true })
    expect(container.textContent).not.toContain('Sets:')
    expect(container.textContent).toContain('common.sets')
    cleanup()
  })
})
