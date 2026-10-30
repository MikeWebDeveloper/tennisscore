"use client"

import { Zap } from "lucide-react"
import { useLocale, useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import { percent, type GameSummary, type MatchInsights, type Side } from "@/lib/utils/match-insights"
import { GameTiles } from "./game-tiles"
import { MomentumChart } from "./momentum-chart"
import { sideText } from "./labels"
import { momentText, type Translate } from "./texts"

function Pair({ a, b, unit }: { a: string | number; b: string | number; unit?: string }) {
  return (
    <span className="font-mono text-[19px] font-extrabold tabular-nums">
      <span className={sideText.p1}>{a}</span>
      <span className="text-muted-foreground">{unit === "·" ? " · " : ":"}</span>
      <span className={sideText.p2}>{b}</span>
      {unit && unit !== "·" && <span className="text-xs text-muted-foreground"> {unit}</span>}
    </span>
  )
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-muted px-3 py-2.5">
      <span className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

/**
 * What the scorer and spectators want at a glance between points: the current run, the latest
 * big moment, four key numbers, this set's games and how the set has gone. Everything comes from
 * the point log, so it is right after every point (and after an undo).
 */
export function LiveInsights({ insights, names, matchOver }: { insights: MatchInsights; names: Record<Side, string>; matchOver: boolean }) {
  const t = useTranslations("insights")
  const locale = useLocale()
  if (!insights.hasPoints) return null

  const { p1, p2 } = insights.totals
  const currentSet = insights.sets[insights.sets.length - 1]
  const setGames = insights.games.filter((g) => g.set === currentSet.set)
  const lastGame = setGames[setGames.length - 1]
  // A finished last game means the next one is about to start: show it as "now"
  const tiles: GameSummary[] = !matchOver && lastGame?.winner && !currentSet.winner
    ? [...setGames, { ...lastGame, game: lastGame.game + 1, winner: null, isBreak: false, points: [], server: lastGame.server === "p1" ? "p2" : "p1" }]
    : setGames

  // The newest key moment, while it is still fresh (within the last two games)
  const recentFrom = insights.games[Math.max(0, insights.games.length - 3)]?.lastPoint ?? 0
  const latest = [...insights.moments].reverse().find((m) => m.at > recentFrom && m.kind !== "gameRun")
  const highlight = latest ? momentText(latest, names, t as unknown as Translate, locale) : null
  const run = insights.currentRun && insights.currentRun.length >= 3 ? insights.currentRun : null

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border bg-card p-3.5" data-live-insights>
      {(run || highlight) && (
        <div className="flex flex-col gap-2">
          {run && (
            <span className={cn(
              "self-start rounded-full border px-3 py-1 text-xs font-bold",
              run.side === "p1" ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200" : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200"
            )} data-live-run>
              {t("liveRun", { name: names[run.side], count: run.length })}
            </span>
          )}
          {highlight && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2" data-live-moment>
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="flex min-w-0 flex-col">
                <span className="text-[13px] font-bold text-amber-800 dark:text-amber-200">{highlight.title}</span>
                <span className="text-xs text-muted-foreground">{highlight.text}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile label={t("livePoints")}><Pair a={p1.points} b={p2.points} /></Tile>
        <Tile label={t("liveBreakPoints")}><Pair a={`${p1.breakPointsWon}/${p1.breakPointChances}`} b={`${p2.breakPointsWon}/${p2.breakPointChances}`} unit="·" /></Tile>
        {insights.hasServeDetail ? (
          <>
            <Tile label={t("firstServeIn")}><Pair a={percent(p1.firstServes, p1.servePoints) ?? "–"} b={percent(p2.firstServes, p2.servePoints) ?? "–"} unit="%" /></Tile>
            <Tile label={t("firstServeWon")}><Pair a={percent(p1.firstServePointsWon, p1.firstServes) ?? "–"} b={percent(p2.firstServePointsWon, p2.firstServes) ?? "–"} unit="%" /></Tile>
          </>
        ) : (
          <>
            <Tile label={t("servePointsWon")}><Pair a={percent(p1.servePointsWon, p1.servePoints) ?? "–"} b={percent(p2.servePointsWon, p2.servePoints) ?? "–"} unit="%" /></Tile>
            <Tile label={t("returnWon")}><Pair a={percent(p1.returnPointsWon, p1.returnPoints) ?? "–"} b={percent(p2.returnPointsWon, p2.returnPoints) ?? "–"} unit="%" /></Tile>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          {currentSet.superTiebreak ? t("flowSuperTiebreak") : t("liveGamesInSet", { set: currentSet.set })}
        </span>
        <GameTiles games={tiles} names={names} size="sm" />
      </div>

      {insights.worm.length > 3 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            {insights.sets.length > 1 ? t("liveSetFlow") : t("liveMatchFlow")}
          </span>
          <MomentumChart insights={insights} names={names} set={currentSet.set} compact />
        </div>
      )}
    </div>
  )
}
