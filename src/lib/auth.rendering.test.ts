/** @jest-environment node */
import { getCurrentUser } from './auth'
import { getSession } from './session'

jest.mock('./session', () => ({ getSession: jest.fn() }))
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  unstable_rethrow: (error: unknown) => {
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') throw error
  },
}))

beforeEach(() => {
  delete process.env.PLAYWRIGHT
  delete process.env.DISABLE_AUTH_FOR_TEST
  jest.resetAllMocks()
})

it('allows Next.js dynamic rendering signals to escape session lookup', async () => {
  const signal = Object.assign(new Error('dynamic request'), { digest: 'DYNAMIC_SERVER_USAGE' })
  jest.mocked(getSession).mockRejectedValueOnce(signal)
  await expect(getCurrentUser()).rejects.toBe(signal)
})

it('treats an ordinary session failure as unauthenticated', async () => {
  jest.mocked(getSession).mockRejectedValueOnce(new Error('invalid session'))
  await expect(getCurrentUser()).resolves.toBeNull()
})
