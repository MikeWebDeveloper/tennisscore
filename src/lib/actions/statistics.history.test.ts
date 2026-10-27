/** @jest-environment node */
import { getMatchesWithStats } from './statistics'

const mockListDocuments = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({
  createAdminClient: async () => ({ databases: { listDocuments: mockListDocuments } }),
}))
jest.mock('@/lib/env', () => ({ env: {
  APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches', APPWRITE_PLAYERS_COLLECTION_ID: 'players',
} }))

beforeEach(() => mockListDocuments.mockReset())

it('loads a further page of nondeleted matches scoped to the current user', async () => {
  mockListDocuments.mockResolvedValue({ documents: [] })
  await getMatchesWithStats('player', { limit: 50, cursorAfter: 'last-match' })
  const queries = mockListDocuments.mock.calls[0][2].map((query: string) => JSON.parse(query))
  expect(queries).toEqual(expect.arrayContaining([
    expect.objectContaining({ method: 'cursorAfter', values: ['last-match'] }),
    expect.objectContaining({ method: 'equal', attribute: 'userId', values: ['owner'] }),
    expect.objectContaining({ method: 'or', values: expect.arrayContaining([
      expect.objectContaining({ method: 'equal', attribute: 'isDeleted', values: [false] }),
      expect.objectContaining({ method: 'isNull', attribute: 'isDeleted' }),
    ]) }),
  ]))
})

it('reports history failures instead of presenting them as no matches', async () => {
  mockListDocuments.mockRejectedValue(new Error('Appwrite unavailable'))
  await expect(getMatchesWithStats('player')).rejects.toThrow('Appwrite unavailable')
})

it('requests enough player documents to avoid Appwrite’s default 25-result limit', async () => {
  const matches = Array.from({ length: 30 }, (_, i) => ({
    $id: `match-${i}`, playerOneId: 'main', playerTwoId: `opponent-${i}`, status: 'Completed',
  }))
  mockListDocuments.mockResolvedValueOnce({ documents: matches }).mockResolvedValueOnce({ documents: [] })
  await getMatchesWithStats('main')
  const queries = mockListDocuments.mock.calls[1][2].map((query: string) => JSON.parse(query))
  expect(queries).toEqual(expect.arrayContaining([expect.objectContaining({ method: 'limit', values: [31] })]))
})
