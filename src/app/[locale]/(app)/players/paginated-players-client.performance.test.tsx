import { act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
import { PaginatedPlayersClient } from './paginated-players-client'
import { deletePlayer, getPlayersByUserPaginated } from '@/lib/actions/players'
import type { Player } from '@/lib/types'

jest.mock('@/lib/actions/players', () => ({ getPlayersByUserPaginated: jest.fn(), deletePlayer: jest.fn() }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('@/lib/framer-motion-config', () => ({ motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }))
jest.mock('./_components/player-list', () => ({ PlayerList: ({ players, onDeletePlayer }: { players: Player[]; onDeletePlayer: (id: string) => void }) => <div>Loaded players {players.map(player => player.firstName).join(', ')}<button onClick={() => onDeletePlayer('player')}>simulateDelete</button></div> }))
jest.mock('./_components/create-player-dialog', () => ({ CreatePlayerDialog: ({ onCreated }: { onCreated: () => void }) => <button onClick={onCreated}>simulateCreate</button>, CreatePlayerTrigger: () => null }))
jest.mock('./_components/edit-player-dialog', () => ({ EditPlayerDialog: ({ onSaved }: { onSaved: () => void }) => <button onClick={onSaved}>simulateSave</button> }))

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

it('shows a retry for an initial connection failure and displays players after recovery', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={[]} initialTotal={0} initialHasMore={false} initialError />))
  expect(container.textContent).toContain('connectionError')
  expect(container.textContent).not.toContain('noPlayersYet')
  const retry = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('tryAgain'))!
  await act(async () => { retry.click() })
  expect(container.textContent).toContain('Loaded players')
  expect(container.textContent).not.toContain('connectionError')
  act(() => root.unmount())
  container.remove()
})

it('retains the existing players when a search request fails', async () => {
  jest.mocked(getPlayersByUserPaginated).mockRejectedValueOnce(new Error('offline'))
  const silence = jest.spyOn(console, 'error').mockImplementation(() => {})
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Petr')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(container.textContent).toContain('Loaded players')
  expect(container.textContent).not.toContain('noPlayersFoundSearch')
  act(() => root.unmount())
  container.remove()
  silence.mockRestore()
})

it('ignores an older create refresh as soon as the search changes and keeps the newer request loading', async () => {
  type Page = { players: Player[]; total: number; hasMore: boolean }
  let resolveOld!: (value: Page) => void
  let resolveNew!: (value: Page) => void
  jest.mocked(getPlayersByUserPaginated)
    .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    .mockImplementationOnce(() => new Promise(resolve => { resolveNew = resolve }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={50} initialHasMore />))
  act(() => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'simulateCreate')!.click())
  act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Fresh')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { jest.advanceTimersByTime(350) })
  expect(getPlayersByUserPaginated).toHaveBeenCalledTimes(2)
  await act(async () => { resolveOld({ players: [{ $id: 'old', firstName: 'Stale', lastName: 'A' }] as Player[], total: 1, hasMore: false }) })
  expect(container.textContent).not.toContain('Stale')
  expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('loading'))?.disabled).toBe(true)
  await act(async () => { resolveNew({ players: [{ $id: 'new', firstName: 'Fresh', lastName: 'B' }] as Player[], total: 1, hasMore: false }) })
  expect(container.textContent).toContain('Fresh')
  expect(container.textContent).not.toContain('Stale')
  act(() => root.unmount())
  container.remove()
})

it('ignores old search results even before the next debounce starts', async () => {
  let resolveOld!: (value: { players: Player[]; total: number; hasMore: boolean }) => void
  jest.mocked(getPlayersByUserPaginated).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  const search = (value: string) => act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  search('Old')
  await act(async () => { jest.advanceTimersByTime(350) })
  search('New')
  await act(async () => { resolveOld({ players: [{ $id: 'old', firstName: 'Stale', lastName: 'A' }] as Player[], total: 1, hasMore: false }) })
  expect(container.textContent).not.toContain('Stale')
  expect(container.textContent).toContain('Petr')
  act(() => root.unmount())
  container.remove()
})


it('refreshes the current filtered list after a successful edit', async () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Petr')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => { jest.advanceTimersByTime(350) })
  jest.mocked(getPlayersByUserPaginated).mockResolvedValueOnce({ players: [{ $id: 'player', firstName: 'Petr Edited', lastName: 'Novak' }] as Player[], total: 1, hasMore: false })
  await act(async () => { Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'simulateSave')!.click() })
  expect(getPlayersByUserPaginated).toHaveBeenLastCalledWith(expect.objectContaining({ searchQuery: 'Petr' }))
  expect(container.textContent).toContain('Petr Edited')
  act(() => root.unmount())
  container.remove()
})

it('refreshes the latest search and sort when a deferred deletion completes', async () => {
  let finishDelete!: (result: { success: boolean }) => void
  jest.mocked(deletePlayer).mockImplementationOnce(() => new Promise(resolve => { finishDelete = resolve }))
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<PaginatedPlayersClient initialPlayers={players} initialTotal={1} initialHasMore={false} />))
  act(() => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'simulateDelete')!.click())
  act(() => {
    const input = container.querySelector('input')!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'New')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  act(() => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'sort')!.click())
  await act(async () => { jest.advanceTimersByTime(350) })
  jest.mocked(getPlayersByUserPaginated).mockClear()
  await act(async () => { finishDelete({ success: true }) })
  expect(getPlayersByUserPaginated).toHaveBeenCalledWith(expect.objectContaining({ searchQuery: 'New', sortBy: 'name' }))
  act(() => root.unmount())
  container.remove()
  confirmSpy.mockRestore()
})
