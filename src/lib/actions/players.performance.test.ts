/** @jest-environment node */
import { getPlayersByUserPaginated, getPlayersByUser } from './players'

const mockListDocuments = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({
  createAdminClient: async () => ({ databases: { listDocuments: mockListDocuments } }),
  withRetry: async (operation: () => Promise<unknown>) => operation(),
}))
jest.mock('@/lib/env', () => ({ env: {
  APPWRITE_DATABASE_ID: 'db', APPWRITE_PLAYERS_COLLECTION_ID: 'players',
} }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const main = { $id: 'main', firstName: 'Main', isMainPlayer: true }
const others = Array.from({ length: 3 }, (_, i) => ({ $id: `other-${i}`, isMainPlayer: false }))
const queries = (call: unknown[]) => (call[2] as string[]).map(q => JSON.parse(q))

beforeEach(() => mockListDocuments.mockReset())

test('can resolve names for match history beyond the first 100 players', async () => {
  const first = Array.from({ length: 100 }, (_, i) => ({ $id: `player-${i}`, firstName: 'Player' }))
  mockListDocuments.mockResolvedValueOnce({ total: 101, documents: first }).mockResolvedValueOnce({ total: 101, documents: [{ $id: 'older-player' }] })
  const players = await getPlayersByUser({ all: true })
  expect(players).toHaveLength(101)
  expect(queries(mockListDocuments.mock.calls[1])).toEqual(expect.arrayContaining([expect.objectContaining({ method: 'cursorAfter', values: ['player-99'] })]))
})

test('starts the main and other-player reads together and reuses their totals', async () => {
  let resolveMain!: (value: unknown) => void
  mockListDocuments.mockImplementation((_db, _collection, qs: string[]) => {
    const isMain = qs.map(q => JSON.parse(q)).some(q => q.attribute === 'isMainPlayer' && q.values[0] === true)
    return isMain ? new Promise(resolve => { resolveMain = resolve }) : Promise.resolve({ total: 3, documents: others })
  })
  const result = getPlayersByUserPaginated({ limit: 3, sortBy: 'mainFirst' })
  await new Promise(resolve => setImmediate(resolve))
  const startedTogether = mockListDocuments.mock.calls.length === 2
  resolveMain({ total: 1, documents: [main] })
  const page = await result
  expect(startedTogether).toBe(true)
  expect(mockListDocuments).toHaveBeenCalledTimes(2)
  expect(page.players.map(p => p.$id)).toEqual(['main', 'other-0', 'other-1'])
  expect(page.total).toBe(4)
  expect(page.hasMore).toBe(true)
})

test('fills the first page when there is no main player', async () => {
  mockListDocuments.mockResolvedValueOnce({ total: 0, documents: [] }).mockResolvedValueOnce({ total: 3, documents: others })
  const page = await getPlayersByUserPaginated({ limit: 3, sortBy: 'mainFirst' })
  expect(page.players).toHaveLength(3)
  expect(page.total).toBe(3)
  expect(page.hasMore).toBe(false)
  expect(mockListDocuments).toHaveBeenCalledTimes(2)
})

test('a one-player page never sends a zero limit to Appwrite', async () => {
  mockListDocuments.mockResolvedValueOnce({ total: 1, documents: [main] }).mockResolvedValueOnce({ total: 3, documents: others.slice(0, 1) })
  const page = await getPlayersByUserPaginated({ limit: 1, sortBy: 'mainFirst' })
  expect(page.players.map(p => p.$id)).toEqual(['main'])
  for (const call of mockListDocuments.mock.calls) {
    expect(queries(call).find(q => q.method === 'limit')?.values[0]).toBeGreaterThan(0)
  }
})

test('propagates a backend failure instead of presenting an empty account', async () => {
  const silence = jest.spyOn(console, 'error').mockImplementation(() => {})
  mockListDocuments.mockRejectedValue(new Error('offline'))
  await expect(getPlayersByUserPaginated()).rejects.toThrow('offline')
  silence.mockRestore()
})
