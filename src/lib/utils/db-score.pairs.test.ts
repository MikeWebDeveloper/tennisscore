import { parseDbScore } from './db-score'

it('retains legacy named p1/p2 set scores when normalizing statistics', () => {
  expect(parseDbScore(JSON.stringify({ sets: [{ p1: 0, p2: 6 }, { p1: 7, p2: 6 }] })).sets)
    .toEqual([[0, 6], [7, 6]])
})
