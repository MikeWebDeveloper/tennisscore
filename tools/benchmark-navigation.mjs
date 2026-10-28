// Repeatable browser timings against the isolated fake Appwrite fixture.
// Start the fake backend and a production build with PLAYWRIGHT=1 first.
// BENCH_REPETITIONS=30 npm run perf:baseline
import { chromium } from '@playwright/test'
import { performance } from 'node:perf_hooks'

const origin = new URL(process.env.BASE_URL || 'http://127.0.0.1:3100')
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(origin.hostname)) {
  throw new Error('This fixture benchmark only runs against a local server')
}

const iterations = Number(process.env.BENCH_REPETITIONS || 30)
if (!Number.isInteger(iterations) || iterations < 1 || iterations > 500) {
  throw new Error('BENCH_REPETITIONS must be an integer from 1 to 500')
}

// These markers require populated fixture data rather than merely a page heading.
const routes = [
  { path: '/en/dashboard', marker: /\d+\/\d+ Matches Won/ },
  { path: '/en/matches', marker: 'Latal Michal' },
  { path: '/en/players', marker: 'Latal Michal' },
  { path: '/en/statistics', marker: /Selected: [1-9]\d* matches/, detailMarker: 'Games per Match' },
]
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
})
const results = Object.fromEntries(routes.map(({ path, detailMarker }) => [path, {
  freshContext: [], warmNavigation: [], ...(detailMarker ? { freshIntensitySummary: [] } : {}),
}]))
const contextOptions = { viewport: { width: 390, height: 844 }, isMobile: true }

async function ready(page, marker) {
  // A first-visit service worker update can reload the document while it is
  // becoming ready. Recheck the marker after that navigation, never count the
  // old document's content as a completed sample.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForLoadState('load')
      await page.getByText(marker).first().waitFor({ state: 'visible', timeout: 20_000 })
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      return
    } catch (error) {
      if (!String(error).includes('Execution context was destroyed') || attempt === 2) throw error
    }
  }
}

async function navigate(page, route) {
  const target = route.path.replace('/en', '')
  const link = page.locator(`nav:visible a[href$="${target}"]`).first()
  await link.click()
  await page.waitForURL(`**${route.path}`)
  await ready(page, route.marker)
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const at = (p) => Math.round(sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] * 10) / 10
  return { samples: sorted.length, p50Ms: at(0.5), p95Ms: at(0.95) }
}

try {
  for (const route of routes) {
    for (let i = 0; i < iterations; i++) {
      const context = await browser.newContext(contextOptions)
      try {
        const page = await context.newPage()
        const started = performance.now()
        await page.goto(new URL(route.path, origin).href, { waitUntil: 'domcontentloaded' })
        await ready(page, route.marker)
        results[route.path].freshContext.push(performance.now() - started)
        if (route.detailMarker) {
          await ready(page, route.detailMarker)
          results[route.path].freshIntensitySummary.push(performance.now() - started)
        }
      } finally {
        await context.close()
      }
    }
  }

  const context = await browser.newContext(contextOptions)
  try {
    const page = await context.newPage()
    await page.goto(new URL(routes[0].path, origin).href, { waitUntil: 'domcontentloaded' })
    await ready(page, routes[0].marker)
    // Visit every route once before measuring repeat navigation.
    for (const route of [...routes.slice(1), routes[0]]) await navigate(page, route)
    for (let i = 0; i < iterations; i++) {
      for (const route of [...routes.slice(1), routes[0]]) {
        const started = performance.now()
        await navigate(page, route)
        results[route.path].warmNavigation.push(performance.now() - started)
      }
    }
  } finally {
    await context.close()
  }
  console.log(JSON.stringify({
    fixture: 'local fake Appwrite; new browser context is not a cold server or CDN',
    device: 'Chromium, 390x844; no CPU or network throttling',
    metric: 'automation start to populated content visible plus two animation frames',
    iterations,
    routes: Object.fromEntries(Object.entries(results).map(([path, timings]) => [path, {
      freshContext: summary(timings.freshContext), warmNavigation: summary(timings.warmNavigation),
      ...(timings.freshIntensitySummary ? { freshIntensitySummary: summary(timings.freshIntensitySummary) } : {}),
    }])),
  }, null, 2))
} finally {
  await browser.close()
}
