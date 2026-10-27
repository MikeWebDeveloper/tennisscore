/** @jest-environment node */
import { getMatchesByPlayer, getMatchesByUserPaginated } from './matches'
import { MATCH_LIST_FIELDS } from '@/lib/utils/match-list-fields'

const mockListDocuments = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({
  createAdminClient: async () => ({ databases: { listDocuments: mockListDocuments } }),
  withRetry: async (operation: () => Promise<unknown>) => operation(),
}))
jest.mock('@/lib/env', () => ({ env: {
  APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches',
} }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

it('loads dashboard scores without transferring match histories, retaining status and deletion handling', async () => {
  const rows = [
    { $id: 'played', userId: 'owner', status: 'Completed', score: '{"sets":[[6,4],[6,2]]}', winnerId: 'player', pointLog: ['large history'], events: ['large event'] },
    { $id: 'deleted', userId: 'owner', status: 'Completed', isDeleted: true },
  ]
  mockListDocuments.mockImplementation(async (_db, _collection, qs: string[]) => {
    const selection = qs.map(q => JSON.parse(q)).find(q => q.method === 'select')?.values as string[] | undefined
    return { total: rows.length, documents: rows.map(row => selection
      ? Object.fromEntries(Object.entries(row).filter(([key]) => selection.includes(key))) : row) }
  })
  const result = await getMatchesByPlayer('player')
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({ $id: 'played', status: 'completed', winnerId: 'player' })
  expect(result[0]).not.toHaveProperty('pointLog')
  expect(result[0]).not.toHaveProperty('events')
  expect(MATCH_LIST_FIELDS).toContain('score')
  const queries = mockListDocuments.mock.calls[0][2].map((query: string) => JSON.parse(query))
  const playerFilter = queries.find((query: { method: string }) => query.method === 'or')
  expect(playerFilter.values.map((query: { attribute: string }) => query.attribute)).toEqual([
    'playerOneId', 'playerTwoId', 'playerThreeId', 'playerFourId',
  ])
})

it('reports a dashboard query failure instead of returning an empty match history', async () => {
  mockListDocuments.mockRejectedValueOnce(new Error('Appwrite unavailable'))
  await expect(getMatchesByPlayer('player')).rejects.toThrow('Appwrite unavailable')
})

it('reports a match list query failure instead of returning an empty match list', async () => {
  mockListDocuments.mockRejectedValue(new Error('Appwrite unavailable'))
  await expect(getMatchesByUserPaginated()).rejects.toThrow('Appwrite unavailable')
  mockListDocuments.mockReset()
})

it('uses one filtered query for match pages and their total', async () => {
  mockListDocuments.mockReset()
  mockListDocuments.mockResolvedValue({ total: 21, documents: [{ $id: 'match1', isDeleted: false }] })
  const page = await getMatchesByUserPaginated({ limit: 1, offset: 0, dateFilter: 'thisYear' })
  expect(page.total).toBe(21)
  expect(page.hasMore).toBe(true)
  expect(mockListDocuments).toHaveBeenCalledTimes(1)
  const queries = mockListDocuments.mock.calls[0][2].map((query: string) => JSON.parse(query))
  expect(queries).toEqual(expect.arrayContaining([
    expect.objectContaining({ method: 'greaterThanEqual', attribute: 'matchDate' }),
    expect.objectContaining({ method: 'or', values: expect.arrayContaining([
      expect.objectContaining({ method: 'equal', attribute: 'isDeleted', values: [false] }),
      expect.objectContaining({ method: 'isNull', attribute: 'isDeleted' }),
    ]) }),
  ]))
})
