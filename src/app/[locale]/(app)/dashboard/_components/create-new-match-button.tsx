"use client"

import Link from "next/link"
import { Play, ArrowRight } from "lucide-react"
import { useTranslations } from "@/i18n"

export function CreateNewMatchButton() {
  const t = useTranslations('dashboard')

  return (
    <Link
      href="/matches/new"
      className="surface surface-hover press rise group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4"
      style={{ "--i": 1 } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/20 blur-2xl" aria-hidden="true" />
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg shadow-brand/30">
        <Play className="h-5 w-5 fill-current" aria-hidden="true" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-base font-semibold tracking-tight text-foreground">{t('startNewMatch')}</span>
        <span className="block truncate text-sm text-muted-foreground">{t('beginScoringLiveMatch')}</span>
      </span>
      <ArrowRight className="relative h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}
