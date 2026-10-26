/**
 * @jest-environment node
 */
jest.unmock('@/stores/matchStore')
import 'fake-indexeddb/auto'

const match = {
  $id: 'm1', playerOneId: 'a', playerTwoId: 'b', matchDate: '2026-01-01',
  matchFormat: { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' },
  status: 'In Progress',
  score: { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] },
  pointLog: [], events: [], userId: 'u',
} as any

/** A fresh copy of the store module = a fresh page load. IndexedDB (global) survives. */
function freshStore() {
  let mod: any
  jest.isolateModules(() => { mod = require('./matchStore') })
  return mod.useMatchStore
}
const settle = () => new Promise((r) => setTimeout(r, 50))

describe('match store persisted in IndexedDB', () => {
  it('survives a reload: unsent points come back and are not overwritten by an older server copy', async () => {
    const first = freshStore()
    await first.persist.rehydrate()
    first.getState().initializeMatch(match)
    first.getState().setServer('p1')
    first.getState().awardPoint('p1', {})
    first.getState().awardPoint('p2', {})
    first.getState().awardPoint('p1', {})
    await settle() // let the async writes land

    // "Reload": new module instance, storage loads asynchronously
    const second = freshStore()
    expect(second.persist.hasHydrated()).toBe(false)
    expect(second.getState().pointLog.length).toBe(0) // nothing loaded yet: screens must wait
    await second.persist.rehydrate()
    expect(second.persist.hasHydrated()).toBe(true)
    expect(second.getState().pointLog.length).toBe(3)
    expect(second.getState().score.points).toEqual([2, 1])

    // The server still has the older, empty copy: local progress must win and be flagged for resync
    second.getState().initializeMatch(match)
    expect(second.getState().pointLog.length).toBe(3)
    expect(second.getState().needsResync).toBe(true)
  })

  it('a different match does not inherit the persisted progress', async () => {
    const third = freshStore()
    await third.persist.rehydrate()
    third.getState().initializeMatch({ ...match, $id: 'other' })
    expect(third.getState().pointLog.length).toBe(0)
    expect(third.getState().needsResync).toBe(false)
  })
})
