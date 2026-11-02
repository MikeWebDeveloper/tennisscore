import { presetFromMatch, recentPlayerIds } from './match-preset'

const fmt = (extra: object) => JSON.stringify({ sets: 3, noAd: false, finalSetTiebreak: 'standard', gamesPerSet: 6, tiebreakAt: 6, ...extra })

describe('presetFromMatch: a rematch starts with the same players and rules', () => {
  it('copies a singles match: players, tournament, format and detail level', () => {
    const preset = presetFromMatch({ playerOneId: 'me', playerTwoId: 'eva', tournamentName: 'Zimní liga', matchFormat: fmt({ noAd: true, finalSetTiebreak: 'super' }), detailLevel: 'simple' })
    expect(preset).toMatchObject({
      matchType: 'singles',
      players: { one: 'me', two: 'eva', three: '', four: '' },
      anonymous: { one: false, two: false, three: false, four: false },
      tournamentName: 'Zimní liga', sets: 3, setFormat: 'standard', scoring: 'no-ad', finalSet: 'super-tb', detailLevel: 'simple',
    })
  })

  it('copies doubles with the serve order, Fast4 sets and custom statistics', () => {
    const preset = presetFromMatch({
      playerOneId: 'a', playerTwoId: 'b', playerThreeId: 'c', playerFourId: 'anonymous-player-4',
      matchFormat: fmt({ sets: 1, gamesPerSet: 4, tiebreakAt: 3, doublesServeOrder: { p1: 'p3', p2: 'p2' }, detailLevel: 'custom', customModeConfig: { categories: ['serve-speed'] } }),
    })
    expect(preset).toMatchObject({
      matchType: 'doubles', sets: 1, setFormat: 'fast4', scoring: 'ad', finalSet: 'full',
      players: { one: 'a', two: 'b', three: 'c', four: '' }, anonymous: { four: true },
      serveOrder: { p1: 'p3', p2: 'p2' }, detailLevel: 'custom', customCategories: ['serve-speed'],
    })
  })

  it('falls back to standard sets and simple statistics for old or unreadable formats', () => {
    expect(presetFromMatch({ playerOneId: 'a', playerTwoId: 'b', matchFormat: 'not json' })).toMatchObject({ sets: 3, setFormat: 'standard', scoring: 'ad', finalSet: 'full', detailLevel: 'simple' })
  })
})

it('lists the players of the latest matches first, each once, leaving out the main player and anonymous players', () => {
  const matches = [
    { playerOneId: 'me', playerTwoId: 'eva' },
    { playerOneId: 'jan', playerTwoId: 'me', playerThreeId: 'ota', playerFourId: 'partner' },
    { playerOneId: 'me', playerTwoId: 'eva' },
    { playerOneId: 'me', playerTwoId: 'anonymous-player-2' },
    { playerOneId: 'me', playerTwoId: 'ivo' },
  ]
  expect(recentPlayerIds(matches, 'me', 3)).toEqual(['eva', 'jan', 'ota'])
})
