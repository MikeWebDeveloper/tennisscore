/** @jest-environment node */
import { setMatchPaused } from './match-pause'

const getDocument = jest.fn()
const updateDocument = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { getDocument, updateDocument } }) }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches' } }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

beforeEach(() => { getDocument.mockReset(); updateDocument.mockReset() })

it('only updates the pause flag on a match owned by the user', async () => {
  getDocument.mockResolvedValue({ userId: 'owner', status: 'In Progress' })
  await expect(setMatchPaused('match', true, 'rain')).resolves.toEqual({ success: true })
  expect(updateDocument).toHaveBeenCalledWith('db', 'matches', 'match', { isPaused: true, pauseReason: 'rain' })
})

it('clears the interruption reason on resume', async () => {
  getDocument.mockResolvedValue({ userId: 'owner', status: 'In Progress' })
  await expect(setMatchPaused('match', false)).resolves.toEqual({ success: true })
  expect(updateDocument).toHaveBeenCalledWith('db', 'matches', 'match', { isPaused: false, pauseReason: '' })
})

it('rejects unsupported interruption reasons before modifying a match', async () => {
  expect(await setMatchPaused('match', true, 'invalid' as never)).toHaveProperty('error')
  expect(updateDocument).not.toHaveBeenCalled()
})

it.each([{ userId: 'other', status: 'In Progress' }, { userId: 'owner', status: 'Completed' }])('does not change a completed match or another account’s match', async (match) => {
  getDocument.mockResolvedValue(match)
  expect(await setMatchPaused('match', true)).toHaveProperty('error')
  expect(updateDocument).not.toHaveBeenCalled()
})
