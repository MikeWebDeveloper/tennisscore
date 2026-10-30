import { buildMatchInsights, type InsightPoint } from '@/lib/utils/match-insights'
import { analysisPrompt, analysisSystemPrompt, parseAnalysis } from './match-analysis'

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

  it('leaves serve and outcome numbers out when the match was scored at the points level', () => {
    const data = dataOf(analysisPrompt({ locale: 'cs', insights: buildMatchInsights(points, { detailLevel: 'points' }), players, focus: 'p1' }))

    expect(data.focusPlayerStats.pointsWon).toBe(8)
    expect(data.focusPlayerStats).not.toHaveProperty('aces')
    expect(data.focusPlayerStats).not.toHaveProperty('firstServeIn')
  })
})

describe('analysisSystemPrompt', () => {
  it('asks for Czech tennis words and forbids claims the data cannot support', () => {
    const prompt = analysisSystemPrompt('cs')
    expect(prompt).toContain('Czech')
    expect(prompt).toContain('"hra"')
    expect(prompt).toMatch(/no shot types/)
    expect(analysisSystemPrompt('en')).toContain('Write in English')
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
