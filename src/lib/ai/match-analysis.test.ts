import { buildMatchInsights, type InsightPoint } from '@/lib/utils/match-insights'
import { analysisPrompt, analysisState, analysisSystemPrompt, parseAnalysis } from './match-analysis'

// p1 holds to love, then breaks p2 to love: 2:0 for p1
const points: InsightPoint[] = [
  ...Array.from({ length: 4 }, () => ({ winner: 'p1' as const, server: 'p1' as const, serveType: 'first', pointOutcome: 'ace', setNumber: 1, gameNumber: 1 })),
  ...Array.from({ length: 4 }, () => ({ winner: 'p1' as const, server: 'p2' as const, serveType: 'second', pointOutcome: 'double_fault', setNumber: 1, gameNumber: 2 })),
]
const players = { p1: { name: 'Anna Nová', yearOfBirth: 2015, club: 'TK Praha' }, p2: { name: 'Eva Malá' } }

const dataOf = (prompt: string) => JSON.parse(prompt.slice(prompt.indexOf('{')))

describe('analysisPrompt', () => {
  it('tells the match from the focus player\'s side, scores focus first', () => {
    const data = dataOf(analysisPrompt({ locale: 'cs', insights: buildMatchInsights(points), players, focus: 'p2' }))

    expect(data.focusPlayer.name).toBe('Eva Malá')
    expect(data.opponent).toEqual(players.p1)
    expect(data.games.map((g: { scoreAfter: string }) => g.scoreAfter)).toEqual(['0:1', '0:2'])
    expect(data.games[1].points).toBe('OOOO')
    expect(data.focusPlayerStats.doubleFaults).toBe(4)
  })

  it('reports the stored result when the match ended early, not who was ahead', () => {
    const data = dataOf(analysisPrompt({ locale: 'cs', insights: buildMatchInsights(points), players, focus: 'p2', winner: 'p2', endReason: 'retired' }))
    expect(data.match.result).toBe('won (the match ended early)')
  })

  it('leaves serve and outcome numbers out when the match was scored at the points level', () => {
    const data = dataOf(analysisPrompt({ locale: 'cs', insights: buildMatchInsights(points, { detailLevel: 'points' }), players, focus: 'p1' }))

    expect(data.focusPlayerStats.pointsWon).toBe(8)
    expect(data.focusPlayerStats).not.toHaveProperty('aces')
    expect(data.focusPlayerStats).not.toHaveProperty('firstServeIn')
  })
})

describe('analysisSystemPrompt', () => {
  it('asks for Czech tennis words, all recorded data and nothing that was not recorded', () => {
    const prompt = analysisSystemPrompt('cs')
    expect(prompt).toContain('Czech')
    expect(prompt).toContain('"hra"')
    expect(prompt).toContain('forhend, bekhend')
    expect(prompt).toMatch(/notRecorded/)
    expect(prompt).toMatch(/shotStats/)
    expect(analysisSystemPrompt('en')).toContain('Write in English')
  })
})

describe('analysisPrompt with shot data', () => {
  // Game 1: p1 serves; forehand winner, backhand return error by p2, p1 forehand unforced error,
  // then two more p1 points: p1 holds. Game 2: p2 serves at 0:40 and loses on a p2 backhand error.
  const shotPoints = [
    { winner: 'p1', server: 'p1', serveType: 'first', pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p1', setNumber: 1, gameNumber: 1 },
    { winner: 'p1', server: 'p1', serveType: 'second', pointOutcome: 'unforced_error', lastShotType: 'backhand', lastShotPlayer: 'p2', winnerType: 'return', setNumber: 1, gameNumber: 1 },
    { winner: 'p2', server: 'p1', serveType: 'first', pointOutcome: 'unforced_error', lastShotType: 'forehand', lastShotPlayer: 'p1', setNumber: 1, gameNumber: 1 },
    { winner: 'p1', server: 'p1', serveType: 'first', pointOutcome: 'ace', lastShotType: 'serve', servePlacement: 't', setNumber: 1, gameNumber: 1 },
    { winner: 'p1', server: 'p1', serveType: 'first', pointOutcome: 'winner', lastShotType: 'volley', lastShotPlayer: 'p1', setNumber: 1, gameNumber: 1 },
    ...[0, 1, 2].map(() => ({ winner: 'p1', server: 'p2', serveType: 'first', pointOutcome: 'winner', lastShotType: 'forehand', lastShotPlayer: 'p1', setNumber: 1, gameNumber: 2 })),
    { winner: 'p1', server: 'p2', serveType: 'second', pointOutcome: 'unforced_error', lastShotType: 'backhand', lastShotPlayer: 'p2', setNumber: 1, gameNumber: 2 },
  ] as const
  const input = (detailLevel: string) => ({
    locale: 'cs', insights: buildMatchInsights(shotPoints as never, { detailLevel }), players, focus: 'p1' as const,
    points: shotPoints as never, detailLevel,
  })

  it('passes the shot statistics, returns and ace placement when the match recorded them', () => {
    const data = dataOf(analysisPrompt(input('shot-type')))
    expect(data.recorded.join(' ')).toMatch(/forehand, backhand/)
    expect(data.notRecorded.join(' ')).toMatch(/rally length/)
    expect(data.shotStats.focusPlayer.pointEndingShots).toEqual({
      forehand: { winners: 4, unforcedErrors: 1, forcedErrors: 0 },
      volley: { winners: 1, unforcedErrors: 0, forcedErrors: 0 },
    })
    expect(data.shotStats.opponent.pointEndingShots).toEqual({ backhand: { winners: 0, unforcedErrors: 2, forcedErrors: 0 } })
    expect(data.shotStats.opponent.returnsThatEndedThePoint).toEqual({ winners: 0, unforcedErrors: 1, forcedErrors: 0 })
    expect(data.shotStats.focusPlayer.acesByPlacement).toEqual({ t: 1 })
    expect(data.points[1]).toMatchObject({ server: 'F', w: 'F', serve: 2, end: 'unforced error', shot: 'backhand', by: 'O', return: true })
  })

  it('lists every break point with how it ended and the shot', () => {
    const data = dataOf(analysisPrompt(input('shot-type')))
    expect(data.breakPoints).toEqual([
      { set: 1, game: 2, server: 'Eva Malá', score: '40:0', won: true, how: 'unforced error (backhand) by Eva Malá' },
    ])
  })

  it('says shots were not recorded at the simple level, and passes no shot statistics', () => {
    const data = dataOf(analysisPrompt(input('simple')))
    expect(data.shotStats).toBeUndefined()
    expect(data.notRecorded.join(' ')).toMatch(/forehand, backhand/)
    expect(data.points[0]).not.toHaveProperty('shot')
  })
})

describe('parseAnalysis', () => {
  it('reads the model\'s JSON, also inside a code fence, and trims empty items', () => {
    const parsed = parseAnalysis('```json\n{"summary":" Dobrý zápas. ","strengths":["Podání", " "],"improvements":[],"trainingTips":["Servis 3 × 10"]}\n```')
    expect(parsed).toEqual({ summary: 'Dobrý zápas.', strengths: ['Podání'], improvements: [], trainingTips: ['Servis 3 × 10'] })
  })

  it('rejects answers without a summary or that are not JSON', () => {
    expect(parseAnalysis('{"strengths":["x"]}')).toBeNull()
    expect(parseAnalysis('Sorry, I cannot help')).toBeNull()
  })
})

describe('analysisState', () => {
  const ready = (summary: string, at: string) => ({ content: JSON.stringify({ summary }), model: 'm', status: 'ready', $createdAt: at })
  const now = Date.parse('2026-10-30T12:10:00Z')

  it('is idle with nothing saved, and shows the newest finished analysis', () => {
    expect(analysisState([], now)).toEqual({ saved: null, job: { status: 'idle' } })
    expect(analysisState([ready('Nový', '2026-10-30T12:00:00Z'), ready('Starý', '2026-10-29T12:00:00Z')], now).saved?.analysis.summary).toBe('Nový')
  })

  it('keeps the last analysis on show while a new one is written', () => {
    const state = analysisState([{ content: '{}', model: '', status: 'pending', $createdAt: '2026-10-30T12:08:00Z' }, ready('Starý', '2026-10-29T12:00:00Z')], now)
    expect(state).toMatchObject({ saved: { analysis: { summary: 'Starý' } }, job: { status: 'pending', startedAt: '2026-10-30T12:08:00Z' } })
  })

  it('gives up on an analysis that has been "pending" for over five minutes', () => {
    expect(analysisState([{ content: '{}', model: '', status: 'pending', $createdAt: '2026-10-30T12:00:00Z' }], now).job).toEqual({ status: 'failed', reason: 'timeout' })
  })

  it('treats documents saved before the status field as finished', () => {
    expect(analysisState([{ content: '{"summary":"Bez stavu"}', model: 'm', $createdAt: '2026-10-30T12:00:00Z' }], now).saved?.analysis.summary).toBe('Bez stavu')
  })
})
