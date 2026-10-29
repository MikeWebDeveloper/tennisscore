import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import EnhancedStatisticsClient from './enhanced-statistics-client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Real Czech messages instead of the key-echo mock, so a missing key shows up as "namespace.key"
jest.mock('@/i18n', () => {
  const messages = jest.requireActual('@/i18n/messages/cs.json') as Record<string, Record<string, unknown>>
  const { IntlMessageFormat } = jest.requireActual('intl-messageformat')
  return {
    useLocale: () => 'cs',
    useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const message = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], messages[namespace])
      return typeof message === 'string' ? String(new IntlMessageFormat(message, 'cs').format(values)) : `${namespace}.${key}`
    },
  }
})
jest.mock('./_components/lazy-charts', () => ({
  LazyPerformanceTrends: () => null, LazyServeReturnAnalysis: () => null,
  LazyClutchPerformance: () => null, LazyHeadToHeadAnalysis: () => null, LazyMatchPatterns: () => null, LazyIntensityChart: () => null,
}))
jest.mock('./_components/statistics-filters', () => ({ StatisticsFiltersComponent: () => null }))

it('shows translated Czech captions on the won tiles before any match is finished', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const matches = [{ $id: '1', status: 'in-progress', playerOneId: 'p1', playerTwoId: 'p2', matchDate: '2025-01-02', score: '{}' }]
  act(() => root.render(createElement(LazyMotion, { features }, createElement(EnhancedStatisticsClient, { mainPlayer: { $id: 'p1' } as never, matches: matches as never }))))
  const text = container.textContent ?? ''
  expect(text).toContain('Zatím žádné dokončené zápasy')
  expect(text).toContain('Odehrajte ještě 5 zápasů')
  expect(text).toContain('Vybráno: 1 zápas, z toho 0 dokončených')
  // No "0%" win rate from zero finished matches
  expect(text).not.toContain('0 z 0')
  expect(text).not.toMatch(/\bstatistics\.\w+/)
  act(() => root.unmount())
})
