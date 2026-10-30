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
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => <a href={href} {...rest}>{children}</a> }))
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
  it('shows the overview dashboard without English text or English dates', async () => {
    const { container, cleanup } = await renderDetails()
    const text = container.textContent ?? ''
    const dashboard = container.querySelector('[data-match-dashboard]')
    expect(dashboard).not.toBeNull()
    expect(dashboard?.textContent).toContain('2. 7. 2025')
    expect(text).toContain('Průběh zápasu')
    expect(text).toContain('Hra po hře')
    expect(text).toContain('1. set')
    // 8 of the 12 points went to Dvořák: the headline says so
    expect(container.querySelector('[data-headline]')?.textContent).toContain('67 % všech bodů')
    for (const english of ['Sets:', 'Wins!', 'Set by Set Breakdown', 'Format', 'Type', 'Jul', 'July', 'PM', 'Wed', 'points']) expect(text).not.toContain(english)
    cleanup()
  })

  it('shows the stored set scores on the result card', async () => {
    const { container, cleanup } = await renderDetails()
    const card = container.querySelector('[data-match-dashboard]')?.firstElementChild
    expect(card?.textContent).toMatch(/Mike God600[\s\S]*Dvořák Petr066/)
    cleanup()
  })

  it('writes the match duration in Czech units, with seconds for very short matches', async () => {
    const { container, cleanup } = await renderDetails()
    expect(container.textContent).toContain('30 s')
    expect(container.textContent).not.toContain('< 1m')
    cleanup()
    const long = await renderDetails({ endTime: '2025-07-02T17:24:00.000Z' })
    expect(long.container.textContent).toContain('1 h 5 min')
    long.cleanup()
  })

  it('shows a single translated status badge', async () => {
    const { container, cleanup } = await renderDetails()
    const badges = Array.from(container.querySelectorAll('[data-match-status]'))
    expect(badges.map(badge => badge.textContent?.trim())).toEqual(['Dokončeno'])
    expect(container.textContent).not.toContain('Completed')
    cleanup()
  })

  it('lists every game in Czech on the flow tab', async () => {
    const { container, cleanup } = await renderDetails()
    await openTab(container, 1)
    const games = container.querySelectorAll('[data-flow-game]')
    expect(games).toHaveLength(1)
    expect(games[0].textContent).toContain('1. hra')
    expect(games[0].textContent).toContain('podává God')
    expect(games[0].textContent).toContain('brejk')
    for (const english of ['Game 1', 'serving', 'break']) expect(container.textContent).not.toContain(english)
    cleanup()
  })

  it('names missing players instead of leaving a bare "vs" title', async () => {
    const { container, cleanup } = await renderDetails({ playerOne: undefined, playerTwo: undefined })
    // The desktop header renders the whole pairing in one heading
    expect(Array.from(container.querySelectorAll('h1'), heading => heading.textContent)).toContain('Neznámý hráč vs Neznámý hráč')
    cleanup()
  })

  it('fits the phone header on one row with labelled icon buttons', async () => {
    const { container, cleanup } = await renderDetails()
    const back = container.querySelector('a[aria-label="Zpět na zápasy"]')
    const share = container.querySelector('button[aria-label="Sdílet výsledky"]')
    expect(back?.textContent).toBe('')
    expect(share?.textContent).toBe('')
    expect(back?.parentElement?.className).not.toContain('flex-wrap')
    cleanup()
  })

  it('lists the players with coloured details and a divider, like the live scoreboard', async () => {
    const { container, cleanup } = await renderDetails({
      playerOne: { ...player('p1', 'God', 'Mike'), yearOfBirth: 1980, bhRating: '20', club: 'FK Tennis Litoměřice' } as never,
    })
    const rows = container.querySelectorAll('[data-players-card] [data-side]')
    expect(rows).toHaveLength(2)
    expect(rows[0].parentElement?.className).toContain('divide-y')
    expect(rows[0].querySelector('[data-player-meta]')?.textContent).toBe('1980 (20 BH)FK Tennis Litoměřice')
    expect(rows[1].querySelector('[data-player-meta]')).toBeNull()
    cleanup()
  })

  it('labels every tab on phones instead of showing bare icons', async () => {
    const { container, cleanup } = await renderDetails()
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'))
    expect(tabs.map(tab => tab.textContent)).toEqual(['Přehled', 'Průběh', 'Statistiky', 'Záznam bodů'])
    for (const tab of tabs) expect(tab.querySelector('.hidden')).toBeNull()
    cleanup()
  })

  it('shows a retirement in Czech on the status badge and in the details, not the raw value', async () => {
    const { container, cleanup } = await renderDetails({ retirementReason: 'retired' } as never)
    expect(Array.from(container.querySelectorAll('[data-match-status]'), badge => badge.textContent?.trim())).toEqual(['Dokončeno — Hráč odstoupil'])
    expect(container.textContent).not.toMatch(/\bretired\b/)
    cleanup()
  })

  it('translates the point log heading', async () => {
    const { container, cleanup } = await renderDetails()
    await openTab(container, 3)
    expect(container.textContent).toContain('Bod po bodu (12 bodů)')
    expect(container.textContent).not.toContain('Point-by-Point Analysis')
    cleanup()
  })
})
