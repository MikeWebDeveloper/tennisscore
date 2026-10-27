/**
 * @jest-environment node
 */
import fs from 'node:fs'
import path from 'node:path'

const version = (pkg: string): string =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), 'node_modules', pkg, 'package.json'), 'utf8')).version

const major = (v: string) => parseInt(v.split('.')[0], 10)

describe('dependency guards', () => {
  // node-appwrite 14.x sends requests with the `form-data` package. Under Next 15 in a production
  // build, the patched fetch calls `.forEach` on that body and throws ("n.forEach is not a function")
  // when a server action revalidates, so saving a point silently fails. Keep the SDK current.
  it('node-appwrite is 17+ (14.x breaks server actions in production builds)', () => {
    expect(major(version('node-appwrite'))).toBeGreaterThanOrEqual(17)
  })

  it('the browser SDK is on the version the realtime hook was written for (18+)', () => {
    expect(major(version('appwrite'))).toBeGreaterThanOrEqual(18)
  })

  it('declared ranges match, so a fresh install cannot resolve an older major', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'))
    const floor = (spec: string) => major(spec.replace(/^[^\d]*/, ''))
    expect(floor(pkg.dependencies['node-appwrite'])).toBeGreaterThanOrEqual(17)
    expect(floor(pkg.dependencies['appwrite'])).toBeGreaterThanOrEqual(18)
  })
})
