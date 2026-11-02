import { matchesInTournament, summarizeTournaments, tournamentKey } from './tournaments'

const match = (id: string, tournamentName: string | undefined, matchDate: string, winnerId?: string, extra: object = {}) =>
  ({ $id: id, tournamentName, matchDate, status: winnerId ? 'Completed' : 'In Progress', winnerId, playerOneId: 'me', playerTwoId: `op-${id}`, ...extra })

const matches = [
  match('a', 'Zimní liga', '2026-01-10T10:00:00Z', 'me'),
  match('b', ' zimní liga ', '2026-01-24T10:00:00Z', 'op-b'),
  match('c', 'Zimní liga', '2026-02-07T10:00:00Z', 'me'),
  match('d', 'MČR U12', '2026-03-14T09:00:00Z', 'me'),
  match('e', 'MČR U12', '2026-03-15T09:00:00Z'),
  // Stopped without a winner: played, but neither a win nor a loss
  match('f', 'MČR U12', '2026-03-15T15:00:00Z', undefined, { status: 'Completed', retirementReason: 'unfinished' }),
  match('g', undefined, '2026-04-01T09:00:00Z', 'me'),
  match('h', '   ', '2026-04-02T09:00:00Z', 'me'),
]

it('groups matches by tournament name, ignoring case and spaces, newest tournament first', () => {
  const summaries = summarizeTournaments(matches, 'me')
  expect(summaries.map(s => s.name)).toEqual(['MČR U12', 'Zimní liga'])
  expect(summaries[1]).toMatchObject({ key: 'zimní liga', matches: 3, wins: 2, losses: 1, from: '2026-01-10T10:00:00Z', to: '2026-02-07T10:00:00Z' })
})

it('counts only decided matches as wins and losses', () => {
  expect(summarizeTournaments(matches, 'me')[0]).toMatchObject({ matches: 3, wins: 1, losses: 0 })
})

it('leaves matches without a tournament out', () => {
  expect(summarizeTournaments(matches, 'me').reduce((sum, s) => sum + s.matches, 0)).toBe(6)
})

it('filters the matches of one tournament', () => {
  expect(matchesInTournament(matches, tournamentKey('ZIMNÍ LIGA')).map(m => m.$id)).toEqual(['a', 'b', 'c'])
})
