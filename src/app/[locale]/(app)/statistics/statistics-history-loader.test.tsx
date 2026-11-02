import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { StatisticsHistoryLoader } from './statistics-history-loader'
import { getMatchesWithStats } from '@/lib/actions/statistics'
import type { Match, Player } from '@/lib/types'

jest.mock('@/lib/actions/statistics', () => ({ getMatchesWithStats: jest.fn() }))
jest.mock('@/i18n', () => ({ useTranslations: () => (key: string) => key }))
jest.mock('./enhanced-statistics-client', () => ({
  __esModule: true,
  default: ({ matches }: { matches: Match[] }) => <div data-testid="count">{matches.length}</div>,
}))

const player = { $id: 'player' } as Player
const initial = Array.from({ length: 50 }, (_, i) => ({ $id: `match-${i}` } as Match))
let container: HTMLDivElement
let root: Root
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(() => { act(() => root.unmount()); container.remove(); jest.clearAllMocks() })

it('shows the first page immediately and adds older matches in the background', async () => {
  let resolvePage!: (matches: Match[]) => void
  jest.mocked(getMatchesWithStats).mockReturnValueOnce(new Promise(resolve => { resolvePage = resolve }))
  await act(async () => { root.render(<StatisticsHistoryLoader mainPlayer={player} initialMatches={initial} />) })
  expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('50')
  expect(container.textContent).toContain('loadingOlderMatches')
  await act(async () => { resolvePage([{ $id: 'older' } as Match]) })
  expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('51')
  expect(getMatchesWithStats).toHaveBeenCalledWith('player', { limit: 50, cursorAfter: 'match-49' })
})

it('makes an incomplete history visible when loading older matches fails', async () => {
  jest.mocked(getMatchesWithStats).mockRejectedValueOnce(new Error('offline'))
  await act(async () => { root.render(<StatisticsHistoryLoader mainPlayer={player} initialMatches={initial} />) })
  expect(container.textContent).toContain('historyLoadFailed')
  expect(container.querySelector('[data-testid="count"]')?.textContent).toBe('50')
})

it('narrows every statistic to one tournament', async () => {
  const matches = [
    { $id: 'a', tournamentName: 'Zimní liga', matchDate: '2026-01-10T10:00:00Z' },
    { $id: 'b', tournamentName: 'Zimní liga', matchDate: '2026-01-24T10:00:00Z' },
    { $id: 'c', tournamentName: 'MČR U12', matchDate: '2026-03-14T10:00:00Z' },
    { $id: 'd', matchDate: '2026-04-01T10:00:00Z' },
  ] as Match[]
  await act(async () => { root.render(<StatisticsHistoryLoader mainPlayer={player} initialMatches={matches} />) })
  const count = () => container.querySelector('[data-testid="count"]')?.textContent
  expect(count()).toBe('4')
  const select = container.querySelector('select') as HTMLSelectElement
  expect([...select.options].map(o => o.value)).toEqual(['', 'mčr u12', 'zimní liga'])
  await act(async () => {
    select.value = 'zimní liga'
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
  expect(count()).toBe('2')
})
