/** @jest-environment node */
import { GET } from './route'

const listDocuments = jest.fn()
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { listDocuments } }) }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches' } }))

beforeEach(() => listDocuments.mockReset())

it('answers 200 when the database answers, without returning any match data', async () => {
  listDocuments.mockResolvedValue({ total: 913, documents: [{ $id: 'm1', score: 'secret' }] })
  const response = await GET()
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.ok).toBe(true)
  expect(JSON.stringify(body)).not.toMatch(/m1|secret|913/)
  expect(response.headers.get('cache-control')).toMatch(/no-store/)
})

it('answers 503 when the database query fails, as in the 27 October outage', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  listDocuments.mockRejectedValue(new Error('Invalid query: Attribute not found in schema: playerOneData'))
  const response = await GET()
  expect(response.status).toBe(503)
  expect((await response.json()).ok).toBe(false)
})
