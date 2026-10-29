import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { UltraSimplePointLogger } from './ultra-simple-point-logger'
import { SimpleStatsPopup } from './simple-stats-popup'
import { PointByPointView } from '../../../[id]/_components/point-by-point-view'
import type { PointDetail } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Real Czech messages, so wrong grammar or untranslated text shows up
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

let root: Root | null = null
function mount(element: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(element))
  return container
}
afterEach(() => { act(() => root?.unmount()); root = null; document.body.innerHTML = '' })

const context = {
  pointNumber: 3, setNumber: 1, gameNumber: 2, gameScore: '30-15', winner: 'p2' as const, server: 'p1' as const, serveType: 'first' as const,
  isBreakPoint: false, isSetPoint: false, isMatchPoint: false, playerNames: { p1: 'Bucharová M.', p2: 'Beau L.' },
}

describe('point window in correct Czech', () => {
  it('names one point in the singular, with a natural title, context line and badges', () => {
    mount(<UltraSimplePointLogger open onOpenChange={jest.fn()} onSave={jest.fn()} pointContext={context} />)
    const text = document.body.textContent ?? ''
    expect(text).toContain('Bod č. 3')
    expect(text).toContain('1. set · 2. hra · 30:15')
    expect(text).toContain('Jak byl bod vyhrán?')
    expect(text).toContain('Beau L. vyhrává bod')
    expect(text).toContain('Podává Bucharová M. (1. podání)')
    for (const option of ['Vítězný úder', 'Eso', 'Vynucená chyba', 'Nevynucená chyba', 'Dvojchyba']) expect(text).toContain(option)
    expect(text).toContain('Eso může zahrát jen podávající')
    expect(text).toContain('Chyba bez tlaku soupeře')
    for (const wrong of ['výhry', 'Detaily', '#', 'vyhráli', 'pro es', 'Esa', 'Dvojchyby', 'Vítěz\n']) expect(text).not.toContain(wrong)
  })

  it('uses the same wording in the simple-level window', () => {
    mount(<SimpleStatsPopup open onOpenChange={jest.fn()} onSave={jest.fn()} pointContext={context} />)
    const text = document.body.textContent ?? ''
    expect(text).toContain('Bod č. 3')
    expect(text).toContain('Beau L. vyhrává bod')
    expect(text).toContain('Podává Bucharová M. (1. podání)')
    expect(text).toContain('Eso')
    expect(text).not.toContain('Esa')
  })
})

describe('point log in correct Czech', () => {
  const point = (n: number, extra: Partial<PointDetail>) => ({
    id: String(n), timestamp: '2026-10-29T10:00:00.000Z', pointNumber: n, setNumber: 1, gameNumber: 1, gameScore: `${15 * n}-0`,
    server: 'p1', serveType: 'first', rallyLength: 3, isBreakPoint: false, isSetPoint: false, isMatchPoint: false,
    isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, ...extra,
  }) as PointDetail

  it('reads each point as a natural phrase', () => {
    const container = mount(<PointByPointView playerNames={{ p1: 'Ann', p2: 'Bea' }} detailLevel="detailed" pointLog={[
      point(1, { winner: 'p2', pointOutcome: 'winner', lastShotType: 'forehand', winnerType: 'return', shotDirection: 'cross' }),
      point(2, { winner: 'p1', pointOutcome: 'ace', lastShotType: 'serve', servePlacement: 'net-cord' }),
      point(3, { winner: 'p1', serveType: 'second', pointOutcome: 'unforced_error', lastShotType: 'backhand', shotDirection: 'net' }),
    ]} />)
    const rows = Array.from(container.querySelectorAll('[data-point-row]'), row => row.textContent)
    expect(rows).toEqual(expect.arrayContaining([
      expect.stringContaining('Vítězný úderReturn forhend křížem'),
      expect.stringContaining('EsoDotek sítě (prase)'),
      expect.stringContaining('Nevynucená chybaBekhend do sítě'),
    ]))
    expect(container.textContent).toContain('2. podání')
    expect(container.textContent).not.toMatch(/\bEs\b/)
  })
})
