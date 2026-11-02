/** @jest-environment node */
import { closeUnfinishedMatch } from './match-close'

const getDocument = jest.fn()
const updateDocument = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { getDocument, updateDocument } }) }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches' } }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

beforeEach(() => { getDocument.mockReset(); updateDocument.mockReset() })

const point = (timestamp: string) => JSON.stringify({ winner: 'p1', server: 'p1', timestamp })

it('saves a stuck match as unfinished, with no winner, ending at its last point', async () => {
  getDocument.mockResolvedValue({ userId: 'owner', status: 'In Progress', pointLog: [point('2026-09-06T09:56:00.000Z'), point('2026-09-06T10:34:50.000Z')] })
  await expect(closeUnfinishedMatch('m1')).resolves.toEqual({ success: true })
  expect(updateDocument).toHaveBeenCalledWith('db', 'matches', 'm1', { status: 'Completed', retirementReason: 'unfinished', endTime: '2026-09-06T10:34:50.000Z' })
})

it.each([
  { userId: 'other', status: 'In Progress', pointLog: [] },
  { userId: 'owner', status: 'Completed', pointLog: [] },
  { userId: 'owner', status: 'In Progress', isDeleted: true, pointLog: [] },
])('leaves another account’s, a finished or a deleted match alone', async (match) => {
  getDocument.mockResolvedValue(match)
  expect(await closeUnfinishedMatch('m1')).toHaveProperty('error')
  expect(updateDocument).not.toHaveBeenCalled()
})
