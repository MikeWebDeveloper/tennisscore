import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { MatchStatsComponentSimpleFixed } from './match-stats'
import { calculateMatchStats } from '@/lib/utils/match-stats'
import type { PointDetail } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const point = (n: number, extra: Partial<PointDetail>) => ({
  id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: '0-0',
  server: 'p1', serveType: 'first', rallyLength: 3, isBreakPoint: false, isSetPoint: false, isMatchPoint: false,
  isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, ...extra,
}) as PointDetail

// Player one serves; player two (the receiver) misses one return and one later ball, player one misses once
const pointLog = [
  point(1, { winner: 'p1', pointOutcome: 'unforced_error', lastShotType: 'backhand', lastShotPlayer: 'p2', winnerType: 'return' }),
  point(2, { winner: 'p1', pointOutcome: 'unforced_error', lastShotType: 'forehand', lastShotPlayer: 'p2', winnerType: 'regular' }),
  point(3, { winner: 'p2', pointOutcome: 'unforced_error', lastShotType: 'forehand', lastShotPlayer: 'p1' }),
]

it('splits unforced errors into returns and regular shots for each player', () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(MatchStatsComponentSimpleFixed, {
    stats: calculateMatchStats(pointLog), playerNames: { p1: 'Ann', p2: 'Bea' }, detailLevel: 'detailed', pointLog,
  }))))
  const label = Array.from(container.querySelectorAll('span')).find(span => span.textContent === 'common.unforcedErrors')!
  act(() => { (label.closest('.cursor-pointer') as HTMLElement).click() })
  expect(container.textContent).toContain('common.returnOrRegular')
  const row = (name: string) => Array.from(container.querySelectorAll('div.flex.justify-between'))
    .find(div => div.children.length === 3 && div.children[1].textContent === name)?.textContent
  expect(row('common.return')).toBe('0common.return1')
  expect(row('common.regular')).toBe('1common.regular1')
  act(() => root.unmount())
  container.remove()
})

describe('tappable statistics rows', () => {
  const shotTypePoints = [
    point(1, { winner: 'p1', pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p1' }),
    point(2, { winner: 'p2', pointOutcome: 'winner', lastShotType: 'backhand', lastShotPlayer: 'p2', winnerType: 'return' }),
  ]
  function render() {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(createElement(LazyMotion, { features }, createElement(MatchStatsComponentSimpleFixed, {
      stats: calculateMatchStats(shotTypePoints), playerNames: { p1: 'Ann', p2: 'Bea' }, detailLevel: 'shot-type', pointLog: shotTypePoints,
    }))))
    return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
  }

  it('marks rows that open a breakdown, so it is clear they can be tapped', () => {
    const { container, cleanup } = render()
    const winners = Array.from(container.querySelectorAll('[role="button"][aria-expanded]')).find(el => el.textContent?.includes('common.winners')) as HTMLElement
    expect(winners.getAttribute('aria-expanded')).toBe('false')
    expect(winners.querySelector('[data-expand-icon]')).not.toBeNull()
    act(() => { winners.click() })
    expect(winners.getAttribute('aria-expanded')).toBe('true')
    cleanup()
  })

  it('shows the forehand / backhand breakdown at the shot-type level and hides empty direction lists', () => {
    const { container, cleanup } = render()
    const winners = Array.from(container.querySelectorAll('[role="button"][aria-expanded]')).find(el => el.textContent?.includes('common.winners')) as HTMLElement
    act(() => { winners.click() })
    const row = (name: string) => Array.from(container.querySelectorAll('div.flex.justify-between'))
      .find(div => div.children.length === 3 && div.children[1].textContent === name)?.textContent
    expect(row('common.forehand')).toBe('1common.forehand0')
    expect(row('common.backhand')).toBe('0common.backhand1')
    // No directions are recorded at this level, so no empty "shot directions" heading
    expect(container.textContent).not.toContain('common.shotDirections')
    cleanup()
  })
})
