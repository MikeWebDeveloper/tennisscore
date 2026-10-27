/** @jest-environment node */
import { withRetry } from './appwrite-server'

jest.mock('./env', () => ({ env: {} }))
jest.mock('./session', () => ({ getSession: jest.fn() }))

it('clears the request timeout immediately when a read succeeds', async () => {
  jest.useFakeTimers()
  try {
    await expect(withRetry(async () => 'loaded', 'NAVIGATION')).resolves.toBe('loaded')
    expect(jest.getTimerCount()).toBe(0)
  } finally {
    jest.useRealTimers()
  }
})
