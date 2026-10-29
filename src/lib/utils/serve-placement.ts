import type { PointDetail } from "@/lib/types"

export type ServePlacement = NonNullable<PointDetail["servePlacement"]>

/**
 * Where an ace landed. Net cord ("prase") is offered in every category: junior tennis plays no-let,
 * so a serve that clips the net and lands in stays in play and can be an ace.
 */
export const ACE_PLACEMENTS = [
  { id: "net-cord", labelKey: "serveNetCord", color: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20" },
  { id: "wide", labelKey: "serveOutOfCourt", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" },
  { id: "t", labelKey: "serveOnTheT", color: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20" },
] as const

/** Placement choices for any other serve (double faults, custom serve-placement logging). */
export const SERVE_PLACEMENTS = [
  { id: "wide", labelKey: "wide", color: "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20" },
  { id: "body", labelKey: "body", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" },
  { id: "t", labelKey: "tDownTheMiddle", color: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20" },
] as const

/** Translation key for a saved placement, using the ace wording for aces (older aces may still say "body"). */
export function servePlacementLabelKey(placement: string, isAce: boolean): string {
  if (isAce) {
    const ace = ACE_PLACEMENTS.find(option => option.id === placement)
    if (ace) return ace.labelKey
  }
  return SERVE_PLACEMENTS.find(option => option.id === placement)?.labelKey ?? (placement === "net-cord" ? "serveNetCord" : placement)
}
