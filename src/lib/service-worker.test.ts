/**
 * @jest-environment node
 */
/**
 * Regression: after a deploy, a stale cached HTML page talks to new server-action IDs
 * ("Failed to find Server Action"). Navigations must be network-first.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

type Handler = (event: any) => void

function loadServiceWorker(opts: { online: boolean; cached?: Record<string, string>; fetchImpl?: () => Response }) {
  const puts: string[] = []
  const handlers: Record<string, Handler> = {}
  const store = new Map<string, Response>(Object.entries(opts.cached ?? {}).map(([k, v]) => [k, new Response(v)]))
  const cacheObj = {
    match: async (req: any) => store.get(typeof req === 'string' ? req : req.url)?.clone(),
    put: async (req: any, res: Response) => { puts.push(typeof req === 'string' ? req : req.url); store.set(typeof req === 'string' ? req : req.url, res) },
    keys: async () => [],
    delete: async () => true,
  }
  const sandbox: any = {
    console: { log() {}, error() {}, warn() {} },
    URL, Response, Request, Headers, setTimeout, Promise,
    self: {
      location: { hostname: 'test.tenis.click', port: '', origin: 'https://test.tenis.click' },
      addEventListener: (type: string, fn: Handler) => { handlers[type] = fn },
      skipWaiting: async () => {},
      clients: { claim: async () => {}, matchAll: async () => [] },
      registration: { showNotification: async () => {} },
    },
    caches: {
      open: async () => cacheObj,
      match: async (req: any) => cacheObj.match(req),
      keys: async () => [],
      delete: async () => true,
    },
    fetch: async (req: any) => {
      if (!opts.online) throw new TypeError('offline')
      return opts.fetchImpl ? opts.fetchImpl() : new Response('FRESH-HTML', { status: 200 })
    },
  }
  sandbox.self.fetch = sandbox.fetch
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8'), sandbox)
  return Object.assign(handlers, { __puts: puts })
}

async function navigateRaw(handlers: Record<string, Handler>, url: string) {
  let responded: Promise<Response> | undefined
  handlers.fetch({
    request: { url, method: 'GET', mode: 'navigate', headers: new Headers() },
    respondWith: (p: Promise<Response>) => { responded = Promise.resolve(p) },
  })
  return responded ? await responded : null
}

async function navigate(handlers: Record<string, Handler>, url: string) {
  const res = await navigateRaw(handlers, url)
  return res ? res.text() : null
}

describe('service worker navigation strategy', () => {
  const url = 'https://test.tenis.click/en/login'

  it('serves fresh HTML when online, even if an older page is cached', async () => {
    const sw = loadServiceWorker({ online: true, cached: { [url]: 'STALE-HTML' } })
    expect(await navigate(sw, url)).toBe('FRESH-HTML')
  })

  it('falls back to the cached page only when offline', async () => {
    const sw = loadServiceWorker({ online: false, cached: { [url]: 'STALE-HTML' } })
    expect(await navigate(sw, url)).toBe('STALE-HTML')
  })

  it('never returns or caches a redirected response for a navigation (Safari PWA crash)', async () => {
    const redirected = () => {
      const r = new Response('REDIRECTED', { status: 200 })
      Object.defineProperty(r, 'redirected', { value: true })
      Object.defineProperty(r, 'url', { value: 'https://test.tenis.click/en/dashboard' })
      return r
    }
    const sw: any = loadServiceWorker({ online: true, fetchImpl: redirected })
    const res = await navigateRaw(sw, url)
    expect(res?.status).toBe(302)
    expect(res?.headers.get('location')).toBe('https://test.tenis.click/en/dashboard')
    expect(sw.__puts).toEqual([])
  })

  it('caches normal successful navigations for offline use', async () => {
    const sw: any = loadServiceWorker({ online: true })
    await navigate(sw, url)
    expect(sw.__puts).toEqual([url])
  })
})
