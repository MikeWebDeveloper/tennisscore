/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server'
import PlayerProfilePage from './page'
import { getMainPlayer, getPlayerById } from '@/lib/actions/players'
import { getMatchesByPlayer } from '@/lib/actions/matches'
import { getMatchesWithStats } from '@/lib/actions/statistics'

const mockNotFound = jest.fn(() => { throw new Error('NEXT_NOT_FOUND') })
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound(), redirect: jest.fn() }))
jest.mock('next-intl/server', () => ({ getLocale: async () => 'cs' }))
jest.mock('@/i18n/server-translator', () => ({
  getServerTranslator: async () => (key: string, values?: Record<string, unknown>) => values ? `${key}(${Object.values(values).join(',')})` : key,
}))
jest.mock('@/i18n/navigation', () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }))
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/actions/players', () => ({ getPlayerById: jest.fn(), getMainPlayer: jest.fn() }))
jest.mock('@/lib/actions/matches', () => ({ getMatchesByPlayer: jest.fn() }))
jest.mock('@/lib/actions/statistics', () => ({ getMatchesWithStats: jest.fn() }))
jest.mock('@/components/shared/player-avatar', () => ({ PlayerAvatar: () => null }))

const sofie = { $id: 'me', firstName: 'Sofie', lastName: 'Látalová', userId: 'owner', isMainPlayer: true }
const eva = { $id: 'eva', firstName: 'Eva', lastName: 'Nová', userId: 'owner', isMainPlayer: false }
const game = (n: number, server: 'p1' | 'p2', winner: 'p1' | 'p2') => Array.from({ length: 4 }, () => JSON.stringify({ winner, server, setNumber: 1, gameNumber: n }))
const meeting = {
  $id: 'm1', matchDate: '2026-10-04T10:00:00Z', status: 'completed', playerOneId: 'me', playerTwoId: 'eva', winnerId: 'me',
  score: JSON.stringify({ sets: [[6, 4], [6, 2]], games: [0, 0], points: [0, 0] }), matchFormat: '{}',
  pointLog: [...game(1, 'p1', 'p1'), ...game(2, 'p2', 'p1')],
}

beforeEach(() => {
  jest.mocked(getMainPlayer).mockResolvedValue(sofie as never)
  jest.mocked(getMatchesByPlayer).mockResolvedValue([meeting] as never)
  jest.mocked(getMatchesWithStats).mockResolvedValue([meeting] as never)
})

it('shows the head-to-head record, every meeting and the monthly progress of an opponent', async () => {
  jest.mocked(getPlayerById).mockResolvedValue(eva as never)
  const html = renderToStaticMarkup(await PlayerProfilePage({ params: Promise.resolve({ id: 'eva' }) }))
  expect(html).toContain('profileHeadToHeadRecord(Sofie,1,0,Eva)')
  expect(html).toContain('href="/matches/m1"')
  // From Sofie's side
  expect(html).toContain('6:4 6:2')
  expect(html).toContain('href="/matches/new?opponent=eva"')
  // Eva lost both games: no service game held, no break, 0 of 8 points
  expect(html).toContain('data-progress')
  expect(html).toContain('profileShare(0,0,1)')
  expect(html).toContain('profileShare(0,0,8)')
})

it('refuses a player of another account', async () => {
  jest.mocked(getPlayerById).mockResolvedValue({ ...eva, userId: 'someone-else' } as never)
  await expect(PlayerProfilePage({ params: Promise.resolve({ id: 'eva' }) })).rejects.toThrow('NEXT_NOT_FOUND')
})
