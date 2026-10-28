/** @jest-environment node */
import { createPlayer } from './players'

const mockList = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockUpload = jest.fn()
jest.mock('@/lib/auth', () => ({ getCurrentUser: async () => ({ $id: 'owner' }) }))
jest.mock('@/lib/appwrite-server', () => ({
  createAdminClient: async () => ({ databases: { listDocuments: mockList, createDocument: mockCreate, updateDocument: mockUpdate }, storage: { createFile: mockUpload } }),
  withRetry: async (operation: () => Promise<unknown>) => operation(),
}))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'db', APPWRITE_PLAYERS_COLLECTION_ID: 'players' } }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const playerForm = (main: boolean) => {
  const data = new FormData()
  data.set('firstName', 'Alex')
  data.set('lastName', 'Court')
  if (main) data.set('isMainPlayer', 'true')
  return data
}
beforeEach(() => { mockList.mockReset(); mockCreate.mockReset(); mockUpdate.mockReset(); mockUpload.mockReset() })

it('refuses another main player before any document or image writes', async () => {
  mockList.mockResolvedValue({ total: 1, documents: [{ $id: 'existing' }] })
  expect(await createPlayer(playerForm(true))).toEqual({ error: 'MAIN_PLAYER_EXISTS' })
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(mockCreate).not.toHaveBeenCalled()
  expect(mockUpload).not.toHaveBeenCalled()
})

it('can create a main player if there is none, without modifying any existing player', async () => {
  mockList.mockResolvedValue({ total: 0, documents: [] })
  mockCreate.mockResolvedValue({ $id: 'new' })
  expect((await createPlayer(playerForm(true))).success).toBe(true)
  expect(mockCreate).toHaveBeenCalledWith('db', 'players', expect.any(String), expect.objectContaining({ isMainPlayer: true, userId: 'owner' }))
  expect(mockUpdate).not.toHaveBeenCalled()
})

it('creates an ordinary player without changing or querying the existing main player', async () => {
  mockCreate.mockResolvedValue({ $id: 'new' })
  expect((await createPlayer(playerForm(false))).success).toBe(true)
  expect(mockList).not.toHaveBeenCalled()
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(mockCreate).toHaveBeenCalledWith('db', 'players', expect.any(String), expect.objectContaining({ isMainPlayer: false }))
})

it('a failed creation never modifies an existing player', async () => {
  mockList.mockResolvedValue({ total: 0, documents: [] })
  mockCreate.mockRejectedValue(new Error('offline'))
  const silence = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect((await createPlayer(playerForm(true))).success).not.toBe(true)
  expect(mockUpdate).not.toHaveBeenCalled()
  silence.mockRestore()
})
