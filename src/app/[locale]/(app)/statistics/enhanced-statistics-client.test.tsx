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
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('states the loaded sample and period, and does not offer a nonfunctional export', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const matches = [
    { $id: '1', status: 'completed', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-01', score: '{"sets":[[6,4],[6,3]]}' },
    { $id: '2', status: 'in-progress', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-02', score: '{}' },
  ]
  act(() => root.render(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as any, matches: matches as any }))))
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
  const html = renderToString(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as any, matches: matches as any })))
  expect(html).toContain('statistics.gamesPerMatch')
  expect(html).toContain('>19<')
})
