/** @jest-environment node */
import { withRetry } from './appwrite-server'

jest.mock('./env', () => ({ env: {} }))
jest.mock('./session', () => ({ getSession: jest.fn() }))

afterEach(() => jest.useRealTimers())

it('clears the request timeout immediately when a read succeeds', async () => {
  jest.useFakeTimers()
  await expect(withRetry(async () => 'loaded', 'NAVIGATION')).resolves.toBe('loaded')
  expect(jest.getTimerCount()).toBe(0)
})

const after = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))

it('waits for a page read that takes three seconds instead of failing the page', async () => {
  jest.useFakeTimers()
  const read = withRetry(() => after(3000, 'players'), 'NAVIGATION')
  await jest.advanceTimersByTimeAsync(3000)
  await expect(read).resolves.toBe('players')
})

it('asks again when the first page read hangs', async () => {
  jest.useFakeTimers()
  const operation = jest.fn()
    .mockImplementationOnce(() => new Promise(() => {}))
    .mockImplementationOnce(() => after(100, 'matches'))
  const read = withRetry(operation, 'NAVIGATION')
  await jest.advanceTimersByTimeAsync(10000)
  await expect(read).resolves.toBe('matches')
  expect(operation).toHaveBeenCalledTimes(2)
})

it('still gives up on a page read that never answers', async () => {
  jest.useFakeTimers()
  const read = withRetry(() => new Promise(() => {}), 'NAVIGATION')
  const outcome = read.catch((error: Error) => error)
  await jest.advanceTimersByTimeAsync(10000)
  await expect(outcome).resolves.toBeInstanceOf(Error)
})
