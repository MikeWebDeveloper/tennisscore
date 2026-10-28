/** @jest-environment node */
import DashboardPage from './page'
import { getPlayersByUser } from '@/lib/actions/players'
import { getMatchesByPlayer } from '@/lib/actions/matches'

jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/actions/players', () => ({ getPlayersByUser: jest.fn() }))
jest.mock('@/lib/actions/matches', () => ({ getMatchesByPlayer: jest.fn() }))
jest.mock('./dashboard-client', () => () => null)

it('does not hold the dashboard response until match history is available', async () => {
  jest.mocked(getPlayersByUser).mockResolvedValue([{ $id: 'player', isMainPlayer: true } as never])
  let finishMatches!: (value: never[]) => void
  jest.mocked(getMatchesByPlayer).mockReturnValue(new Promise(resolve => { finishMatches = resolve }))

  const page = DashboardPage()
  const returned = await Promise.race([page.then(() => true), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 50))])
  finishMatches?.([])
  await page
  expect(returned).toBe(true)
})
