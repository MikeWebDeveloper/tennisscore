/** @jest-environment node */
import { isValidElement, type ReactElement } from 'react'
import DashboardPage from './page'
import NewMatchPage from '../matches/new/page'
import { getPlayersByUser } from '@/lib/actions/players'
import { getMatchesByPlayer } from '@/lib/actions/matches'

jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/actions/players', () => ({ getPlayersByUser: jest.fn() }))
jest.mock('@/lib/actions/matches', () => ({ getMatchesByPlayer: jest.fn().mockResolvedValue([]) }))
jest.mock('./dashboard-client', () => () => null)
jest.mock('../matches/new/_components/compact-match-wizard', () => ({ CompactMatchWizard: () => null }))

// An account like Mike's: 176 players, the main player (Sofie) created first, so she is not among the newest 100
const sofie = { $id: 'sofie', firstName: 'Sofie', lastName: 'Látalová', isMainPlayer: true }
const others = Array.from({ length: 175 }, (_, i) => ({ $id: `p${i}`, firstName: 'P', lastName: String(i), isMainPlayer: false }))
const newestFirst = [...others, sofie]
beforeEach(() => {
  jest.mocked(getPlayersByUser).mockImplementation(async (options?: { all?: boolean }) =>
    (options?.all ? newestFirst : newestFirst.slice(0, 100)) as never)
})

/** Finds the first element in a server-component tree whose props carry the given key. */
function findProp(node: unknown, key: string): unknown {
  if (!isValidElement(node)) return undefined
  const props = (node as ReactElement<Record<string, unknown>>).props
  if (key in props) return props[key]
  const children = Array.isArray(props.children) ? props.children : [props.children]
  for (const child of children) {
    const found = findProp(child, key)
    if (found !== undefined) return found
  }
  return undefined
}

it('finds the main player even when she is older than the newest 100 players', async () => {
  const page = await DashboardPage()
  expect(findProp(page, 'mainPlayer')).toEqual(sofie)
  expect(getMatchesByPlayer).toHaveBeenCalledWith('sofie')
})

it('gives the dashboard every player, so opponents older than the newest 100 keep their names', async () => {
  const page = await DashboardPage()
  expect(findProp(page, 'players')).toHaveLength(176)
})

it('offers every player when starting a new match', async () => {
  const page = await NewMatchPage()
  expect(findProp(page, 'players')).toHaveLength(176)
})
