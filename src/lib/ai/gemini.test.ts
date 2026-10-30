/**
 * @jest-environment node
 */
import { DEFAULT_GEMINI_MODELS, GeminiError, generateJson } from './gemini'

const answer = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'thinking…', thought: true }, { text }] } }] }), { status: 200 })
const failure = (status: number) => new Response(JSON.stringify({ error: { code: status } }), { status })

const modelOf = (url: string) => url.match(/models\/([^:]+):/)![1]

describe('generateJson', () => {
  const env = process.env
  beforeEach(() => { process.env = { ...env, GEMINI_API_KEY: 'test-key' }; delete process.env.GEMINI_MODELS })
  afterAll(() => { process.env = env })

  const ask = (fetchImpl: typeof fetch) => generateJson({ system: 's', prompt: 'p', schema: {}, fetchImpl })

  it('moves down the model list when a model is busy or out of quota, and says who answered', async () => {
    const calls: string[] = []
    const fetchImpl = jest.fn(async (url: string) => {
      calls.push(modelOf(url))
      if (calls.length === 1) return failure(503)
      if (calls.length === 2) return failure(429)
      return answer('{"summary":"ok"}')
    }) as unknown as typeof fetch

    await expect(ask(fetchImpl)).resolves.toEqual({ text: '{"summary":"ok"}', model: DEFAULT_GEMINI_MODELS[2] })
    expect(calls).toEqual(DEFAULT_GEMINI_MODELS.slice(0, 3))
  })

  it('reports a used-up quota when every model says so', async () => {
    const fetchImpl = jest.fn(async () => failure(429)) as unknown as typeof fetch
    await expect(ask(fetchImpl)).rejects.toMatchObject({ reason: 'quota' })
    expect(fetchImpl).toHaveBeenCalledTimes(DEFAULT_GEMINI_MODELS.length)
  })

  it('sends the key in a header, never in the address', async () => {
    const fetchImpl = jest.fn(async () => answer('{}')) as unknown as jest.Mock
    await ask(fetchImpl as unknown as typeof fetch)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).not.toContain('test-key')
    expect(init.headers['x-goog-api-key']).toBe('test-key')
  })

  it('follows GEMINI_MODELS when it is set', async () => {
    process.env.GEMINI_MODELS = 'model-a, model-b'
    const calls: string[] = []
    const fetchImpl = jest.fn(async (url: string) => { calls.push(modelOf(url)); return calls.length === 1 ? failure(404) : answer('{}') }) as unknown as typeof fetch
    await expect(ask(fetchImpl)).resolves.toMatchObject({ model: 'model-b' })
    expect(calls).toEqual(['model-a', 'model-b'])
  })

  it('refuses to run without an API key', async () => {
    delete process.env.GEMINI_API_KEY
    await expect(ask(jest.fn() as unknown as typeof fetch)).rejects.toEqual(expect.any(GeminiError))
    await expect(ask(jest.fn() as unknown as typeof fetch)).rejects.toMatchObject({ reason: 'not-configured' })
  })
})
