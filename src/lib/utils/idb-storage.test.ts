/**
 * @jest-environment node
 */
import 'fake-indexeddb/auto'
import { idbStorage, __resetIdbStorageForTests } from './idb-storage'

// Minimal localStorage stand-in for the node environment
function installLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => { data.set(k, v) },
    removeItem: (k: string) => { data.delete(k) },
  }
  return data
}

beforeEach(() => {
  __resetIdbStorageForTests()
  ;(globalThis as any).indexedDB = new (require('fake-indexeddb').IDBFactory)()
})

describe('idbStorage', () => {
  it('round-trips a value through IndexedDB', async () => {
    installLocalStorage()
    await idbStorage.setItem('k', '{"a":1}')
    expect(await idbStorage.getItem('k')).toBe('{"a":1}')
  })

  it('returns null for a missing key and removes keys', async () => {
    installLocalStorage()
    expect(await idbStorage.getItem('missing')).toBeNull()
    await idbStorage.setItem('k', 'v')
    await idbStorage.removeItem('k')
    expect(await idbStorage.getItem('k')).toBeNull()
  })

  it('reads a value saved earlier in localStorage and migrates it on the next save', async () => {
    const ls = installLocalStorage({ k: 'legacy' })
    expect(await idbStorage.getItem('k')).toBe('legacy')
    await idbStorage.setItem('k', 'new')
    expect(await idbStorage.getItem('k')).toBe('new')
    expect(ls.has('k')).toBe(false) // legacy copy removed once IndexedDB holds the data
  })

  it('keeps data in localStorage when IndexedDB is unavailable', async () => {
    const ls = installLocalStorage()
    ;(globalThis as any).indexedDB = undefined
    await idbStorage.setItem('k', 'v')
    expect(ls.get('k')).toBe('v')
    expect(await idbStorage.getItem('k')).toBe('v')
    await idbStorage.removeItem('k')
    expect(ls.has('k')).toBe(false)
  })

  it('falls back instead of hanging when IndexedDB never answers', async () => {
    jest.useFakeTimers()
    try {
      const ls = installLocalStorage({ k: 'fallback' })
      ;(globalThis as any).indexedDB = { open: () => ({}) } // request that never fires any event
      const pending = idbStorage.getItem('k')
      await jest.advanceTimersByTimeAsync(2000)
      await expect(pending).resolves.toBe('fallback')
      expect(ls.get('k')).toBe('fallback')
    } finally {
      jest.useRealTimers()
    }
  })

  it('never throws even when both stores are unusable', async () => {
    ;(globalThis as any).indexedDB = undefined
    ;(globalThis as any).localStorage = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('denied') },
    }
    await expect(idbStorage.setItem('k', 'v')).resolves.toBeUndefined()
    await expect(idbStorage.getItem('k')).resolves.toBeNull()
    await expect(idbStorage.removeItem('k')).resolves.toBeUndefined()
  })
})
