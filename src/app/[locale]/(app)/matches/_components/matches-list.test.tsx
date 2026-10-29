import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MatchesList } from './matches-list'
import type { Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
jest.mock('../[id]/_components/delete-match-button', () => ({ DeleteMatchButton: () => null }))

const player = (id: string, extra: Partial<Player>) => ({ $id: id, firstName: id, lastName: 'X', userId: 'u', isMainPlayer: false, ...extra }) as Player
const doublesMatch = {
  $id: 'm1', playerOneId: 'a', playerTwoId: 'b', playerThreeId: 'c', playerFourId: 'd',
  playerOneName: 'Látalová Sofie', playerTwoName: 'Chaika Kira', playerThreeName: 'Linková Leontina', playerFourName: 'Havlíková Marie',
  matchDate: '2025-08-06T17:01:00.000Z', status: 'Completed', winnerId: 'a', score: '{}', scoreParsed: { sets: [{ p1: 6, p2: 3 }] },
  playerOne: player('a', { yearOfBirth: 2015, bhRating: '12', czRanking: 260, club: 'SK Hamr' }),
  playerThree: player('c', { yearOfBirth: 2014, club: 'TK Horní Měcholupy' }),
  playerTwo: player('b', { yearOfBirth: 2013, club: 'TO SK Mělník' }),
  playerFour: player('d', { yearOfBirth: 2014, club: 'TCG Karlovy Vary' }),
}

it('shows each side with coloured details and a divider between the two sides', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<MatchesList matches={[doublesMatch]} />))
  const rows = container.querySelectorAll('[data-side]')
  expect(rows).toHaveLength(2)
  expect(rows[0].parentElement?.className).toContain('divide-y')
  expect(rows[0].querySelector('[data-player-meta]')?.textContent).toBe('2015 (12 BH • 260 CŽ) / 2014SK Hamr / TK Horní Měcholupy')
  expect(rows[1].querySelector('[data-player-meta]')?.textContent).toBe('2013 / 2014TO SK Mělník / TCG Karlovy Vary')
  act(() => root.unmount())
  container.remove()
})
