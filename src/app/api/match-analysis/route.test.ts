/**
 * @jest-environment node
 */
const getCurrentUser = jest.fn()
const generateJson = jest.fn()
const getMatch = jest.fn()
const createDocument = jest.fn()
const updateDocument = jest.fn()
const listDocuments = jest.fn()
// Work scheduled with after() runs right away here; the test awaits it
let afterWork: Promise<unknown> = Promise.resolve()

jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: (fn: () => Promise<unknown>) => { afterWork = fn() },
}))
jest.mock('@/lib/auth', () => ({
  getCurrentUser: () => getCurrentUser(),
  isAdmin: (email?: string | null) => email === 'admin@example.com',
}))
jest.mock('@/lib/env', () => ({ env: { APPWRITE_DATABASE_ID: 'd' } }))
jest.mock('@/lib/appwrite-server', () => ({ createAdminClient: async () => ({ databases: { createDocument, updateDocument, listDocuments } }) }))
jest.mock('@/lib/actions/matches', () => ({ getMatch: (id: string) => getMatch(id) }))
jest.mock('@/lib/actions/players', () => ({ getPlayersByIds: async () => ({}) }))
jest.mock('@/lib/ai/gemini', () => ({
  ...jest.requireActual('@/lib/ai/gemini'),
  generateJson: (...args: unknown[]) => generateJson(...args),
}))

import { GET, POST } from './route'

const post = (body: unknown) => POST(new Request('http://localhost/api/match-analysis', { method: 'POST', body: JSON.stringify(body) }))
const pointLog = Array.from({ length: 8 }, (_, i) => JSON.stringify({ winner: 'p1', server: i < 4 ? 'p1' : 'p2', serveType: 'first', pointOutcome: 'winner', setNumber: 1, gameNumber: i < 4 ? 1 : 2 }))
const match = { $id: 'm1', playerOneId: 'anonymous-1', playerTwoId: 'anonymous-2', pointLog, matchFormat: '{"sets":3}', detailLevel: 'simple', matchDate: '2026-10-25T08:00:00Z' }
const asAdmin = () => getCurrentUser.mockResolvedValue({ $id: 'admin', email: 'admin@example.com' })

describe('/api/match-analysis', () => {
  const env = process.env
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...env, GEMINI_API_KEY: 'test-key' }
    listDocuments.mockResolvedValue({ documents: [] })
    createDocument.mockResolvedValue({ $id: 'job1', $createdAt: '2026-10-30T12:00:00Z' })
    updateDocument.mockResolvedValue({})
  })
  afterAll(() => { process.env = env })

  it('refuses everyone but the admins, before touching the match or Gemini', async () => {
    getCurrentUser.mockResolvedValue({ $id: 'u1', email: 'someone@example.com' })
    expect((await post({ matchId: 'm1' })).status).toBe(403)
    expect((await GET(new Request('http://localhost/api/match-analysis?matchId=m1'))).status).toBe(403)
    getCurrentUser.mockResolvedValue(null)
    expect((await post({ matchId: 'm1' })).status).toBe(403)
    expect(getMatch).not.toHaveBeenCalled()
    expect(generateJson).not.toHaveBeenCalled()
  })

  it('says so at once when no Gemini key is set', async () => {
    asAdmin()
    delete process.env.GEMINI_API_KEY
    expect((await post({ matchId: 'm1' })).status).toBe(503)
    expect(createDocument).not.toHaveBeenCalled()
  })

  it('answers "pending" at once, then writes and saves the analysis in the background', async () => {
    asAdmin()
    getMatch.mockResolvedValue(match)
    generateJson.mockResolvedValue({ text: '{"summary":"Dobrý zápas.","strengths":["Podání"],"improvements":[],"trainingTips":[]}', model: 'gemini-test' })

    const response = await post({ matchId: 'm1', locale: 'cs' })
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toEqual({ saved: null, job: { status: 'pending', startedAt: '2026-10-30T12:00:00Z' } })
    expect(createDocument).toHaveBeenCalledWith('d', 'match_analyses', expect.any(String), expect.objectContaining({ matchId: 'm1', userId: 'admin', locale: 'cs', status: 'pending' }))

    await afterWork
    expect(updateDocument).toHaveBeenCalledWith('d', 'match_analyses', 'job1', expect.objectContaining({ status: 'ready', model: 'gemini-test', content: expect.stringContaining('Dobrý zápas.') }))
  })

  it('does not start a second analysis while one is being written', async () => {
    asAdmin()
    getMatch.mockResolvedValue(match)
    listDocuments.mockResolvedValue({ documents: [{ content: '{}', model: '', status: 'pending', $createdAt: new Date().toISOString() }] })
    const response = await post({ matchId: 'm1' })
    expect(response.status).toBe(202)
    await expect(response.json()).resolves.toMatchObject({ job: { status: 'pending' } })
    expect(createDocument).not.toHaveBeenCalled()
  })

  it('records why it failed when every model is out of quota', async () => {
    const { GeminiError } = jest.requireActual('@/lib/ai/gemini')
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    asAdmin()
    getMatch.mockResolvedValue(match)
    generateJson.mockRejectedValue(new GeminiError('quota', 'all 429'))
    expect((await post({ matchId: 'm1' })).status).toBe(202)
    await afterWork
    expect(updateDocument).toHaveBeenCalledWith('d', 'match_analyses', 'job1', { status: 'failed', error: 'quota' })
  })

  it('reports the saved analysis and the state of the newest attempt', async () => {
    asAdmin()
    listDocuments.mockResolvedValue({ documents: [
      { content: '{}', model: '', status: 'failed', error: 'quota', $createdAt: '2026-10-30T12:05:00Z' },
      { content: '{"summary":"Starší rozbor."}', model: 'gemini-a', status: 'ready', $createdAt: '2026-10-30T12:00:00Z' },
    ] })
    const response = await GET(new Request('http://localhost/api/match-analysis?matchId=m1'))
    await expect(response.json()).resolves.toMatchObject({
      saved: { analysis: { summary: 'Starší rozbor.' }, model: 'gemini-a' },
      job: { status: 'failed', reason: 'quota' },
    })
  })
})
