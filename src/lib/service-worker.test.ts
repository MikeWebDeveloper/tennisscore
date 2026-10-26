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

function loadServiceWorker(opts: { online: boolean; cached?: Record<string, string> }) {
  const handlers: Record<string, Handler> = {}
  const store = new Map<string, Response>(Object.entries(opts.cached ?? {}).map(([k, v]) => [k, new Response(v)]))
  const cacheObj = {
    match: async (req: any) => store.get(typeof req === 'string' ? req : req.url)?.clone(),
    put: async (req: any, res: Response) => { store.set(typeof req === 'string' ? req : req.url, res) },
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
      return new Response('FRESH-HTML', { status: 200 })
    },
  }
  sandbox.self.fetch = sandbox.fetch
  vm.createContext(sandbox)
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8'), sandbox)
  return handlers
}

async function navigate(handlers: Record<string, Handler>, url: string) {
  let responded: Promise<Response> | undefined
  handlers.fetch({
    request: { url, method: 'GET', mode: 'navigate', headers: new Headers() },
    respondWith: (p: Promise<Response>) => { responded = Promise.resolve(p) },
  })
  return responded ? (await responded).text() : null
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
})
