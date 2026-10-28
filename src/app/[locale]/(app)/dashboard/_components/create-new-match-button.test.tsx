import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { CreateNewMatchButton } from './create-new-match-button'
import type { Match, Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string, values?: Record<string, string | number>) => `${key}${values ? ` ${Object.values(values).join(' ')}` : ''}` }))

const playersMap = new Map([
  ['a', { $id: 'a', firstName: 'Ada', lastName: 'Ace' } as Player],
  ['b', { $id: 'b', firstName: 'Ben', lastName: 'Ball' } as Player],
  ['c', { $id: 'c', firstName: 'Cal', lastName: 'Court' } as Player],
  ['d', { $id: 'd', firstName: 'Dan', lastName: 'Drop' } as Player],
])
const match = { $id: 'match', playerOneId: 'a', playerTwoId: 'b', playerThreeId: 'c', playerFourId: 'd', score: JSON.stringify({ games: [3, 5] }) } as Match

it('shows both opponents and the current games from the main player team perspective', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(<CreateNewMatchButton resume={{ match, mainPlayerId: 'b', playersMap }} />))
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/matches/live/match')
  expect(container.textContent).toContain('Ace Ada')
  expect(container.textContent).toContain('Court Cal')
  expect(container.textContent).not.toContain('Drop Dan')
  expect(container.querySelector('[aria-label="yourGamesScore 5 3"]')).not.toBeNull()
  act(() => root.unmount())
})

it('avoids partial opponent teams and malformed score, keeping the match resumable', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(<CreateNewMatchButton resume={{ match: { ...match, score: '{' }, mainPlayerId: 'b', playersMap: new Map([['a', playersMap.get('a')!]]) }} />))
  expect(container.textContent).toContain('continueYourMatch')
  expect(container.querySelector('[aria-label^="yourGamesScore"]')).toBeNull()
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/matches/live/match')
  act(() => root.unmount())
})

it('shows start match when nothing can be resumed', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  act(() => root.render(<CreateNewMatchButton />))
  expect(container.textContent).toContain('startNewMatch')
  expect(container.querySelector('a')?.getAttribute('href')).toBe('/matches/new')
  act(() => root.unmount())
})
