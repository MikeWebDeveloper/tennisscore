"use client"

import { useTranslations } from "@/i18n"
import type { Player, User } from "@/lib/types"
import { CreateNewMatchButton } from "./_components/create-new-match-button"

export default function DashboardPending({ mainPlayer, user }: { mainPlayer: Player; user: User }) {
  const t = useTranslations('dashboard')
  const common = useTranslations('common')
  const firstName = user.name?.split(' ')[0] || mainPlayer.firstName

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 md:space-y-5">
      <header className="px-1 pt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t('welcomeBack')}, <span className="name-gradient">{firstName}</span></h1>
        <p className="text-sm text-muted-foreground">{t('dashboardSubtitle')}</p>
      </header>
      <CreateNewMatchButton />
      <div role="status" aria-busy="true" className="grid grid-cols-2 gap-3">
        <span className="sr-only">{common('loading')}</span>
        {[0, 1, 2, 3].map(item => <div key={item} aria-hidden="true" className="h-32 animate-pulse rounded-2xl border border-border bg-card" />)}
      </div>
    </div>
  )
}
