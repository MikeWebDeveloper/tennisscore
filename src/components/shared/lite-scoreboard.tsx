import type { Score } from "@/stores/matchStore"

export type LitePlayerId = "p1" | "p2" | "p3" | "p4"

interface LiteTeam {
  /** One name for singles, two for doubles. */
  names: string[]
  /** Player ids matching `names` (used to underline the serving partner). */
  ids: LitePlayerId[]
}

interface LiteScoreboardProps {
  teams: [LiteTeam, LiteTeam]
  score: Score
  noAd?: boolean
  inProgress: boolean
  servingTeam?: "p1" | "p2"
  servingPlayer?: LitePlayerId | null
  winner?: "p1" | "p2" | null
  labels: { live: string; finished: string }
}

/** Tennis point text for a player: 0, 15, 30, 40, or Ad. */
export function pointLabel(own: number, other: number, noAd = false): string {
  if (!noAd && own >= 3 && other >= 3) {
    if (own === other) return "40"
    return own > other ? "Ad" : "40"
  }
  return ["0", "15", "30", "40"][Math.min(own, 3)]
}

/**
 * Read-only scoreboard rendered entirely on the server: no hooks, no client JavaScript.
 * Used by the lightweight spectator page.
 */
export function LiteScoreboard({
  teams,
  score,
  noAd,
  inProgress,
  servingTeam,
  servingPlayer,
  winner,
  labels,
}: LiteScoreboardProps) {
  const sides = ["p1", "p2"] as const

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs font-medium">
        <span className={`inline-flex items-center gap-1.5 ${inProgress ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
          {inProgress && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />}
          {inProgress ? labels.live : labels.finished}
        </span>
      </div>

      {sides.map((side, i) => {
        const team = teams[i]
        const won = winner === side
        const gameText = score.isTiebreak
          ? String(score.tiebreakPoints?.[i] ?? 0)
          : pointLabel(score.points[i], score.points[1 - i], noAd)
        return (
          <div
            key={side}
            data-side={side}
            className={`flex items-center gap-3 px-4 py-3 ${i === 0 ? "border-b border-border" : ""}`}
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${inProgress && servingTeam === side ? "bg-green-500" : "bg-transparent"}`}
            />
            <div className={`min-w-0 flex-1 text-base ${won ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
              {team.names.map((name, n) => (
                <div key={n} className={servingPlayer === team.ids[n] ? "truncate underline decoration-2 underline-offset-2" : "truncate"}>
                  {name}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 font-mono text-xl tabular-nums" data-sets>
              {score.sets.map((set, s) => (
                <span key={s} className={set[i] > set[1 - i] ? "font-bold text-foreground" : "text-muted-foreground"}>
                  {set[i]}
                </span>
              ))}
              {inProgress && (
                <>
                  <span className="font-bold text-foreground" data-games>{score.games[i]}</span>
                  <span className="w-8 rounded-md bg-muted px-1.5 py-0.5 text-center text-base font-semibold text-foreground" data-points>
                    {gameText}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}
