/**
 * @jest-environment node
 */
const getCurrentUser = jest.fn()
const generateJson = jest.fn()
const getMatch = jest.fn()
const createDocument = jest.fn()
const listDocuments = jest.fn()

jest.mock('@/lib/auth', () => ({
  getCurrentUser: () => getCurrentUser(),
  isAdmin: (email?: string | null) => email === 'admin@example.com',
}))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'd' } }))
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { createDocument, listDocuments } }) }))
jest.mock('@/lib/actions/matches', () => ({ getMatch: (id: string) => getMatch(id) }))
jest.mock('@/lib/actions/players', () => ({ getPlayersByIds: async () => ({}) }))
jest.mock('@/lib/ai/gemini', () => ({
  ...jest.requireActual('@/lib/ai/gemini'),
  generateJson: (...args: unknown[]) => generateJson(...args),
}))

import { GET, POST } from './route'

const post = (body: unknown) => POST(new Request('http://localhost/api/match-analysis', { method: 'POST', body: JSON.stringify(body) }))
const pointLog = Array.from({ length: 8 }, (_, i) => JSON.stringify({ winner: 'p1', server: i < 4 ? 'p1' : 'p2', serveType: 'first', pointOutcome: 'winner', setNumber: 1, gameNumber: i < 4 ? 1 : 2 }))

describe('/api/match-analysis', () => {
  beforeEach(() => jest.clearAllMocks())

  it('refuses everyone but the admins, before touching the match or Gemini', async () => {
    getCurrentUser.mockResolvedValue({ $id: 'u1', email: 'someone@example.com' })
    expect((await post({ matchId: 'm1' })).status).toBe(403)
    expect((await GET(new Request('http://localhost/api/match-analysis?matchId=m1'))).status).toBe(403)
    getCurrentUser.mockResolvedValue(null)
    expect((await post({ matchId: 'm1' })).status).toBe(403)
    expect(getMatch).not.toHaveBeenCalled()
    expect(generateJson).not.toHaveBeenCalled()
  })

  it('writes, saves and returns an analysis for an admin', async () => {
    getCurrentUser.mockResolvedValue({ $id: 'admin', email: 'admin@example.com' })
    getMatch.mockResolvedValue({ $id: 'm1', playerOneId: 'anonymous-1', playerTwoId: 'anonymous-2', pointLog, matchFormat: '{"sets":3}', detailLevel: 'simple', matchDate: '2026-10-25T08:00:00Z' })
    generateJson.mockResolvedValue({ text: '{"summary":"Dobrý zápas.","strengths":["Podání"],"improvements":[],"trainingTips":[]}', model: 'gemini-test' })
    createDocument.mockResolvedValue({ $createdAt: '2026-10-30T12:00:00Z' })

    const response = await post({ matchId: 'm1', locale: 'cs' })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ saved: { analysis: { summary: 'Dobrý zápas.', strengths: ['Podání'], improvements: [], trainingTips: [] }, model: 'gemini-test', createdAt: '2026-10-30T12:00:00Z' } })
    expect(createDocument).toHaveBeenCalledWith('d', 'match_analyses', expect.any(String), expect.objectContaining({ matchId: 'm1', userId: 'admin', locale: 'cs', model: 'gemini-test' }))
  })

  it('says when the daily Gemini quota is used up', async () => {
    const { GeminiError } = jest.requireActual('@/lib/ai/gemini')
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    getCurrentUser.mockResolvedValue({ $id: 'admin', email: 'admin@example.com' })
    getMatch.mockResolvedValue({ $id: 'm1', playerOneId: 'anonymous-1', playerTwoId: 'anonymous-2', pointLog, matchFormat: '{}', matchDate: '2026-10-25' })
    generateJson.mockRejectedValue(new GeminiError('quota', 'all 429'))
    expect((await post({ matchId: 'm1' })).status).toBe(429)
    expect(createDocument).not.toHaveBeenCalled()
  })
})
