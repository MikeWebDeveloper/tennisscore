import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchDetails } from './match-details'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Real Czech messages instead of the global key-echo mock, so untranslated text stays visible.
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
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }))
jest.mock('@/components/features/lazy-match-export', () => ({ LazyFullMatchExportButton: () => null }))
jest.mock('@/components/shared/share-score-card-button', () => ({ ShareScoreCardButton: () => null }))
jest.mock('./point-by-point-view', () => ({ PointByPointView: () => null }))

const player = (id: string, firstName: string, lastName: string) => ({ $id: id, firstName, lastName, userId: 'u1', isMainPlayer: false })
const point = (n: number, winner: 'p1' | 'p2') => JSON.stringify({ id: String(n), pointNumber: n, setNumber: 1, gameNumber: 1, winner, server: 'p1', isTiebreak: false, timestamp: '2025-07-02T16:19:00.000Z' })

const match = {
  $id: 'm1', userId: 'u1', $collectionId: 'matches', playerOneId: 'p1', playerTwoId: 'p2', winnerId: 'p2',
  playerOne: player('p1', 'God', 'Mike'), playerTwo: player('p2', 'Petr', 'Dvořák'), winner: player('p2', 'Petr', 'Dvořák'),
  matchDate: '2025-07-02T16:19:00.000Z', status: 'Completed' as const,
  score: JSON.stringify({ sets: [[6, 0], [0, 6], [0, 6]], games: [0, 0], points: [0, 0] }),
  matchFormat: JSON.stringify({ sets: 3, noAd: false }),
  pointLog: Array.from({ length: 12 }, (_, i) => point(i + 1, i % 3 ? 'p2' : 'p1')),
  // Finished within a minute: a points-per-minute figure would be meaningless
  startTime: '2025-07-02T16:19:00.000Z', endTime: '2025-07-02T16:19:30.000Z',
}

async function renderDetails(overrides: Partial<typeof match> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<MatchDetails match={{ ...match, ...overrides } as never} />))
  return { container, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

async function openTab(container: HTMLElement, index: number) {
  const trigger = container.querySelectorAll('[role="tab"]')[index] as HTMLElement
  await act(async () => { trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })) })
}

describe('MatchDetails in Czech', () => {
  it('shows the overview without English text or English dates', async () => {
    const { container, cleanup } = await renderDetails()
    const text = container.textContent ?? ''
    expect(text).toContain('Sety: 6-0, 0-6, 0-6')
    expect(text).toContain('Dvořák Petr vyhrává!')
    expect(text).toContain('Průběh po setech')
    expect(text).toContain('1. set')
    for (const english of ['Sets:', 'Wins!', 'Set by Set Breakdown', 'Format', 'Type', 'Jul', 'July', 'PM', 'Wed']) expect(text).not.toContain(english)
    cleanup()
  })

  it('shows a single translated status badge', async () => {
    const { container, cleanup } = await renderDetails()
    const badges = Array.from(container.querySelectorAll('[data-match-status]'))
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['Dokončeno'])
    expect(container.textContent).not.toContain('Completed')
    cleanup()
  })

  it('translates the analysis tab and omits pace for sub-minute matches', async () => {
    const { container, cleanup } = await renderDetails()
    await openTab(container, 3)
    const text = container.textContent ?? ''
    expect(text).toContain('Analýza a poznatky ze zápasu')
    for (const english of ['Match Analysis & Insights', 'Performance Insights', 'Service power', 'Match rhythm', 'DFs', 'conversion rate', 'Service games']) expect(text).not.toContain(english)
    expect(text).not.toMatch(/Tempo hry|Playing pace/)
    cleanup()
  })

  it('names missing players instead of leaving a bare "vs" title', async () => {
    const { container, cleanup } = await renderDetails({ playerOne: undefined, playerTwo: undefined })
    // The desktop header renders the whole pairing in one heading
    expect(Array.from(container.querySelectorAll('h1'), heading => heading.textContent)).toContain('Neznámý hráč vs Neznámý hráč')
    cleanup()
  })

  it('translates the point log heading', async () => {
    const { container, cleanup } = await renderDetails()
    await openTab(container, 1)
    expect(container.textContent).toContain('Bod po bodu (12 bodů)')
    expect(container.textContent).not.toContain('Point-by-Point Analysis')
    cleanup()
  })
})
