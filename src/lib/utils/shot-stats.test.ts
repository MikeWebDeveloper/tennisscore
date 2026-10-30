import { buildShotStats, type ShotPoint } from './shot-stats'

// Shaped like real shot-type points: the shot that ended the point and who hit it
const points: ShotPoint[] = [
  { winner: 'p1', server: 'p1', pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p1' },
  { winner: 'p2', server: 'p1', pointOutcome: 'forced_error', lastShotType: 'forehand', lastShotPlayer: 'p1' },
  // p2's return goes long: the server wins, the error is p2's backhand return
  { winner: 'p1', server: 'p1', pointOutcome: 'unforced_error', lastShotType: 'backhand', lastShotPlayer: 'p2', winnerType: 'return' },
  { winner: 'p2', server: 'p2', pointOutcome: 'ace', lastShotType: 'serve', servePlacement: 't' },
  // A return winner for p1 without lastShotPlayer: the winner hit it
  { winner: 'p1', server: 'p2', pointOutcome: 'winner', lastShotType: 'backhand', winnerType: 'return' },
]

describe('buildShotStats', () => {
  it('credits each point-ending shot to the player who hit it', () => {
    const stats = buildShotStats(points, 'shot-type')!
    expect(stats.pointsWithShot).toBe(4)
    expect(stats.sides.p1.byShot).toEqual({
      forehand: { winners: 1, unforcedErrors: 0, forcedErrors: 1 },
      backhand: { winners: 1, unforcedErrors: 0, forcedErrors: 0 },
    })
    expect(stats.sides.p2.byShot).toEqual({ backhand: { winners: 0, unforcedErrors: 1, forcedErrors: 0 } })
  })

  it('counts returns that ended the point and where aces landed', () => {
    const stats = buildShotStats(points, 'shot-type')!
    expect(stats.sides.p1.returns).toEqual({ winners: 1, unforcedErrors: 0, forcedErrors: 0 })
    expect(stats.sides.p2.returns).toEqual({ winners: 0, unforcedErrors: 1, forcedErrors: 0 })
    expect(stats.sides.p2.acePlacements).toEqual({ t: 1 })
    expect(stats.recorded).toMatchObject({ shots: true, returns: true, acePlacements: true, directions: false, net: false })
  })

  it('reports directions and net points when the level records them', () => {
    const stats = buildShotStats([
      { winner: 'p1', server: 'p1', pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p1', shotDirection: 'line', atNet: 'p1' },
      { winner: 'p2', server: 'p1', pointOutcome: 'unforced_error', lastShotType: 'volley', lastShotPlayer: 'p1', atNet: 'p1' },
    ], 'detailed')!
    expect(stats.sides.p1.directions).toEqual({ forehand: { line: { winners: 1, unforcedErrors: 0, forcedErrors: 0 } } })
    expect(stats.sides.p1.netPoints).toEqual({ played: 2, won: 1 })
  })

  it('has nothing to say at the simple level, where every shot is the "serve" filler', () => {
    expect(buildShotStats(points, 'simple')).toBeNull()
    expect(buildShotStats([{ winner: 'p1', server: 'p1', pointOutcome: 'winner', lastShotType: 'serve' }], 'shot-type')).toBeNull()
  })
})
