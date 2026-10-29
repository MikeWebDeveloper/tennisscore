import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { PaginatedMatchesClient } from './paginated-matches-client'
import { getMatchesByUserPaginated } from '@/lib/actions/matches'
import type { Match, Player } from '@/lib/types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
jest.mock('@/lib/actions/matches', () => ({ getMatchesByUserPaginated: jest.fn() }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/i18n/navigation', () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }))
jest.mock('./_components/matches-list', () => ({ MatchesList: ({ matches, onSearchChange }: { matches: { $id: string }[]; onSearchChange: (value: string) => void }) => <div><button onClick={() => onSearchChange('older')}>search</button>{matches.map(match => match.$id).join(',')}</div> }))

const player = { $id: 'player', firstName: 'Jan', lastName: 'Novak' } as Player
const match = (id: string) => ({ $id: id, playerOneId: 'player', playerTwoId: 'player', matchDate: '2025-01-01', score: '{}', playerOneName: 'Jan', playerTwoName: 'Jan', winnerName: '' }) as Match & { playerOneName: string; playerTwoName: string; winnerName: string }

it('loads older pages when a search starts, instead of searching only the first page', async () => {
  jest.mocked(getMatchesByUserPaginated)
    .mockResolvedValueOnce({ matches: Array.from({ length: 15 }, (_, i) => match(`middle-${i}`)), total: 31, hasMore: true })
    .mockResolvedValueOnce({ matches: [match('old-match')], total: 31, hasMore: false })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<PaginatedMatchesClient initialMatches={Array.from({ length: 15 }, (_, i) => match(`recent-${i}`))} initialTotal={31} initialHasMore players={[player]} hasError={false} />))
  await act(async () => { Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'search')!.click() })
  expect(getMatchesByUserPaginated).toHaveBeenCalledWith(expect.objectContaining({ offset: 15 }))
  expect(getMatchesByUserPaginated).toHaveBeenCalledWith(expect.objectContaining({ offset: 30 }))
  expect(container.textContent).toContain('old-match')
  act(() => root.unmount())
  container.remove()
})

it('stops and surfaces an error if a history page does not advance', async () => {
  jest.mocked(getMatchesByUserPaginated).mockReset().mockResolvedValue({ matches: [], total: 31, hasMore: true })
  const silence = jest.spyOn(console, 'error').mockImplementation(() => {})
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<PaginatedMatchesClient initialMatches={[match('recent')]} initialTotal={31} initialHasMore players={[player]} hasError={false} />))
  await act(async () => { Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'search')!.click() })
  expect(getMatchesByUserPaginated).toHaveBeenCalledTimes(1)
  expect(container.textContent).toContain('unableToLoadMatches')
  act(() => root.unmount())
  container.remove()
  silence.mockRestore()
})
