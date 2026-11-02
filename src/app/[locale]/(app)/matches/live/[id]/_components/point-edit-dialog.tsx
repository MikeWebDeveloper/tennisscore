"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import type { PointDetail, PointLogEdit } from "@/stores/matchStore"

type Side = "p1" | "p2"
type Outcome = PointDetail["pointOutcome"]
type Mode = "change" | "insert" | "delete"

/** The outcomes the simple logger offers, with their "common" message keys */
const OUTCOMES: [Outcome, string][] = [
  ["winner", "pointWinner"],
  ["ace", "ace"],
  ["double_fault", "doubleFault"],
  ["unforced_error", "unforcedError"],
  ["forced_error", "forcedError"],
]

interface PointEditDialogProps {
  /** The point being corrected, with its place in the log */
  point: { index: number; pointNumber: number; gameScore: string; winner: Side; server: Side } | null
  names: Record<Side, string>
  /** False when the match only records who won each point */
  recordsOutcome: boolean
  pending: boolean
  onApply: (edit: PointLogEdit) => void
  onClose: () => void
}

const chip = (active: boolean) => cn("h-10 rounded-full px-4", active && "ring-2 ring-primary")

/** Correct an earlier point: another winner, a point the scorer missed, or a point that was never played */
export function PointEditDialog({ point, names, recordsOutcome, pending, onApply, onClose }: PointEditDialogProps) {
  const t = useTranslations("match")
  const tCommon = useTranslations("common")
  const [mode, setMode] = useState<Mode>("change")
  const [insertWinner, setInsertWinner] = useState<Side | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  if (!point) return null

  const other: Side = point.winner === "p1" ? "p2" : "p1"
  const winner = mode === "change" ? other : insertWinner
  // An ace is the server's point, a double fault the receiver's
  const outcomes = OUTCOMES.filter(([value]) => !winner || (value === "ace" ? winner === point.server : value === "double_fault" ? winner !== point.server : true))
  const needsOutcome = recordsOutcome && mode !== "delete"
  const ready = mode === "delete" || (winner !== null && (!needsOutcome || outcome !== null))

  const switchMode = (next: Mode) => {
    setMode(next)
    setOutcome(null)
    setInsertWinner(null)
  }
  const apply = () => {
    const chosen = needsOutcome && outcome ? { outcome } : {}
    if (mode === "delete") onApply({ kind: "delete", index: point.index })
    else if (mode === "change") onApply({ kind: "change-winner", index: point.index, ...chosen })
    else if (insertWinner) onApply({ kind: "insert", index: point.index, winner: insertWinner, ...chosen })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("pointEditTitle", { number: point.pointNumber })}</DialogTitle>
          <DialogDescription>{t("pointEditSummary", { score: point.gameScore, name: names[point.winner] })}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1" role="group">
          {([["change", "pointEditChangeWinner"], ["insert", "pointEditInsert"], ["delete", "pointEditDelete"]] as const).map(([value, label]) => (
            <Button key={value} type="button" variant={mode === value ? "default" : "ghost"} className="h-10 px-2 text-sm" aria-pressed={mode === value} onClick={() => switchMode(value)}>
              {t(label)}
            </Button>
          ))}
        </div>

        {mode === "change" && <p className="text-sm font-semibold text-foreground">{t("pointEditWonBy", { name: names[other] })}</p>}
        {mode === "insert" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("pointEditInsertWinner")}</p>
            <div className="flex flex-wrap gap-2">
              {(["p1", "p2"] as const).map((side) => (
                <Button key={side} type="button" variant="outline" className={chip(insertWinner === side)} aria-pressed={insertWinner === side} onClick={() => { setInsertWinner(side); setOutcome(null) }}>
                  {names[side]}
                </Button>
              ))}
            </div>
          </div>
        )}
        {mode === "delete" && <p className="text-sm text-muted-foreground">{t("pointEditDeleteHint")}</p>}

        {needsOutcome && winner && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("pointEditHowEnded")}</p>
            <div className="flex flex-wrap gap-2">
              {outcomes.map(([value, label]) => (
                <Button key={value} type="button" variant="outline" className={chip(outcome === value)} aria-pressed={outcome === value} onClick={() => setOutcome(value)}>
                  {tCommon(label)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>{tCommon("cancel")}</Button>
          <Button type="button" variant={mode === "delete" ? "destructive" : "default"} disabled={!ready || pending} onClick={apply}>
            {t("pointEditSave")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
