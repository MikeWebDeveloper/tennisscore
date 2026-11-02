"use client"

import { useTranslations } from "@/i18n"
import { motion } from '@/lib/framer-motion-config'
import { Button } from "@/components/ui/button"

interface CompactRematchStepProps {
  /** "Látalová Sofie", or "A / B" for a doubles team */
  teams: [string, string]
  tournamentName: string
  formatLabel: string
  detailLabel: string
  loading: boolean
  onStart: () => void
  onEdit: () => void
}

/** A rematch: the same players and rules, started with one tap or adjusted first */
export function CompactRematchStep({ teams, tournamentName, formatLabel, detailLabel, loading, onStart, onEdit }: CompactRematchStepProps) {
  const t = useTranslations('common')
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-2">
      <div className="mb-3 text-left">
        <h2 className="text-base font-semibold">{t("rematchTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("rematchHint")}</p>
      </div>
      <div className="surface space-y-1 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{teams[0]}</p>
        <p className="text-xs text-muted-foreground">{t("vs")}</p>
        <p className="text-sm font-semibold text-foreground">{teams[1]}</p>
        {tournamentName && <p className="pt-1 text-xs text-muted-foreground">{tournamentName}</p>}
        <p className="pt-2 text-xs text-muted-foreground">{formatLabel}</p>
        <p className="text-xs text-muted-foreground">{detailLabel}</p>
      </div>
      <Button type="button" className="mt-4 h-12 w-full" disabled={loading} onClick={onStart}>{t("startMatch")}</Button>
      <Button type="button" variant="outline" className="mt-2 w-full" disabled={loading} onClick={onEdit}>{t("edit")}</Button>
    </motion.div>
  )
}
