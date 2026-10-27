/** @jest-environment node */
import { getMatchesByPlayer } from './matches'
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
})
