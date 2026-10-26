import { getDoublesServers, getNextDoublesServer, startsNewServeTurn, type ServeLogPoint } from './doubles-serving'

type Team = 'p1' | 'p2'
const pt = (setNumber: number, gameNumber: number, server: Team, isTiebreak = false): ServeLogPoint =>
  ({ setNumber, gameNumber, server, isTiebreak })

/** n points of one service game (set/game/server fixed). */
const game = (set: number, g: number, server: Team, n = 4): ServeLogPoint[] =>
  Array.from({ length: n }, () => pt(set, g, server))

describe('doubles serve rotation', () => {
  it('rotates p1, p2, p3, p4 over four games with the default order', () => {
    const log = [...game(1, 1, 'p1'), ...game(1, 2, 'p2'), ...game(1, 3, 'p1'), ...game(1, 4, 'p2'), ...game(1, 5, 'p1')]
    const servers = getDoublesServers(log)
    const perGame = [0, 4, 8, 12, 16].map((i) => servers[i])
    expect(perGame).toEqual(['p1', 'p2', 'p3', 'p4', 'p1'])
  })

  it('keeps the same server for every point of a game (incl. long deuce games)', () => {
    const servers = getDoublesServers([...game(1, 1, 'p1', 11), ...game(1, 2, 'p2', 5)])
    expect(new Set(servers.slice(0, 11))).toEqual(new Set(['p1']))
    expect(new Set(servers.slice(11))).toEqual(new Set(['p2']))
  })

  it('honours a custom first server for each team', () => {
    const log = [...game(1, 1, 'p1'), ...game(1, 2, 'p2'), ...game(1, 3, 'p1'), ...game(1, 4, 'p2')]
    const servers = getDoublesServers(log, { p1: 'p3', p2: 'p4' })
    expect([0, 4, 8, 12].map((i) => servers[i])).toEqual(['p3', 'p4', 'p1', 'p2'])
  })

  it('continues the rotation across sets', () => {
    // Set 1: 4 games (p1,p2,p3,p4); set 2 starts with team p1 again -> p1 serves (3rd game of team p1)
    const log = [
      ...game(1, 1, 'p1'), ...game(1, 2, 'p2'), ...game(1, 3, 'p1'), ...game(1, 4, 'p2'),
      ...game(2, 1, 'p1'), ...game(2, 2, 'p2'),
    ]
    const servers = getDoublesServers(log)
    expect(servers[16]).toBe('p1')
    expect(servers[20]).toBe('p2')
  })

  it('rotates inside a tiebreak: 1 point, then 2 each, partners alternating', () => {
    // Tiebreak: team p1 serves pt 1, team p2 pts 2-3, team p1 pts 4-5, team p2 pts 6-7, team p1 pts 8-9
    const tbTeams: Team[] = ['p1', 'p2', 'p2', 'p1', 'p1', 'p2', 'p2', 'p1', 'p1']
    const log = tbTeams.map((s) => pt(1, 13, s, true))
    expect(getDoublesServers(log)).toEqual(['p1', 'p2', 'p2', 'p3', 'p3', 'p4', 'p4', 'p1', 'p1'])
  })

  it('is deterministic after undo (recomputed from the log)', () => {
    const full = [...game(1, 1, 'p1'), ...game(1, 2, 'p2'), ...game(1, 3, 'p1', 2)]
    expect(getDoublesServers(full.slice(0, 8))).toEqual(getDoublesServers(full).slice(0, 8))
  })
})

describe('next server (before the point is played)', () => {
  it('first point of the match: team p1 serves with its default first server', () => {
    expect(getNextDoublesServer([], 'p1', true)).toBe('p1')
    expect(getNextDoublesServer([], 'p2', true)).toBe('p2')
  })

  it('continues the current game with the same player', () => {
    const log = game(1, 1, 'p1', 2)
    expect(getNextDoublesServer(log, 'p1', false)).toBe('p1')
  })

  it('moves to the next partner when a new service turn begins', () => {
    const log = [...game(1, 1, 'p1'), ...game(1, 2, 'p2'), ...game(1, 3, 'p1')]
    // game 4 starts: team p2 second turn -> p4
    expect(getNextDoublesServer(log, 'p2', true)).toBe('p4')
    // game 4 started and continues: still p4 after one logged point
    expect(getNextDoublesServer([...log, pt(1, 4, 'p2')], 'p2', false)).toBe('p4')
  })

  it('start-of-turn detection from the score', () => {
    expect(startsNewServeTurn({ points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] })).toBe(true)
    expect(startsNewServeTurn({ points: [1, 0], isTiebreak: false, tiebreakPoints: [0, 0] })).toBe(false)
    expect(startsNewServeTurn({ points: [0, 0], isTiebreak: true, tiebreakPoints: [0, 0] })).toBe(true)  // point 1
    expect(startsNewServeTurn({ points: [0, 0], isTiebreak: true, tiebreakPoints: [1, 0] })).toBe(true)  // point 2
    expect(startsNewServeTurn({ points: [0, 0], isTiebreak: true, tiebreakPoints: [1, 1] })).toBe(false) // point 3
    expect(startsNewServeTurn({ points: [0, 0], isTiebreak: true, tiebreakPoints: [2, 1] })).toBe(true)  // point 4
  })
})
