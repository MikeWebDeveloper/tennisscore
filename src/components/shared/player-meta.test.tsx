import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { PlayerMeta } from './player-meta'
import type { Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
function render(players: (Player | undefined)[]) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<PlayerMeta players={players} />))
  return container
}
afterEach(() => { act(() => root?.unmount()); root = null; document.body.innerHTML = '' })

const player = (extra: Partial<Player>) => ({ $id: 'x', firstName: 'A', lastName: 'B', userId: 'u', isMainPlayer: false, ...extra }) as Player

it('shows year in blue, rating in purple and club in green, like the live scoreboard', () => {
  const el = render([player({ yearOfBirth: 2015, bhRating: '12', czRanking: 260, club: 'SK Hamr' })])
  expect(el.textContent).toBe('2015 (12 BH • 260 CŽ)SK Hamr')
  expect(el.querySelector('.text-blue-600')?.textContent).toBe('2015')
  expect(el.querySelector('.text-purple-600')?.textContent).toBe('(12 BH • 260 CŽ)')
  expect(el.querySelector('.text-green-600')?.textContent).toBe('SK Hamr')
})

it('joins doubles partners with a slash on each line', () => {
  const el = render([player({ yearOfBirth: 2015, club: 'SK Hamr' }), player({ yearOfBirth: 2014, bhRating: '12', club: 'TK Horní Měcholupy' })])
  const [details, clubs] = Array.from(el.querySelectorAll('[data-player-meta] > div'), line => line.textContent)
  expect(details).toBe('2015 / 2014 (12 BH)')
  expect(clubs).toBe('SK Hamr / TK Horní Měcholupy')
})

it('wraps long lines between whole pieces instead of cutting the rating off', () => {
  const el = render([player({ yearOfBirth: 2013, bhRating: '0', czRanking: 1230, club: 'TO SK Mělník' }), player({ yearOfBirth: 2014, club: 'TCG Karlovy Vary' })])
  expect(el.querySelector('[data-player-meta]')?.className).toContain('min-w-0')
  expect(el.querySelector('.truncate')).toBeNull()
  // Year and rating never split mid-way; the line breaks only between them
  for (const piece of ['2013', '(0 BH • 1230 CŽ)', '2014']) {
    const span = Array.from(el.querySelectorAll('span')).find(s => s.textContent === piece)
    expect(span?.className).toContain('whitespace-nowrap')
  }
  // Clubs can be long, so they wrap like ordinary text and break overlong words
  const clubs = Array.from(el.querySelectorAll('[data-player-meta] > div')).find(line => line.textContent?.includes('Mělník'))
  expect(clubs?.className).toContain('break-words')
  expect(clubs?.querySelector('.whitespace-nowrap')).toBeNull()
})

it('renders nothing for players without any details', () => {
  expect(render([player({}), undefined]).innerHTML).toBe('')
})
