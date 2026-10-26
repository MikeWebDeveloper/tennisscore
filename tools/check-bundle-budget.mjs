#!/usr/bin/env node
/**
 * Fails when a route's "First Load JS" (from `next build` output) exceeds its budget.
 * Usage: node tools/check-bundle-budget.mjs <build-log-file>
 */
import { readFileSync } from 'node:fs'

const SHARED_BUDGET_KB = 130
const DEFAULT_ROUTE_BUDGET_KB = 320
// Heavier screens get an explicit, still-tight budget
const ROUTE_BUDGETS_KB = {
  '/[locale]/matches/live/[id]': 340,
  '/[locale]/statistics': 340,
  // Public spectator page: dominated by the React/Next runtime; keep it from growing
  '/[locale]/live/[matchId]': 260,
}

const toKb = (n, unit) => (unit === 'MB' ? n * 1024 : unit === 'B' ? n / 1024 : n)

const file = process.argv[2]
if (!file) {
  console.error('usage: check-bundle-budget.mjs <build-log-file>')
  process.exit(2)
}

const lines = readFileSync(file, 'utf8').split('\n')
const failures = []
let routes = 0

for (const line of lines) {
  // "├ ƒ /[locale]/matches/live/[id]   26.7 kB   266 kB"
  const route = line.match(/^[├└┌]\s+\S+\s+(\/\S*)\s+([\d.]+)\s*(B|kB|MB)\s+([\d.]+)\s*(B|kB|MB)\s*$/)
  if (route) {
    routes++
    const path = route[1]
    const firstLoad = toKb(parseFloat(route[4]), route[5])
    const budget = ROUTE_BUDGETS_KB[path] ?? DEFAULT_ROUTE_BUDGET_KB
    if (firstLoad > budget) failures.push(`${path}: ${firstLoad.toFixed(0)} kB > ${budget} kB`)
    continue
  }
  const shared = line.match(/First Load JS shared by all\s+([\d.]+)\s*(B|kB|MB)/)
  if (shared) {
    const kb = toKb(parseFloat(shared[1]), shared[2])
    if (kb > SHARED_BUDGET_KB) failures.push(`shared by all: ${kb.toFixed(0)} kB > ${SHARED_BUDGET_KB} kB`)
  }
}

if (routes === 0) {
  console.error('No routes found in build output; is this a `next build` log?')
  process.exit(2)
}
if (failures.length) {
  console.error('Bundle budget exceeded:\n  ' + failures.join('\n  '))
  process.exit(1)
}
console.log(`Bundle budget OK (${routes} routes checked)`)
