type Point = {
  server: 'p1' | 'p2'
  servePlacement?: string
  customFields?: { serveSpeed?: string; returnQuality?: string; rallyLength?: number }
}
type Category = 'serve-placement' | 'serve-speed' | 'return-quality'
export function summarizeCustomPointStats(points: readonly Point[]) {
  const counts = new Map<string, { category: Category; value: string; counts: [number, number] }>()
  const rallyLengths: number[] = []
  for (const point of points) {
    if (point.server !== 'p1' && point.server !== 'p2') continue
    const server = point.server === 'p1' ? 0 : 1
    const add = (category: Category, value: string | undefined, allowed: string[], side: number) => {
      if (!value || !allowed.includes(value)) return
      const key = `${category}:${value}`
      const row = counts.get(key) ?? { category, value, counts: [0, 0] as [number, number] }
      row.counts[side]++
      counts.set(key, row)
    }
    add('serve-placement', point.servePlacement, ['wide', 'body', 't'], server)
    add('serve-speed', point.customFields?.serveSpeed, ['slow', 'medium', 'fast'], server)
    add('return-quality', point.customFields?.returnQuality, ['defensive', 'neutral', 'offensive'], 1 - server)
    const length = point.customFields?.rallyLength
    if (typeof length === 'number' && Number.isFinite(length) && length > 0) rallyLengths.push(length)
  }
  return {
    rows: [...counts.values()],
    rally: rallyLengths.length ? { average: Math.round(rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length * 10) / 10, samples: rallyLengths.length } : null,
  }
}
