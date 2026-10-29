import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { MatchStatsComponentSimpleFixed } from './match-stats'
import { calculateMatchStats } from '@/lib/utils/match-stats'
import type { PointDetail } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const point = (n: number, extra: Partial<PointDetail>) => ({
  id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: '0-0',
  serveType: 'first', rallyLength: 1, isBreakPoint: false, isSetPoint: false, isMatchPoint: false,
  isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, lastShotType: 'serve', ...extra,
}) as PointDetail

const ace = (n: number, server: 'p1' | 'p2', servePlacement?: PointDetail['servePlacement']) =>
  point(n, { winner: server, server, lastShotPlayer: server, pointOutcome: 'ace', serveOutcome: 'ace', ...(servePlacement && { servePlacement }) })

function renderExpanded(pointLog: PointDetail[], label: string) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(MatchStatsComponentSimpleFixed, {
    stats: calculateMatchStats(pointLog), playerNames: { p1: 'Ann', p2: 'Bea' }, detailLevel: 'detailed', pointLog,
  }))))
  const heading = Array.from(container.querySelectorAll('span')).find(span => span.textContent === label)!
  act(() => { (heading.closest('.cursor-pointer') as HTMLElement).click() })
  const row = (name: string) => Array.from(container.querySelectorAll('div.flex.justify-between'))
    .find(div => div.children.length === 3 && div.children[1].textContent === name)?.textContent
  return { container, row, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

// PDF item 3: aces land on the net cord, out of the court or on the T
it('lists every ace placement with the ace wording, including ones not used yet', () => {
  const { container, row, cleanup } = renderExpanded([ace(1, 'p1', 'net-cord'), ace(2, 'p1', 'wide'), ace(3, 'p2', 't')], 'common.aces')
  expect(row('common.serveNetCord')).toBe('1common.serveNetCord0')
  expect(row('common.serveOutOfCourt')).toBe('1common.serveOutOfCourt0')
  expect(row('common.serveOnTheT')).toBe('0common.serveOnTheT1')
  // Not the double-fault wording for the same saved values (inside the expanded aces breakdown)
  const breakdown = Array.from(container.querySelectorAll('h4')).find(h => h.textContent === 'common.servePlacement')!.parentElement!
  expect(breakdown.textContent).not.toContain('common.tDownTheMiddle')
  expect(breakdown.textContent).not.toContain('common.wide')
  cleanup()
})

it('counts aces logged without a placement (shot-type level) instead of showing nothing', () => {
  const { row, cleanup } = renderExpanded([ace(1, 'p1'), ace(2, 'p2'), ace(3, 'p2')], 'common.aces')
  expect(row('common.placementNotRecorded')).toBe('1common.placementNotRecorded2')
  expect(row('common.serveNetCord')).toBe('0common.serveNetCord0')
  cleanup()
})

it('keeps the wide / body / down-the-middle wording for double faults', () => {
  const fault = point(1, { winner: 'p2', server: 'p1', serveType: 'second', lastShotPlayer: 'p1', pointOutcome: 'double_fault', serveOutcome: 'double_fault', servePlacement: 'body' })
  const { row, cleanup } = renderExpanded([fault], 'common.doubleFaults')
  expect(row('common.body')).toBe('1common.body0')
  expect(row('common.wide')).toBe('0common.wide0')
  expect(row('common.tDownTheMiddle')).toBe('0common.tDownTheMiddle0')
  cleanup()
})

it('shows the detailed serve card with the new ace placements and no English labels', () => {
  const fault = point(4, { winner: 'p1', server: 'p2', serveType: 'second', lastShotPlayer: 'p2', pointOutcome: 'double_fault', serveOutcome: 'double_fault', servePlacement: 'wide', isBreakPoint: true })
  const error = point(5, { winner: 'p1', server: 'p1', lastShotPlayer: 'p2', pointOutcome: 'unforced_error', lastShotType: 'forehand', shotDirection: 'net', rallyLength: 3 })
  const pointLog = [ace(1, 'p1', 'net-cord'), ace(2, 'p1', 'wide'), ace(3, 'p1', 't'), fault, error]
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(MatchStatsComponentSimpleFixed, {
    stats: calculateMatchStats(pointLog), playerNames: { p1: 'Ann', p2: 'Bea' }, detailLevel: 'detailed', pointLog,
  }))))
  const text = container.textContent ?? ''
  for (const english of ['Serve Direction Analysis', 'Wide Serves', 'Success Rate', 'Aces Wide', 'Aces T', 'Shot Direction Analysis', 'Long Winners', 'Error Distribution', 'Pressure Point Performance', 'Break Point Success']) {
    expect(text).not.toContain(english)
  }
  const card = container.querySelector('[data-serve-placement-card]') as HTMLElement
  const row = (name: string) => Array.from(card.querySelectorAll('span'))
    .find(span => span.textContent === name)?.closest('.flex.items-center.justify-between')?.textContent
  expect(row('common.serveNetCord')).toBe('1common.serveNetCord0')
  expect(row('common.serveOutOfCourt')).toBe('1common.serveOutOfCourt0')
  expect(row('common.serveOnTheT')).toBe('1common.serveOnTheT0')
  expect(row('common.wide')).toBe('0common.wide1')
  act(() => root.unmount())
  container.remove()
})
