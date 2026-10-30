"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useLocale, useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import type { MatchInsights, Side } from "@/lib/utils/match-insights"
import { MomentumChart } from "./momentum-chart"
import { formatSeconds, setScoreLabel } from "./labels"

/**
 * Every game in order, set by set: who served, how each point went (a dot per point in the
 * winner's colour), the games score after it and what made it stand out.
 */
export function MatchFlow({ insights, names }: { insights: MatchInsights; names: Record<Side, string> }) {
  const t = useTranslations("insights")
  const locale = useLocale()

  if (!insights.games.length) {
    return <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("flowEmpty")}</CardContent></Card>
  }

  return (
    <div className="flex flex-col gap-4" data-match-flow>
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
          <h3 className="text-[15px] font-bold">{t("chartTitle")}</h3>
          <MomentumChart insights={insights} names={names} />
        </CardContent>
      </Card>
      {insights.sets.map((s) => {
        const games = insights.games.filter((g) => g.set === s.set)
        return (
          <Card key={s.set} className="rounded-2xl">
            <CardContent className="flex flex-col gap-1 p-4 sm:p-5">
              <h3 className="mb-2 flex items-baseline justify-between gap-2 text-[15px] font-bold">
                <span>{s.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(s) }) : t("setTitle", { set: s.set, score: setScoreLabel(s) })}</span>
                {s.durationSec ? <span className="text-xs font-medium text-muted-foreground">{formatSeconds(Math.round(s.durationSec / 60) * 60, locale)}</span> : null}
              </h3>
              <ol className="flex flex-col">
                {games.map((g) => {
                  const tags: string[] = []
                  if (g.isBreak) tags.push(t("tagBreak"))
                  if (g.comebackFrom) tags.push(t("tagComeback", { from: g.comebackFrom }))
                  if (g.breakPointsSaved > 0 && g.winner === g.server) tags.push(t("tagSaved", { count: g.breakPointsSaved }))
                  if (g.deuce) tags.push(t("tagDeuce"))
                  return (
                    <li key={g.game} data-flow-game className="flex items-center gap-3 border-b py-2.5 last:border-b-0">
                      <div className="flex w-[4.5rem] shrink-0 flex-col">
                        <span className="text-[13px] font-bold">{g.tiebreak ? (s.superTiebreak ? t("flowSuperTiebreak") : t("flowTiebreak")) : t("flowGame", { game: g.game })}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{t("flowServing", { name: names[g.server] })}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap gap-[3px]" aria-hidden>
                          {g.points.map((winner, i) => (
                            <span key={i} className={cn("h-2.5 w-2.5 rounded-full", winner === "p1" ? "bg-blue-500" : "bg-red-500")} />
                          ))}
                        </div>
                        {tags.length > 0 && <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">{tags.join(" · ")}</span>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className={cn(
                          "font-mono text-sm font-extrabold tabular-nums",
                          g.winner === "p1" ? "text-blue-600 dark:text-blue-400" : g.winner === "p2" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )}>
                          {g.winner ? `${g.gamesAfter[0]}:${g.gamesAfter[1]}` : t("gameNow")}
                        </span>
                        {g.durationSec ? <span className="text-[11px] text-muted-foreground">{formatSeconds(g.durationSec, locale)}</span> : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
