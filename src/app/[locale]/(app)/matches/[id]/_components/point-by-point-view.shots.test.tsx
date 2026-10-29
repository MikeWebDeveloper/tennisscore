import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PointByPointView } from './point-by-point-view'
import type { PointDetail } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const point = (n: number, extra: Partial<PointDetail>) => ({
  id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: `${15 * n}-0`,
  server: 'p1', serveType: 'first', rallyLength: 3, isBreakPoint: false, isSetPoint: false, isMatchPoint: false,
  isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, ...extra,
}) as PointDetail

const pointLog = [
  point(1, { winner: 'p2', pointOutcome: 'winner', lastShotType: 'forehand', winnerType: 'return', shotDirection: 'cross' }),
  point(2, { winner: 'p1', pointOutcome: 'ace', lastShotType: 'serve', servePlacement: 'net-cord' }),
  point(3, { winner: 'p1', serveType: 'second', pointOutcome: 'unforced_error', lastShotType: 'backhand', shotDirection: 'net' }),
]

function render(detailLevel: 'simple' | 'shot-type' | 'detailed') {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PointByPointView pointLog={pointLog} playerNames={{ p1: 'Ann', p2: 'Bea' }} detailLevel={detailLevel} />))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('point log shows what ended each point', () => {
  // The shot, return, direction and ace placement show whenever they were recorded, at any level
  for (const level of ['simple', 'shot-type', 'detailed'] as const) {
    it(`lists the shot under the outcome at the ${level} level`, () => {
      const { container, cleanup } = render(level)
      const shots = Array.from(container.querySelectorAll('[data-point-shot]'), el => el.textContent)
      // A phrase: shot then direction in lower case ("Return forhend křížem", "Bekhend do sítě")
      expect(shots).toEqual(expect.arrayContaining(['common.returnForehand common.crosscourt', 'common.serveNetCord', 'common.backhand common.intonet']))
      cleanup()
    })
  }

  it('names the serve in the page language instead of 1st / 2nd', () => {
    const { container, cleanup } = render('detailed')
    expect(container.textContent).toContain('common.firstServeShort')
    expect(container.textContent).toContain('common.secondServeShort')
    expect(container.textContent).not.toMatch(/\b(1st|2nd)\b/)
    cleanup()
  })

  it('switches between compact and list views with labelled buttons instead of a bare toggle', () => {
    const { container, cleanup } = render('shot-type')
    expect(container.querySelector('[role="switch"]')).toBeNull()
    expect(container.querySelector('button[aria-label="common.compactView"]')).not.toBeNull()
    expect(container.querySelector('button[aria-label="common.listView"]')).not.toBeNull()
    cleanup()
  })
})
