import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server.node'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import EnhancedStatisticsClient from './enhanced-statistics-client'

jest.mock('@/i18n', () => ({ useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => `${namespace}.${key}${values ? ` ${JSON.stringify(values)}` : ''}` }))
jest.mock('./_components/lazy-charts', () => ({
  LazyPerformanceTrends: () => null, LazyServeReturnAnalysis: () => null,
  LazyClutchPerformance: () => null, LazyHeadToHeadAnalysis: () => null, LazyMatchPatterns: () => null, LazyIntensityChart: () => null,
}))
jest.mock('./_components/statistics-filters', () => ({ StatisticsFiltersComponent: () => null }))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

it('states the loaded sample and period, and does not offer a nonfunctional export', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const matches = [
    { $id: '1', status: 'completed', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-01', score: '{"sets":[[6,4],[6,3]]}' },
    { $id: '2', status: 'in-progress', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-02', score: '{}' },
  ]
  act(() => root.render(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as never, matches: matches as never }))))
  expect(container.textContent).toContain('statistics.loadedSample')
  expect(container.textContent).toContain('"selected":2,"completed":1')
  expect(container.textContent).toContain('statistics.allLoadedHistory')
  expect(container.textContent).toContain('statistics.gamesPerMatch19')
  expect(container.textContent).toContain('statistics.setsPerMatch2')
  expect(container.querySelector('[aria-label="statistics.exportData"]')).toBeNull()
  act(() => root.unmount())
})

it('renders match intensity values on the server while the charts are separate', () => {
  const matches = [{ $id: '1', status: 'completed', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-01', score: '{"sets":[[6,4],[6,3]]}' }]
  const html = renderToString(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as never, matches: matches as never })))
  expect(html).toContain('statistics.gamesPerMatch')
  expect(html).toContain('>19<')
})

const completed = (id: string, score: string, extra: Record<string, unknown> = {}) => ({ $id: id, status: 'completed', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-01', winnerId: 'p1', score, ...extra })

function renderStats(matches: unknown[]) {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as never, matches: matches as never }))))
  return { container, unmount: () => act(() => root.unmount()) }
}

it('locks the composite scores until enough matches are finished', () => {
  const { container, unmount } = renderStats([completed('1', '{"sets":[[6,4],[6,3]]}')])
  expect(container.querySelectorAll('[data-score-locked]')).toHaveLength(3)
  expect(container.textContent).toContain('statistics.needMoreMatches {"count":4}')
  unmount()
})

it('shows the composite scores once five matches are finished', () => {
  const { container, unmount } = renderStats(['1', '2', '3', '4', '5'].map(id => completed(id, '{"sets":[[6,4],[6,3]]}')))
  expect(container.querySelectorAll('[data-score-locked]')).toHaveLength(0)
  unmount()
})

it('computes games and sets won from set scores instead of reusing the match win rate', () => {
  const { container, unmount } = renderStats([completed('1', '{"sets":[[6,4],[6,3]]}'), completed('2', '{"sets":[[4,6],[6,7]]}', { winnerId: 'p2' })])
  const text = container.textContent ?? ''
  expect(text).toContain('statistics.gamesWonCount {"won":22,"total":42}')
  expect(text).toContain('statistics.setsWonCount {"won":2,"total":4}')
  expect(text).not.toContain('statistics.matchWinRate')
  unmount()
})

it('says points won needs point-by-point data instead of showing service points', () => {
  const { container, unmount } = renderStats([completed('1', '{"sets":[[6,4]]}')])
  expect(container.textContent).toContain('statistics.needsPointData')
  expect(container.textContent).not.toContain('statistics.serviceDominance')
  unmount()
})

it('fits every statistics tab on a phone instead of a sideways-scrolling strip', () => {
  const { container, unmount } = renderStats([completed('1', '{"sets":[[6,4],[6,3]]}')])
  const list = container.querySelector('[role="tablist"]') as HTMLElement
  expect(list.querySelectorAll('[role="tab"]')).toHaveLength(5)
  expect(list.className).toContain('grid-cols-3')
  expect(list.closest('.overflow-x-auto')).toBeNull()
  unmount()
})
