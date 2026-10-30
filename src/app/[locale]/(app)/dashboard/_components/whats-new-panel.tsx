"use client"

import { Sparkles } from "lucide-react"
import { useLocale, useTranslations } from "@/i18n"

// Newest first
export const UPDATES = [
  { key: 'matchOverview', date: '2026-10-30' },
  { key: 'pdfReport', date: '2026-10-30' },
  { key: 'liveInsights', date: '2026-10-30' },
  { key: 'interruptions', date: '2026-10-29' },
  { key: 'customStats', date: '2026-10-29' },
  { key: 'historySearch', date: '2026-10-29' },
  { key: 'newFormats', date: '2026-10-27' },
  { key: 'fasterApp', date: '2026-10-27' },
  { key: 'themes', date: '2026-10-26' },
  { key: 'offlineSync', date: '2026-10-26' },
] as const

export function WhatsNewPanel() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <section className="surface rise rounded-2xl p-2" style={{ "--i": 7 } as React.CSSProperties}>
      <div className="flex items-center gap-2 px-3 pb-1 pt-2">
        <Sparkles className="h-4 w-4 text-brand" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{t('whatsNew')}</h2>
      </div>
      <ul>
        {UPDATES.slice(0, 4).map(update => (
          <li key={update.key} className="rounded-xl px-3 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-medium text-foreground">{t(`whatsNewUpdates.${update.key}.title`)}</h3>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={update.date}>{formatDate(update.date)}</time>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`whatsNewUpdates.${update.key}.description`)}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
