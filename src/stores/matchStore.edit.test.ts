/**
 * @jest-environment node
 */
jest.unmock('@/stores/matchStore')
import 'fake-indexeddb/auto'

type Side = 'p1' | 'p2'
const match = (sets: 1 | 3 = 3) => ({
  $id: 'edit', playerOneId: 'a', playerTwoId: 'b', matchDate: '2026-09-06',
  matchFormat: { sets, noAd: false, tiebreak: true, finalSetTiebreak: 'standard' },
  status: 'In Progress',
  score: { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] },
  pointLog: [], events: [], userId: 'u',
}) as never

function load() {
  let mod: typeof import('./matchStore') | undefined
  jest.isolateModules(() => { mod = require('./matchStore') })
  return mod!
}

let scoredMatches = 0

/** A log scored with the real store, each point a minute apart from 10:00 */
async function scored(winners: Side[], { server = 'p1' as Side, sets = 3 as 1 | 3 } = {}) {
  const { useMatchStore } = load()
  await useMatchStore.persist.rehydrate()
  // A new id each time: the persisted progress of the previous test's match must not be resumed
  useMatchStore.getState().initializeMatch({ ...(match(sets) as object), $id: `scored-${++scoredMatches}` } as never)
  useMatchStore.getState().setServer(server)
  for (const winner of winners) useMatchStore.getState().awardPoint(winner, { serveType: 'first', pointOutcome: 'winner' })
  return useMatchStore.getState().pointLog.map((point, i) => ({ ...point, timestamp: new Date(Date.UTC(2026, 8, 6, 10, i)).toISOString() }))
}

const p1x = (n: number): Side[] => Array(n).fill('p1')
const p2x = (n: number): Side[] => Array(n).fill('p2')

it('gives a mistapped point to the other player and recounts everything after it', async () => {
  const log = await scored([...p1x(4), ...p2x(4)])
  const { editPointLog } = load()
  const result = editPointLog(match(), log, { kind: 'change-winner', index: 3, outcome: 'unforced_error' })

  // Game one was 40:15 instead of won, so the next four points take it to deuce, advantage and the game
  expect(result.score.games).toEqual([0, 1])
  expect(result.score.points).toEqual([0, 0])
  expect(result.pointLog.map(p => p.gameNumber)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  expect(result.pointLog.map(p => p.server)).toEqual(Array(8).fill('p1'))
  // Deuce is not a break point yet; advantage to the receiver is
  expect(result.pointLog.map(p => p.isBreakPoint)).toEqual([false, false, false, false, false, false, false, true])
  expect(result.pointLog[3].winner).toBe('p2')
  // How it ended is what the scorer picked again: player one's error, not their winner
  expect(result.pointLog[3]).toMatchObject({ pointOutcome: 'unforced_error', lastShotPlayer: 'p1' })
  // Every point keeps the time it was played
  expect(result.pointLog.map(p => p.timestamp)).toEqual(log.map(p => p.timestamp))
})

it('deletes a point that was never played and renumbers the rest', async () => {
  const log = await scored([...p1x(4), 'p2'])
  const { editPointLog } = load()
  const result = editPointLog(match(), log, { kind: 'delete', index: 0 })
  expect(result.score.games).toEqual([0, 0])
  expect(result.score.points).toEqual([3, 1])
  expect(result.pointLog.map(p => p.pointNumber)).toEqual([1, 2, 3, 4])
})

it('inserts a point the scorer missed, timed with the point before it', async () => {
  const log = await scored(p1x(3))
  const { editPointLog } = load()
  const result = editPointLog(match(), log, { kind: 'insert', index: 1, winner: 'p2', outcome: 'ace' })
  expect(result.pointLog.map(p => p.winner)).toEqual(['p1', 'p2', 'p1', 'p1'])
  expect(result.pointLog[1].pointOutcome).toBe('ace')
  expect(result.score.points).toEqual([3, 1])
  expect(result.pointLog[1].timestamp).toBe(log[0].timestamp)
})

it('keeps the server the scorer chose for the first game', async () => {
  const log = await scored([...p1x(4), 'p2'], { server: 'p2' })
  const { editPointLog } = load()
  const result = editPointLog(match(), log, { kind: 'delete', index: 4 })
  expect(result.pointLog.map(p => p.server)).toEqual(['p2', 'p2', 'p2', 'p2'])
  expect(result.currentServer).toBe('p1')
})

// One set: p1 wins five games to love, the sixth goes to deuce twice before p1 takes it (28 points)
const oneSet: Side[] = [...p1x(20), 'p1', 'p2', 'p1', 'p2', 'p1', 'p2', 'p1', 'p1']

it('refuses a change after which the match would be over before its last point', async () => {
  const log = await scored(oneSet, { sets: 1 })
  const { editPointLog, PointLogEditError } = load()
  expect(() => editPointLog(match(1), log.slice(0, 27), { kind: 'change-winner', index: 21 })).toThrow(PointLogEditError)
  try { editPointLog(match(1), log.slice(0, 27), { kind: 'change-winner', index: 21 }) } catch (error) {
    expect((error as InstanceType<typeof PointLogEditError>).reason).toBe('ends-early')
  }
})

it('refuses a change that would finish the match, which is scored with the last point instead', async () => {
  const log = await scored(oneSet.slice(0, 27), { sets: 1 })
  const { editPointLog } = load()
  expect(() => editPointLog(match(1), log, { kind: 'insert', index: 26, winner: 'p1' })).toThrow(expect.objectContaining({ reason: 'completes-match' }))
})
