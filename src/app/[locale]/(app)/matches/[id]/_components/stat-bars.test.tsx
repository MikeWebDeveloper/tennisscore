import { act, createElement } from 'react'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createRoot, type Root } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { BreakdownRow, ComparisonBar, StatRow } from './stat-bars'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLElement
function render(element: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(createElement(LazyMotion, { features }, element)))
}
// Bars start empty and grow on the next frames
const nextFrames = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 60)) })
afterEach(() => { act(() => root?.unmount()); root = null; container.remove() })

describe('ComparisonBar', () => {
  it('leans toward the side with more: 3 to 1 fills 75% blue and 25% red', async () => {
    render(<ComparisonBar value1={3} value2={1} />)
    await nextFrames()
    const [left, right] = Array.from(container.querySelectorAll('[data-bar-side]')) as HTMLElement[]
    expect(left.style.width).toBe('75%')
    expect(right.style.width).toBe('25%')
  })

  it('shows a neutral track instead of a fake 50:50 when there is nothing to compare', async () => {
    render(<ComparisonBar value1={0} value2={0} />)
    await nextFrames()
    expect(container.querySelectorAll('[data-bar-side]')).toHaveLength(0)
    expect(container.querySelector('[data-bar-empty]')).not.toBeNull()
  })

  it('animates with a CSS width transition, so the bar always ends at its value', () => {
    render(<ComparisonBar value1={1} value2={1} />)
    const left = container.querySelector('[data-bar-side]') as HTMLElement
    expect(left.className).toContain('transition-[width]')
  })
})

describe('StatRow', () => {
  it('colours and bolds the leading number and mutes the other', () => {
    render(<StatRow label="Winners" value1={5} value2={2} />)
    const [first, second] = Array.from(container.querySelectorAll('[data-stat-value]')) as HTMLElement[]
    expect(first.className).toContain('text-blue-600')
    expect(second.className).toContain('text-muted-foreground')
  })

  it('pops the number that changed after a point, but not on first load', () => {
    render(<StatRow label="Winners" value1={5} value2={2} />)
    expect((container.querySelector('[data-stat-value]') as HTMLElement).className).not.toContain('stat-pop')
    act(() => root!.render(createElement(LazyMotion, { features }, <StatRow label="Winners" value1={6} value2={2} />)))
    const [first] = Array.from(container.querySelectorAll('[data-stat-value]')) as HTMLElement[]
    expect(first.textContent).toBe('6')
    expect(first.className).toContain('stat-pop')
  })

  // The phone touch-target rule (centred 44px flex box) is for buttons; on this row it squeezed the numbers and collapsed the bar
  it('marks a tappable row so the phone touch-target layout leaves it alone', () => {
    render(<StatRow label="Winners" value1={1} value2={1} onClick={() => {}} />)
    const toggle = container.querySelector('[role="button"]') as HTMLElement
    expect(toggle.hasAttribute('data-stat-toggle')).toBe(true)
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(css).toMatch(/\[role="button"\]:not\(\[data-stat-toggle\]\)/)
  })

  it('opens its breakdown without clipping it to zero height', () => {
    render(<StatRow label="Winners" value1={5} value2={2} onClick={() => {}} isExpanded expandedContent={<p>breakdown</p>} />)
    const panel = container.querySelector('[data-stat-breakdown]') as HTMLElement
    expect(panel.textContent).toBe('breakdown')
    expect(panel.className).toContain('stat-expand')
    expect(panel.closest('.overflow-hidden')).toBeNull()
  })
})

describe('BreakdownRow', () => {
  it('keeps the count / label / count line and adds a thin comparison bar', () => {
    render(<BreakdownRow label="Forehand" value1={2} value2={1} />)
    const line = container.querySelector('div.flex.justify-between') as HTMLElement
    expect(line.children).toHaveLength(3)
    expect(line.textContent).toBe('2Forehand1')
    expect(container.querySelector('[data-comparison-bar]')).not.toBeNull()
  })
})

describe('full statistics at every level that records serves', () => {
  // Serve type and winner are logged at the simple and shot-type levels, so the full serve and return cards apply there too
  for (const detailLevel of ['simple', 'shot-type'] as const) {
    it(`shows every serve and return row at the ${detailLevel} level`, async () => {
      const { MatchStatsComponentSimpleFixed } = await import('./match-stats')
      const { calculateMatchStatsByLevel } = await import('@/lib/utils/match-stats')
      const point = (n: number, extra: object) => ({
        id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: '0-0', rallyLength: 2,
        isBreakPoint: false, isSetPoint: false, isMatchPoint: false, isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, ...extra,
      })
      const pointLog = [
        point(1, { winner: 'p1', server: 'p1', serveType: 'first', pointOutcome: 'winner' }),
        point(2, { winner: 'p2', server: 'p1', serveType: 'second', pointOutcome: 'unforced_error' }),
      ] as never
      render(<MatchStatsComponentSimpleFixed stats={calculateMatchStatsByLevel(pointLog, detailLevel)} playerNames={{ p1: 'Ann', p2: 'Bea' }} detailLevel={detailLevel} pointLog={pointLog} />)
      const text = container.textContent ?? ''
      for (const key of ['firstServePercentage', 'firstServePointsWonPercentage', 'secondServePointsWonPercentage', 'totalServicePoints', 'returnStatistics', 'receivingPoints', 'returnPointsWon']) {
        expect(text).toContain(`common.${key}`)
      }
    })
  }
})
