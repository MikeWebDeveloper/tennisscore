import { parseDbScore } from './db-score'

const empty = { sets: [], games: [0, 0], points: [0, 0], isTiebreak: false, tiebreakPoints: [0, 0] }

describe('parseDbScore', () => {
  it('parses the modern array format', () => {
    const s = parseDbScore(JSON.stringify({ sets: [[6, 4], [3, 6]], games: [2, 1], points: [1, 3], isTiebreak: false, tiebreakPoints: [0, 0] }))
    expect(s).toEqual({ sets: [[6, 4], [3, 6]], games: [2, 1], points: [1, 3], isTiebreak: false, tiebreakPoints: [0, 0] })
  })

  it('parses the legacy {player1, player2} object format with string points', () => {
    const s = parseDbScore(JSON.stringify({
      sets: [{ player1: 6, player2: 4 }],
      games: [{ player1: 0, player2: 0 }, { player1: 3, player2: 2 }],
      points: { player1: '2', player2: '3' },
      isTiebreak: false,
    }))
    expect(s.sets).toEqual([[6, 4]])
    expect(s.games).toEqual([3, 2])
    expect(s.points).toEqual([2, 3])
  })

  it('parses tiebreak state in both formats', () => {
    expect(parseDbScore(JSON.stringify({ games: [6, 6], isTiebreak: true, tiebreakPoints: [4, 5] }))).toMatchObject({ isTiebreak: true, tiebreakPoints: [4, 5] })
    expect(parseDbScore(JSON.stringify({ isTiebreak: true, tiebreakPoints: { player1: 2, player2: 1 } })).tiebreakPoints).toEqual([2, 1])
  })

  it('never throws: bad or missing input gives an empty score', () => {
    for (const raw of [undefined, '', 'not json', 'null', '42']) expect(parseDbScore(raw as any)).toEqual(empty)
  })
})
