import { exportRows, toCsv } from './match-export'

const names = { me: 'Látalová Sofie', eva: 'Nová Eva', anna: 'Malá Anna', bara: 'Velká Bára' }
const matches = [
  { $id: 'm1', matchDate: '2026-10-04T10:00:00.000Z', tournamentName: 'Zimní liga; sever', status: 'Completed', winnerId: 'me', playerOneId: 'me', playerTwoId: 'eva',
    score: JSON.stringify({ sets: [[6, 4], [3, 6]], games: [2, 1], points: [0, 0] }), retirementReason: 'retired', detailLevel: 'simple', pointLog: ['{}', '{}'] },
  { $id: 'm2', matchDate: '2026-10-05T10:00:00.000Z', status: 'In Progress', playerOneId: 'me', playerTwoId: 'eva', playerThreeId: 'anna', playerFourId: 'bara',
    score: JSON.stringify({ sets: [], games: [1, 0], points: [2, 1] }), pointLog: [] },
]

it('turns matches into one readable row each: teams, whole score, result and why it ended', () => {
  const rows = exportRows(matches as never, names)
  expect(rows[0]).toMatchObject({ id: 'm1', date: '2026-10-04', tournament: 'Zimní liga; sever', type: 'singles', teamOne: 'Látalová Sofie', teamTwo: 'Nová Eva', score: '6:4 3:6 2:1', status: 'completed', winner: 'Látalová Sofie', endReason: 'retired', detailLevel: 'simple', points: 2 })
  expect(rows[1]).toMatchObject({ type: 'doubles', teamOne: 'Látalová Sofie / Malá Anna', teamTwo: 'Nová Eva / Velká Bára', score: '1:0', status: 'in-progress', winner: '' })
})

it('writes CSV that Czech Excel opens with diacritics, quoting what would break a column', () => {
  const csv = toCsv([{ a: 'Zimní liga; sever', b: 'řekl "ahoj"', c: 3 }], [['a', 'Turnaj'], ['b', 'Pozn.'], ['c', 'Body']], ';')
  expect(csv.startsWith('﻿')).toBe(true)
  expect(csv).toBe('﻿Turnaj;Pozn.;Body\r\n"Zimní liga; sever";"řekl ""ahoj""";3\r\n')
})
