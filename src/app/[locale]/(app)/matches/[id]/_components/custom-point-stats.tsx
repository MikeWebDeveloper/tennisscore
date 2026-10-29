"use client"

import { useTranslations } from '@/i18n'
import type { PointDetail } from '@/lib/types'
import { summarizeCustomPointStats } from '@/lib/utils/custom-point-stats'

export function CustomPointStats({ points, players }: { points: PointDetail[]; players: [string, string] }) {
  const t = useTranslations('common')
  const { rows, rally } = summarizeCustomPointStats(points)
  if (!rows.length && !rally) return null
  return <section className="rounded-xl border bg-card p-4">
    <h3 className="mb-3 font-semibold">{t('recordedCustomStats')}</h3>
    {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr><th scope="col" className="text-left">{t('customStatistic')}</th>{players.map((player, i) => <th key={i} scope="col" className="text-right">{player}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={`${row.category}-${row.value}`} className="border-t"><th scope="row" className="py-2 text-left font-normal">{t(`customCategory_${row.category}`)} — {t(`customValue_${row.value}`)}</th><td className="text-right tabular-nums">{row.counts[0]}</td><td className="text-right tabular-nums">{row.counts[1]}</td></tr>)}</tbody>
    </table></div>}
    {rally && <p className="mt-3 text-sm text-muted-foreground">{t('recordedRallyAverage', { average: rally.average, samples: rally.samples })}</p>}
  </section>
}
