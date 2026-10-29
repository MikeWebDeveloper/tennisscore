import { summarizeCustomPointStats } from './custom-point-stats'

it('counts recorded serves and returns for the correct player without inventing missing samples', () => {
  const result = summarizeCustomPointStats([
    { server: 'p1', servePlacement: 'wide', customFields: { serveSpeed: 'fast', returnQuality: 'neutral', rallyLength: 5 } },
    { server: 'p2', servePlacement: 'wide', customFields: { serveSpeed: 'fast' } },
    { server: 'p1' },
  ])
  expect(result.rows).toEqual(expect.arrayContaining([
    { category: 'serve-placement', value: 'wide', counts: [1, 1] },
    { category: 'serve-speed', value: 'fast', counts: [1, 1] },
    { category: 'return-quality', value: 'neutral', counts: [0, 1] },
  ]))
  expect(result.rally).toEqual({ average: 5, samples: 1 })
  expect(result.rows.some(row => row.value === 'slow')).toBe(false)
})
