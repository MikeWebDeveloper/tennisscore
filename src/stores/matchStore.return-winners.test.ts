/**
 * @jest-environment node
 */
jest.unmock('@/stores/matchStore')
import 'fake-indexeddb/auto'

const match = {
  $id: 'returns', playerOneId: 'a', playerTwoId: 'b', matchDate: '2026-01-01',
  matchFormat: { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' },
  status: 'In Progress',
  score: { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] },
  pointLog: [], events: [], userId: 'u',
} as never

function freshStore() {
  let mod: { useMatchStore: typeof import('./matchStore').useMatchStore } | undefined
  jest.isolateModules(() => { mod = require('./matchStore') })
  return mod!.useMatchStore
}

const returnWinner = { pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p2', winnerType: 'return', shotDirection: 'cross' } as const

// After every point the live page reloads the match from the server and re-initialises the store;
// that used to drop winnerType, so only the latest return winner kept its mark
it('keeps every return winner marked as a return across the reload after each point', async () => {
  const store = freshStore()
  await store.persist.rehydrate()
  store.getState().initializeMatch(match)
  store.getState().setServer('p1')

  for (let i = 0; i < 3; i++) {
    store.getState().awardPoint('p2', returnWinner as never)
    // What the page does after the save: reload the saved log from the server
    const saved = JSON.parse(JSON.stringify(store.getState().pointLog))
    store.getState().initializeMatch({ ...(match as object), pointLog: saved } as never)
  }

  const log = store.getState().pointLog as { winnerType?: string; lastShotType?: string }[]
  expect(log).toHaveLength(3)
  expect(log.map(point => point.winnerType)).toEqual(['return', 'return', 'return'])
  expect(log.map(point => point.lastShotType)).toEqual(['forehand', 'forehand', 'forehand'])
})

it('keeps the other optional point fields through a reload too', async () => {
  const store = freshStore()
  await store.persist.rehydrate()
  store.getState().initializeMatch({ ...(match as object), $id: 'extras', pointLog: [{ winner: 'p2', server: 'p1', winnerType: 'return', serveSpeed: 150, actionPlayer: 'p2', atNet: 'p2' }] } as never)
  expect(store.getState().pointLog[0]).toMatchObject({ winnerType: 'return', serveSpeed: 150, actionPlayer: 'p2', atNet: 'p2' })
})
