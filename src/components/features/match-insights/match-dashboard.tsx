"use client"

import type { ReactNode } from "react"
import { Trophy } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { Zap } from "lucide-react"
import { Shield } from "lucide-react"
import { Flame } from "lucide-react"
import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PlayerMeta } from "@/components/shared/player-meta"
import { useLocale, useTranslations } from "@/i18n"
import { cn } from "@/lib/utils"
import type { Player } from "@/lib/types"
import { percent, type MatchInsights, type Side } from "@/lib/utils/match-insights"
import { MomentumChart } from "./momentum-chart"
import { GameTiles } from "./game-tiles"
import { formatSeconds, setScoreLabel, sideText } from "./labels"
import { headlineDetail, headlineTitle, momentText, pointSources, pressureShares, type Translate } from "./texts"

export interface DashboardPlayers {
  p1?: Player
  p2?: Player
  p3?: Player
  p4?: Player
}

interface MatchDashboardProps {
  insights: MatchInsights
  players: DashboardPlayers
  /** As the scoreboard shows them ("Látalová Sofie", or a doubles team) */
  fullNames: Record<Side, string>
  /** For legends and stat rows ("Sofie") */
  shortNames: Record<Side, string>
  focus: Side
  /** The stored winner (a retirement can leave the loser ahead on the court) */
  winner?: Side | null
  /** The official score as stored (what every other screen shows); the open set last while playing */
  scoreboard: { sets: [number, number][]; current?: [number, number] }
  completed: boolean
  statusLabel: string
  dateLabel: string
  tournamentName?: string
  durationText?: string
  aiCard?: ReactNode
  actions?: ReactNode
}

function Section({ title, icon, children, className, aside }: { title: string; icon?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-[15px] font-bold">{icon}{title}</h3>
          {aside}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function Pair({ a, b, sep = ":" }: { a: ReactNode; b: ReactNode; sep?: string }) {
  return (
    <span className="font-mono font-extrabold tabular-nums">
      <span className={sideText.p1}>{a}</span>
      <span className="text-muted-foreground">{sep}</span>
      <span className={sideText.p2}>{b}</span>
    </span>
  )
}

function Tile({ label, value, sub, small = false }: { label: string; value: ReactNode; sub?: ReactNode; small?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border bg-card p-3.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("whitespace-nowrap", small ? "text-lg leading-8 sm:text-xl" : "text-2xl")}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-muted p-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xl">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

/** Two bars growing out from the middle: player one to the left, player two to the right */
function SplitRow({ label, a, b, wa, wb }: { label: string; a: string; b: string; wa: number; wb: number }) {
  return (
    <div className="flex flex-col gap-1.5" data-split-row>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-mono text-[15px] font-extrabold tabular-nums", sideText.p1)}>{a}</span>
        <span className="text-center text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("font-mono text-[15px] font-extrabold tabular-nums", sideText.p2)}>{b}</span>
      </div>
      <div className="flex h-1.5 gap-1">
        <div className="flex flex-1 justify-end overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-blue-500 transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, wa))}%` }} />
        </div>
        <div className="flex flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-red-500 transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, wb))}%` }} />
        </div>
      </div>
    </div>
  )
}

const pctText = (value: number | null) => (value === null ? "–" : `${value} %`)

function percentRow(label: string, a: number | null, b: number | null) {
  return <SplitRow key={label} label={label} a={pctText(a)} b={pctText(b)} wa={a ?? 0} wb={b ?? 0} />
}

function countRow(label: string, a: number, b: number) {
  const max = Math.max(a, b, 1)
  return <SplitRow key={label} label={label} a={String(a)} b={String(b)} wa={(100 * a) / max} wb={(100 * b) / max} />
}

export function MatchDashboard(props: MatchDashboardProps) {
  const { insights, players, fullNames, shortNames, focus, completed } = props
  const t = useTranslations("insights")
  const tr = t as unknown as Translate
  const locale = useLocale()
  const other: Side = focus === "p1" ? "p2" : "p1"
  const { p1, p2 } = insights.totals
  const f = insights.totals[focus]
  const o = insights.totals[other]
  const totalPoints = p1.points + p2.points
  const winner = props.winner ?? (completed ? insights.leader : null)
  const detail = insights.hasServeDetail

  const title = headlineTitle(insights, shortNames, tr, props.winner)
  const detailLine = headlineDetail(insights, focus, shortNames, tr, props.durationText)

  const rows: { side: Side; members: (Player | undefined)[] }[] = [
    { side: "p1", members: [players.p1, players.p3] },
    { side: "p2", members: [players.p2, players.p4] },
  ]

  const errorsDiff = f.unforcedErrors - o.unforcedErrors
  const sources = (["p1", "p2"] as Side[]).map((side) => ({ side, ...pointSources(insights, side) }))
  const focusSources = sources.find((s) => s.side === focus)!
  const pressure = pressureShares(insights, focus)
  const finishedSets = insights.sets.filter((s) => s.durationSec !== null && insights.games.some((g) => g.set === s.set))

  const sourceNote = (() => {
    if (!detail || focusSources.total < 10) return null
    const errShare = percent(focusSources.unforced, focusSources.total) ?? 0
    const ownShare = percent(focusSources.own, focusSources.total) ?? 0
    if (errShare >= 45) return t("howNoteErrors", { name: shortNames[focus], count: focusSources.unforced, total: focusSources.total, pct: errShare })
    if (ownShare >= 35) return t("howNoteWinners", { name: shortNames[focus], count: focusSources.own, total: focusSources.total, pct: ownShare })
    return null
  })()

  return (
    <div className="flex flex-col gap-4" data-match-dashboard>
      {/* Result: the live scoreboard's look, with the story of the match underneath */}
      <Card className="overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {[props.dateLabel, props.tournamentName].filter(Boolean).join(" · ")}
          </span>
          <span className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            completed ? "bg-green-500 text-white" : "bg-muted text-foreground"
          )} data-match-status>
            {props.statusLabel}
          </span>
        </div>
        <div className="px-4 pb-3">
          {rows.map(({ side, members }, index) => (
            <div key={side} className={cn("flex items-center gap-3 py-2", index === 0 && "border-b")}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={cn("flex items-center gap-1.5 text-[17px] font-bold leading-tight", winner && winner !== side && "text-muted-foreground font-semibold")}>
                  <span className="min-w-0 break-words">{fullNames[side]}</span>
                  {winner === side && <Trophy className="h-4 w-4 shrink-0 text-amber-400" aria-label={t("winner")} />}
                </span>
                <PlayerMeta players={members} />
              </div>
              {props.scoreboard.sets.map(([a, b], i) => {
                const mine = side === "p1" ? a : b
                const lost = a !== b && (side === "p1" ? a < b : b < a)
                return (
                  <span key={i} className={cn("w-9 text-center font-mono text-2xl font-extrabold tabular-nums", lost && "text-muted-foreground")}>
                    {mine}
                  </span>
                )
              })}
              {props.scoreboard.current && (
                <span className="w-9 text-center font-mono text-2xl font-extrabold tabular-nums text-amber-500">
                  {side === "p1" ? props.scoreboard.current[0] : props.scoreboard.current[1]}
                </span>
              )}
            </div>
          ))}
        </div>
        {insights.hasPoints && (
          <div className="flex flex-col gap-1.5 border-t bg-muted px-4 py-3.5" data-headline>
            <p className="text-lg font-extrabold leading-snug">{title}</p>
            {detailLine && <p className="text-[13px] leading-relaxed text-muted-foreground">{detailLine}</p>}
          </div>
        )}
      </Card>

      {!insights.hasPoints ? (
        <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">{t("noPoints")}</CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4" data-key-numbers>
            <Tile label={t("tilePoints")} value={<Pair a={p1.points} b={p2.points} />} sub={t("tilePointsSub", { name: shortNames[focus], pct: percent(f.points, totalPoints) ?? 0 })} />
            <Tile label={t("tileBreaks")} value={<Pair a={p1.breaks} b={p2.breaks} />} sub={f.breakPointChances ? t("tileBreaksSub", { won: f.breakPointsWon, chances: f.breakPointChances }) : undefined} />
            <Tile
              small
              label={t("tileHolds")}
              value={<Pair a={`${p1.serviceGamesHeld}/${p1.serviceGames}`} b={`${p2.serviceGamesHeld}/${p2.serviceGames}`} sep=" · " />}
              sub={f.serviceGames && f.serviceGamesHeld === f.serviceGames ? t("tileHoldsAll", { name: shortNames[focus] }) : undefined}
            />
            {detail ? (
              <Tile
                label={t("tileUnforced")}
                value={<Pair a={p1.unforcedErrors} b={p2.unforcedErrors} />}
                sub={`${shortNames[focus]}: ${errorsDiff < 0 ? t("tileFewer", { count: -errorsDiff }) : errorsDiff > 0 ? t("tileMore", { count: errorsDiff }) : t("tileSame")}`}
              />
            ) : (
              <Tile label={t("longestGameRun")} value={<Pair a={p1.longestGameRun} b={p2.longestGameRun} />} />
            )}
          </div>

          <Section title={t("chartTitle")} icon={<TrendingUp className="h-[18px] w-[18px] text-blue-500" />}>
            <p className="-mt-3 text-xs text-muted-foreground">{t("chartSubtitle")}</p>
            <MomentumChart insights={insights} names={shortNames} />
          </Section>

          <Section title={t("gamesTitle")}>
            {insights.sets.map((s) => {
              const games = insights.games.filter((g) => g.set === s.set)
              const breaks = s.breaks[0] + s.breaks[1]
              const meta = [
                s.durationSec ? formatSeconds(Math.round(s.durationSec / 60) * 60, locale) : null,
                breaks ? t("setBreaks", { count: breaks }) : null,
              ].filter(Boolean).join(" · ")
              return (
                <div key={s.set} className="flex flex-col gap-2" data-set-row>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="font-bold">{s.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(s) }) : t("setTitle", { set: s.set, score: setScoreLabel(s) })}</span>
                    <span className="text-muted-foreground">{meta}</span>
                  </div>
                  <GameTiles games={games} names={shortNames} />
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground">{t("gamesHint")}</p>
          </Section>

          {insights.moments.length > 0 && (
            <Section title={t("momentsTitle")} icon={<Zap className="h-[18px] w-[18px] text-amber-400" />}>
              <ol className="flex flex-col gap-3" data-moments>
                {insights.moments.map((m) => {
                  const text = momentText(m, shortNames, tr, locale)
                  return (
                    <li key={`${m.kind}-${m.at}`} className="flex items-start gap-3">
                      <span className="w-24 shrink-0 rounded-lg bg-amber-400/15 px-1.5 py-1 text-center font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">{text.when}</span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex items-center gap-1.5 text-[13.5px] font-bold">
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", m.side === "p1" ? "bg-blue-500" : "bg-red-500")} aria-hidden />
                          {text.title}
                        </span>
                        <span className="text-xs leading-relaxed text-muted-foreground">{text.text}</span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Section>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Section
              title={t("serveTitle")}
              aside={<span className="text-[11px] font-bold"><span className={sideText.p1}>{shortNames.p1}</span> · <span className={sideText.p2}>{shortNames.p2}</span></span>}
            >
              {detail ? [
                percentRow(t("firstServeIn"), percent(p1.firstServes, p1.servePoints), percent(p2.firstServes, p2.servePoints)),
                percentRow(t("firstServeWon"), percent(p1.firstServePointsWon, p1.firstServes), percent(p2.firstServePointsWon, p2.firstServes)),
                percentRow(t("secondServeWon"), percent(p1.secondServePointsWon, p1.secondServes), percent(p2.secondServePointsWon, p2.secondServes)),
                percentRow(t("returnWon"), percent(p1.returnPointsWon, p1.returnPoints), percent(p2.returnPointsWon, p2.returnPoints)),
                countRow(t("aces"), p1.aces, p2.aces),
                countRow(t("doubleFaults"), p1.doubleFaults, p2.doubleFaults),
              ] : [
                percentRow(t("servePointsWon"), percent(p1.servePointsWon, p1.servePoints), percent(p2.servePointsWon, p2.servePoints)),
                percentRow(t("returnWon"), percent(p1.returnPointsWon, p1.returnPoints), percent(p2.returnPointsWon, p2.returnPoints)),
              ]}
            </Section>

            <Section title={t("bigTitle")} icon={<Shield className="h-[18px] w-[18px] text-blue-500" />}>
              <div className="grid grid-cols-2 gap-2.5">
                <MiniStat label={t("bpSaved")} value={<Pair a={`${p1.breakPointsSaved}/${p1.breakPointsFaced}`} b={`${p2.breakPointsSaved}/${p2.breakPointsFaced}`} sep=" · " />} />
                <MiniStat label={t("bpConverted")} value={<Pair a={`${p1.breakPointsWon}/${p1.breakPointChances}`} b={`${p2.breakPointsWon}/${p2.breakPointChances}`} sep=" · " />} />
                <MiniStat label={t("deuceGames")} value={<Pair a={p1.deuceGamesWon} b={p2.deuceGamesWon} />} />
                <MiniStat label={t("pressurePoints")} value={<Pair a={p1.pressurePointsWon} b={p2.pressurePointsWon} />} />
              </div>
              {pressure.pressure !== null && pressure.rest !== null && insights.pressurePointsPlayed >= 4 && (
                <p className="text-xs leading-relaxed text-muted-foreground">{t("bigNote", { name: shortNames[focus], pct: pressure.pressure, rest: pressure.rest })}</p>
              )}
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {detail && (
              <Section title={t("howTitle")}>
                {sources.map((s) => {
                  const share = (n: number) => (s.total ? (100 * n) / s.total : 0)
                  const tint = s.side === "p1" ? "bg-blue-500" : "bg-red-500"
                  return (
                    <div key={s.side} className="flex flex-col gap-1.5" data-points-source={s.side}>
                      <div className="flex justify-between gap-2 text-[12.5px]">
                        <span className={cn("font-bold", sideText[s.side])}>{t("howRow", { name: shortNames[s.side], count: s.total })}</span>
                        <span className="text-right text-muted-foreground">{t("howRowSub", { own: s.own, errors: s.errors })}</span>
                      </div>
                      <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-muted">
                        <div className={tint} style={{ width: `${share(s.own)}%` }} />
                        <div className={cn(tint, "opacity-60")} style={{ width: `${share(s.unforced)}%` }} />
                        <div className={cn(tint, "opacity-40")} style={{ width: `${share(s.forced)}%` }} />
                        <div className={cn(tint, "opacity-20")} style={{ width: `${share(s.doubleFaults)}%` }} />
                      </div>
                    </div>
                  )
                })}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-400" />{t("legendOwn")}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-400 opacity-60" />{t("legendUnforced")}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-400 opacity-40" />{t("legendForced")}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-slate-400 opacity-20" />{t("legendDoubleFaults")}</span>
                </div>
                {sourceNote && <p className="text-xs leading-relaxed text-muted-foreground">{sourceNote}</p>}
              </Section>
            )}

            <Section title={t("runsTitle")} icon={<Flame className="h-[18px] w-[18px] text-orange-500" />}>
              <div className="grid grid-cols-2 gap-2.5">
                <MiniStat label={t("longestPointRun")} value={<Pair a={p1.longestPointRun} b={p2.longestPointRun} />} />
                <MiniStat label={t("longestGameRun")} value={<Pair a={p1.longestGameRun} b={p2.longestGameRun} />} />
                {finishedSets.length > 0 && (
                  <MiniStat
                    label={t("setLengths")}
                    value={<span className="text-sm font-bold">{finishedSets.map((s) => formatSeconds(Math.round((s.durationSec ?? 0) / 60) * 60, locale)).join(" · ")}</span>}
                    sub={t("setLengthsSub", { points: finishedSets.map((s) => s.points[0] + s.points[1]).join(" · ") })}
                  />
                )}
                {insights.medianSecondsBetweenPoints !== null && (
                  <MiniStat label={t("pace")} value={<span className="text-sm font-bold">{t("paceValue", { seconds: insights.medianSecondsBetweenPoints })}</span>} sub={t("paceSub")} />
                )}
              </div>
              {insights.longestGame && (
                <div className="flex items-center gap-2.5 rounded-xl bg-muted p-3">
                  <Clock className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                  <span className="text-xs leading-relaxed">
                    {insights.longestGame.durationSec
                      ? t("longestGame", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length, duration: formatSeconds(insights.longestGame.durationSec, locale) })
                      : t("longestGameNoTime", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length })}
                  </span>
                </div>
              )}
            </Section>
          </div>

          {props.aiCard}
        </>
      )}

      {props.actions}
    </div>
  )
}
