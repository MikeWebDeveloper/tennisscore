import { spectatorSoundFor, type ScoreSnapshot } from './spectator-sounds'

const snap = (points: Array<{ pointOutcome?: string }>, sets: number[][], games: number[], status = 'In Progress'): ScoreSnapshot => ({ pointCount: points.length, lastOutcome: points.at(-1)?.pointOutcome, sets: sets.length, games: games[0] + games[1], status })

describe('spectatorSoundFor', () => {
  it('stays quiet when no new point arrived (first load, refresh, or an undo)', () => {
    const before = snap([{}, {}], [], [1, 0])
    expect(spectatorSoundFor(before, before)).toBeNull()
    expect(spectatorSoundFor(before, snap([{}], [], [0, 0]))).toBeNull()
  })

  it('plays a point sound for an ordinary point', () => {
    expect(spectatorSoundFor(snap([{}], [], [0, 0]), snap([{}, { pointOutcome: 'winner' }], [], [0, 0]))).toBe('point-won')
  })

  it('plays ace and double fault sounds', () => {
    expect(spectatorSoundFor(snap([], [], [0, 0]), snap([{ pointOutcome: 'ace' }], [], [0, 0]))).toBe('ace')
    expect(spectatorSoundFor(snap([], [], [0, 0]), snap([{ pointOutcome: 'double_fault' }], [], [0, 0]))).toBe('double-fault')
  })

  it('plays game, set and match sounds, the biggest event winning', () => {
    expect(spectatorSoundFor(snap([{}], [], [2, 1]), snap([{}, {}], [], [3, 1]))).toBe('game-won')
    expect(spectatorSoundFor(snap([{}], [], [5, 4]), snap([{}, {}], [[6, 4]], [0, 0]))).toBe('set-won')
    expect(spectatorSoundFor(snap([{}], [[6, 4]], [5, 3]), snap([{}, { pointOutcome: 'ace' }], [[6, 4], [6, 3]], [0, 0], 'Completed'))).toBe('match-won')
  })
})
