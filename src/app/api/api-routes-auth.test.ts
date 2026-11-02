/** @jest-environment node */
import { readdirSync, readFileSync } from 'fs'
import { join, relative } from 'path'

// /api sits outside the middleware, so every route has to check the caller itself
const routes = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return routes(path)
    return entry.name === 'route.ts' ? [path] : []
  })

const writes = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/
const adminKey = /createAdminClient/
const callerCheck = /getCurrentUser|isAdmin|createSessionClient|getSession/

describe('API routes', () => {
  const files = routes(__dirname).map((file) => [relative(__dirname, file), readFileSync(file, 'utf8')])

  it.each(files)('%s checks the caller before writing with the admin key', (_name, source) => {
    if (!writes.test(source) || !adminKey.test(source)) return
    expect(source).toMatch(callerCheck)
  })
})
