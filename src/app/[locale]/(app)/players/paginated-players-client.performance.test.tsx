import { act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
import { PaginatedPlayersClient } from './paginated-players-client'
import { getPlayersByUserPaginated } from '@/lib/actions/players'
import type { Player } from '@/lib/types'

jest.mock('@/lib/actions/players', () => ({ getPlayersByUserPaginated: jest.fn(), deletePlayer: jest.fn() }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/lib/framer-motion-config', () => ({ motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }))
jest.mock('./_components/player-list', () => ({ PlayerList: () => <div>Loaded players</div> }))
jest.mock('./_components/create-player-dialog', () => ({ CreatePlayerDialog: () => null, CreatePlayerTrigger: () => null }))
jest.mock('./_components/edit-player-dialog', () => ({ EditPlayerDialog: () => null }))

const players = [{ $id: 'player', firstName: 'Petr', lastName: 'Novak' }] as Player[]
beforeEach(() => {
  jest.useFakeTimers()
  jest.mocked(getPlayersByUserPaginated).mockReset().mockResolvedValue({ players, total: 1, hasMore: false })
})
afterEach(() => jest.useRealTimers())

it('keeps server-provided players without an empty search, but fetches typed and cleared searches', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  const changeSearch = (value: string) => act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(getPlayersByUserPaginated).not.toHaveBeenCalled()
  changeSearch('Petr')
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(getPlayersByUserPaginated).toHaveBeenCalledTimes(1)
  expect(getPlayersByUserPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: 'Petr' }))
  changeSearch('')
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(getPlayersByUserPaginated).toHaveBeenCalledTimes(2)
  expect(getPlayersByUserPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: undefined }))
  act(() => root.unmount())
  container.remove()
})

it('keeps an empty-result search editable and lets the user clear it', async () => {
  jest.mocked(getPlayersByUserPaginated)
    .mockResolvedValueOnce({ players: [], total: 0, hasMore: false })
    .mockResolvedValueOnce({ players, total: 1, hasMore: false })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'no-such-player')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(container.querySelector('input[role="searchbox"]')).not.toBeNull()
  const clear = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'clearSearch')!
  expect(clear).toBeDefined()
  act(() => clear.click())
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(getPlayersByUserPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: undefined }))
  expect(container.textContent).toContain('Loaded players')
  act(() => root.unmount())
  container.remove()
})
