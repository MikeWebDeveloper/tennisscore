/** @jest-environment node */
import { GET } from './route'

const getDocument = jest.fn()
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { getDocument } }) }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches' } }))

it('returns only live score fields with caching disabled', async () => {
  getDocument.mockResolvedValueOnce({ score: '{}', status: 'In Progress', pointLog: [], winnerId: null, userId: 'private-owner', events: ['private'] })
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ matchId: 'match1' }) })
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(await response.json()).toEqual({ score: '{}', status: 'In Progress', pointLog: [], winnerId: null })
})

it('does not expose deleted matches', async () => {
  getDocument.mockResolvedValueOnce({ isDeleted: true })
  const response = await GET(new Request('http://localhost'), { params: Promise.resolve({ matchId: 'match1' }) })
  expect(response.status).toBe(404)
})
