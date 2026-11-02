/** @jest-environment node */
import { updateMatchFormat, updateMatchScore } from './matches'
import { removePlayerProfilePicture, updatePlayer, updatePlayerProfilePicture } from './players'
import * as matchActions from './matches'

// Server actions write with the admin key, so each one has to check the record's owner itself
const mockGet = jest.fn()
const mockUpdate = jest.fn()
const mockList = jest.fn()
const mockDeleteFile = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'intruder', email: 'x@example.com' }), isAdmin: () => false }))
jest.mock('@/lib/appwrite-server', () => ({
  createAdminClient: async () => ({
    databases: { getDocument: mockGet, updateDocument: mockUpdate, listDocuments: mockList },
    storage: { deleteFile: mockDeleteFile, createFile: jest.fn() },
  }),
  withRetry: async (operation: () => Promise<unknown>) => operation(),
}))
jest.mock('@/lib/env', () => ({
  env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_MATCHES_COLLECTION_ID: 'matches', APPWRITE_PLAYERS_COLLECTION_ID: 'players', APPWRITE_PROFILE_PICTURES_BUCKET_ID: 'pictures' },
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
  mockGet.mockReset().mockResolvedValue({ $id: 'doc', userId: 'owner', profilePictureId: 'file' })
  mockUpdate.mockReset().mockResolvedValue({})
  mockList.mockReset().mockResolvedValue({ documents: [], total: 0 })
  mockDeleteFile.mockReset()
})

const playerForm = () => {
  const data = new FormData()
  data.set('firstName', 'Alex')
  data.set('lastName', 'Court')
  return data
}

it.each([
  ['saving a score', () => updateMatchScore('m1', { score: { sets: [] }, pointLog: [], status: 'Completed', winnerId: 'p' })],
  ['changing the format', () => updateMatchFormat('m1', { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' } as never)],
  ['editing a player', () => updatePlayer('p1', playerForm())],
  ['setting a player photo', () => updatePlayerProfilePicture('p1', 'file')],
  ['removing a player photo', () => removePlayerProfilePicture('p1')],
])('refuses %s on another account’s record', async (_name, act) => {
  const result = await act()
  expect(result).toHaveProperty('error')
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(mockDeleteFile).not.toHaveBeenCalled()
})

it('still saves the score of the owner’s own match', async () => {
  mockGet.mockResolvedValue({ $id: 'm1', userId: 'intruder' })
  await expect(updateMatchScore('m1', { score: { sets: [] }, pointLog: [] })).resolves.toHaveProperty('success', true)
  expect(mockUpdate).toHaveBeenCalledTimes(1)
})

it('no longer offers the sample-data generator that overwrote any match’s point log', () => {
  expect(matchActions).not.toHaveProperty('generateDetailedPointData')
})
