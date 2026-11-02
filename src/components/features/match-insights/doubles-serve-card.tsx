"use client"

import { useTranslations } from "@/i18n"
import type { DoublesServeRow } from "@/lib/utils/doubles-serve-stats"

/** Doubles: each partner's own service games and serve points, from points that recorded who served */
export function DoublesServeCard({ rows, names }: { rows: DoublesServeRow[]; names: Record<DoublesServeRow["player"], string> }) {
  const t = useTranslations("insights")
  if (rows.length === 0) return null
  return (
    <section className="surface rounded-2xl p-4" aria-labelledby="doubles-serve-title">
      <h3 id="doubles-serve-title" className="text-sm font-semibold">{t("doublesServeTitle")}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("doublesServeHint")}</p>
      <ul className="mt-3 divide-y divide-border/60">
        {rows.map((row) => (
          <li key={row.player} data-doubles-serve-row className="py-2">
            <p className={`text-sm font-semibold ${row.player === "p1" || row.player === "p3" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>{names[row.player]}</p>
            <p className="text-xs text-muted-foreground">
              {[
                t("doublesServeHeld", { held: row.held, games: row.serviceGames }),
                t("doublesServePoints", { won: row.pointsWon, served: row.pointsServed, percent: row.pointsServed ? Math.round((row.pointsWon / row.pointsServed) * 100) : 0 }),
                row.secondServes > 0 ? t("doublesServeSecond", { count: row.secondServes }) : null,
                row.aces !== undefined ? t("doublesServeAces", { count: row.aces }) : null,
                row.doubleFaults !== undefined ? t("doublesServeDoubleFaults", { count: row.doubleFaults }) : null,
              ].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
