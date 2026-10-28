import { readFileSync } from 'node:fs'

// The locale route summary can still show SSG variants even when the app layout
// is dynamic. The prerender manifest is the authoritative list of shared output.
const manifest = JSON.parse(readFileSync('.next/prerender-manifest.json', 'utf8'))
const privateRoute = /^\/(?:en|cs)\/(?:admin|dashboard|matches|players|statistics|settings)(?:\/|$)/
const unsafe = Object.keys(manifest.routes).filter(route => privateRoute.test(route))
if (unsafe.length) {
  console.error(`Authenticated routes were prerendered: ${unsafe.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('Authenticated routes are absent from the prerender manifest.')
}
