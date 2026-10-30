/**
 * @jest-environment node
 */
const getCurrentUser = jest.fn()
const getDocument = jest.fn()
const updateDocument = jest.fn()

jest.mock('@/lib/auth', () => ({ getCurrentUser: () => getCurrentUser() }))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'd', APPWRITE_MATCHES_COLLECTION_ID: 'm' } }))
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { getDocument, updateDocument } }) }))

import { setCurrentServe } from './match-serve'

const match = (extra: Record<string, unknown> = {}) => ({ userId: 'u1', status: 'In Progress', pointLog: ['a', 'b'], score: '{"points":[1,0]}', ...extra })

describe('setCurrentServe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getCurrentUser.mockResolvedValue({ $id: 'u1' })
    updateDocument.mockResolvedValue({})
  })

  it('saves a second serve into the stored score of the scorer\'s own match', async () => {
    getDocument.mockResolvedValue(match())
    await expect(setCurrentServe('m1', 'second', 2)).resolves.toEqual({ success: true })
    expect(updateDocument).toHaveBeenCalledWith('d', 'm', 'm1', { score: '{"points":[1,0],"serve":"second"}' })
  })

  it('ignores a tap that a newer point has overtaken', async () => {
    getDocument.mockResolvedValue(match({ pointLog: ['a', 'b', 'c'] }))
    await expect(setCurrentServe('m1', 'second', 2)).resolves.toEqual({ skipped: true })
    expect(updateDocument).not.toHaveBeenCalled()
  })

  it('writes nothing when the score already says so', async () => {
    getDocument.mockResolvedValue(match())
    await expect(setCurrentServe('m1', 'first', 2)).resolves.toEqual({ skipped: true })
    expect(updateDocument).not.toHaveBeenCalled()
  })

  it('refuses other people\'s matches and finished ones', async () => {
    getDocument.mockResolvedValue(match({ userId: 'someone-else' }))
    await expect(setCurrentServe('m1', 'second', 2)).resolves.toEqual({ error: 'Match unavailable' })
    getDocument.mockResolvedValue(match({ status: 'Completed' }))
    await expect(setCurrentServe('m1', 'second', 2)).resolves.toEqual({ error: 'Match unavailable' })
    getCurrentUser.mockResolvedValue(null)
    await expect(setCurrentServe('m1', 'second', 2)).resolves.toEqual({ error: 'Unauthorized' })
    expect(updateDocument).not.toHaveBeenCalled()
  })
})
