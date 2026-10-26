"use client"

import { Check, CloudOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n"
import type { SyncState } from "@/hooks/use-sync-status"

/** Compact "Saved / Saving / Unsent" indicator for the scorer. */
export function SyncStatusBadge({ state, className }: { state: SyncState; className?: string }) {
  const t = useTranslations("match")

  const config = {
    synced: { Icon: Check, label: t("syncSaved"), tone: "text-muted-foreground" },
    saving: { Icon: Loader2, label: t("syncSaving"), tone: "text-muted-foreground" },
    unsent: { Icon: CloudOff, label: t("syncUnsent"), tone: "text-amber-600 dark:text-amber-400" },
  }[state]

  return (
    <span
      role="status"
      aria-live="polite"
      data-sync-state={state}
      className={cn("inline-flex items-center gap-1 text-xs font-medium", config.tone, className)}
    >
      <config.Icon className={cn("h-3.5 w-3.5", state === "saving" && "animate-spin")} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  )
}
