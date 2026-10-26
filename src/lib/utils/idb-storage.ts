import type { StateStorage } from 'zustand/middleware'

/**
 * Key-value storage on IndexedDB for the persisted in-progress match.
 * - falls back to localStorage if IndexedDB is unavailable, blocked or too slow
 * - migrates a value saved earlier in localStorage (read from there, written to IndexedDB on next save)
 * - never throws: scoring must keep working whatever the browser does with storage
 */
const DB_NAME = 'tenis-click'
const STORE = 'kv'
const OPEN_TIMEOUT_MS = 1500

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'))
    const timer = setTimeout(() => reject(new Error('IndexedDB open timed out')), OPEN_TIMEOUT_MS)
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => { clearTimeout(timer); resolve(request.result) }
    request.onerror = () => { clearTimeout(timer); reject(request.error ?? new Error('IndexedDB open failed')) }
    request.onblocked = () => { clearTimeout(timer); reject(new Error('IndexedDB blocked')) }
  }).catch((error) => {
    dbPromise = null // allow a later retry
    throw error
  })
  return dbPromise
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const request = fn(db.transaction(STORE, mode).objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const local = {
  get: (name: string) => { try { return localStorage.getItem(name) } catch { return null } },
  set: (name: string, value: string) => { try { localStorage.setItem(name, value) } catch { /* quota / disabled */ } },
  remove: (name: string) => { try { localStorage.removeItem(name) } catch { /* disabled */ } },
}

export const idbStorage: StateStorage = {
  async getItem(name) {
    try {
      const value = await run<string | undefined>('readonly', (s) => s.get(name))
      if (typeof value === 'string') return value
    } catch {
      // fall through to localStorage
    }
    return local.get(name)
  },

  async setItem(name, value) {
    try {
      await run('readwrite', (s) => s.put(value, name))
      local.remove(name) // the legacy copy is superseded
      return
    } catch {
      // fall through: keep the data somewhere rather than lose points
    }
    local.set(name, value)
  },

  async removeItem(name) {
    try {
      await run('readwrite', (s) => s.delete(name))
    } catch {
      // ignore
    }
    local.remove(name)
  },
}

/** Test helper: forget the cached connection. */
export function __resetIdbStorageForTests() {
  dbPromise = null
}
