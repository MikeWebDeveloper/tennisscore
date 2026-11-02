/** @jest-environment node */
import { GET } from './route'

const listDocuments = jest.fn()
const deleteDocument = jest.fn()
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { listDocuments, deleteDocument } }) }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches' } }))

const now = Date.parse('2026-11-10T03:00:00.000Z')
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString()
const request = (token?: string) => new Request('https://tenis.click/api/cron/purge-deleted', token ? { headers: { authorization: `Bearer ${token}` } } : undefined)

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(now)
  listDocuments.mockReset().mockResolvedValue({ total: 3, documents: [
    { $id: 'old', isDeleted: true, deletedAt: daysAgo(8) },
    { $id: 'recent', isDeleted: true, deletedAt: daysAgo(2) },
    { $id: 'undated', isDeleted: true },
  ] })
  deleteDocument.mockReset()
  delete process.env.CRON_SECRET
})
afterEach(() => jest.useRealTimers())

it('deletes nothing while no secret is set in Vercel', async () => {
  expect((await GET(request('anything'))).status).toBe(401)
  expect(deleteDocument).not.toHaveBeenCalled()
})

it('refuses a call without the secret', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  expect((await GET(request())).status).toBe(401)
  expect((await GET(request('wrong'))).status).toBe(401)
  expect(deleteDocument).not.toHaveBeenCalled()
})

it('permanently deletes only matches deleted more than 7 days ago', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  const response = await GET(request('cron-secret'))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ deleted: 1 })
  expect(deleteDocument).toHaveBeenCalledTimes(1)
  expect(deleteDocument).toHaveBeenCalledWith('db', 'matches', 'old')
})
