import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchPatterns } from './match-patterns'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => `${namespace}.${key}${values ? ` ${JSON.stringify(values)}` : ''}`,
}))
jest.mock('@/components/ui/charts', () => ({ UPlotBarChart: () => null }))

const patterns = (minutes: number) => ({
  averageMatchDuration: minutes, longestMatch: minutes, shortestMatch: minutes, averageGamesPerMatch: 18, averageSetsPerMatch: 3,
  straightSetWins: 0, fiveSetterWins: 0,
  morningPerformance: { played: 0, won: 0 }, afternoonPerformance: { played: 0, won: 0 }, eveningPerformance: { played: 1, won: 0 },
})

function render(minutes: number, completedMatches: number) {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(createElement(MatchPatterns, { patterns: patterns(minutes), completedMatches })))
  return { text: container.textContent ?? '', unmount: () => act(() => root.unmount()) }
}

it('formats short durations in seconds and translates the duration badges', () => {
  const { text, unmount } = render(0.36, 1)
  expect(text).toContain('22 sec')
  expect(text).not.toContain('0.36 min')
  expect(text).not.toMatch(/\b0 min\b/)
  for (const english of ['Average', 'Quickest', 'Marathon', ' matches']) expect(text).not.toContain(english)
  unmount()
})

it('holds back pattern insights until there are enough finished matches', () => {
  const { text, unmount } = render(0.36, 1)
  expect(text).toContain('statistics.insightsNeedMoreMatches {"count":4}')
  expect(text).not.toContain('excellentEndurance')
  expect(text).not.toContain('bestPerformanceInTime')
  unmount()
})

it('shows pattern insights once there are enough finished matches', () => {
  const { text, unmount } = render(80, 6)
  expect(text).not.toContain('insightsNeedMoreMatches')
  expect(text).toContain('bestPerformanceInTime')
  unmount()
})
