"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "@/i18n"
import type { MatchInsights, Moment, Side } from "@/lib/utils/match-insights"
import { setScoreLabel } from "./labels"

const BLUE = "#3b82f6"
const RED = "#ef4444"

/** Width of the element in CSS pixels, so the chart draws at real size (text never stretches) */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.max(200, Math.round(el.getBoundingClientRect().width)))
    update()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

interface MomentumChartProps {
  insights: MatchInsights
  names: Record<Side, string>
  /** Only this set, re-based to 0 at its start (the live screen's set chart) */
  set?: number
  /** A small chart without labels, legend or markers */
  compact?: boolean
  height?: number
}

/**
 * Player one's lead in points after every point: blue above the line when player one leads, red
 * below when player two does. Dashed lines split sets; rings mark breaks of serve.
 */
export function MomentumChart({ insights, names, set, compact = false, height }: MomentumChartProps) {
  const t = useTranslations("insights")
  const [ref, width] = useWidth(compact ? 320 : 360)

  let start = 0
  let end = insights.worm.length - 1
  if (set !== undefined) {
    const inSet = insights.games.filter((g) => g.set === set)
    if (!inSet.length) return null
    start = inSet[0].firstPoint
    end = inSet[inSet.length - 1].lastPoint + 1
  }
  const base = insights.worm[start]
  const values = insights.worm.slice(start, end + 1).map((v) => v - base)
  if (values.length < 2) return null

  const H = height ?? (compact ? 56 : width < 480 ? 190 : 230)
  const padTop = compact ? 4 : 14
  const padBottom = compact ? 4 : 26
  const padLeft = compact ? 0 : 24
  const W = width
  const lo = Math.min(-3, ...values)
  const hi = Math.max(3, ...values)
  const n = values.length - 1
  const x = (i: number) => padLeft + (i * (W - padLeft - 4)) / n
  const y = (v: number) => padTop + ((hi - v) * (H - padTop - padBottom)) / (hi - lo)
  const zero = y(0)
  const pts = (fn: (v: number) => number) => values.map((v, i) => `${x(i).toFixed(1)},${y(fn(v)).toFixed(1)}`).join(" ")
  const line = pts((v) => v)
  const pos = `${x(0)},${zero} ${pts((v) => Math.max(v, 0))} ${x(n)},${zero}`
  const neg = `${x(0)},${zero} ${pts((v) => Math.min(v, 0))} ${x(n)},${zero}`

  const step = hi - lo > 30 ? 10 : 5
  const grid: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) if (v !== 0) grid.push(v)

  const local = (at: number) => at - start
  const setEnds = insights.setEnds.map(local).filter((i) => i > 0 && i < n)
  const breaks = insights.breakMarks.map((b) => ({ ...b, i: local(b.at) })).filter((b) => b.i >= 0 && b.i <= n)
  const comeback = insights.moments.find((m): m is Extract<Moment, { kind: "comeback" }> => m.kind === "comeback" && m.role === "hold")
  const comebackGame = comeback && insights.games.find((g) => g.lastPoint + 1 === comeback.at)
  const lowIndex = comebackGame ? local(lowestPoint(insights, comebackGame.firstPoint, comebackGame.lastPoint, comebackGame.server)) : null

  const setLabels = insights.sets.map((s) => {
    const games = insights.games.filter((g) => g.set === s.set)
    if (!games.length) return null
    const from = local(games[0].firstPoint)
    return { set: s.set, from, label: t("chartSetLabel", { set: s.set, score: setScoreLabel(s) }) }
  }).filter((l): l is { set: number; from: number; label: string } => l !== null && l.from >= 0 && l.from < n)

  return (
    <div ref={ref} data-momentum-chart className="w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t("chartAria", { p1: names.p1, p2: names.p2 })}
        className="block overflow-visible"
      >
        {!compact && grid.map((v) => (
          <g key={v}>
            <line x1={padLeft} x2={W} y1={y(v)} y2={y(v)} className="stroke-border" strokeDasharray="3 4" />
            <text x={0} y={y(v) + 3} className="fill-muted-foreground" style={{ font: "600 9px var(--font-inter, sans-serif)" }}>
              {v > 0 ? `+${v}` : v}
            </text>
          </g>
        ))}
        <polygon points={pos} fill={BLUE} opacity={0.22} />
        <polygon points={neg} fill={RED} opacity={0.28} />
        <line x1={padLeft} x2={W} y1={zero} y2={zero} className="stroke-muted-foreground" opacity={0.5} />
        {setEnds.map((i) => (
          <line key={i} x1={x(i)} x2={x(i)} y1={padTop / 2} y2={H - padBottom + 4} className="stroke-muted-foreground" opacity={0.6} strokeDasharray="2 3" />
        ))}
        <polyline points={line} fill="none" className="stroke-foreground" opacity={0.85} strokeWidth={compact ? 1.75 : 2} strokeLinejoin="round" />
        {!compact && breaks.map((b) => (
          <circle key={b.at} cx={x(b.i)} cy={y(values[b.i])} r={4.5} className="fill-card" stroke={b.side === "p1" ? BLUE : RED} strokeWidth={2.5} />
        ))}
        {!compact && comeback && lowIndex !== null && lowIndex >= 0 && lowIndex <= n && (
          <g>
            <circle cx={x(lowIndex)} cy={y(values[lowIndex])} r={3.5} fill="#f59e0b" />
            <text
              x={Math.min(x(lowIndex) - 6, W - 70)}
              y={Math.min(y(values[lowIndex]) + 17, H - padBottom - 2)}
              fill="#f59e0b"
              style={{ font: "700 10px var(--font-inter, sans-serif)" }}
            >
              {t("chartComeback", { from: comeback.from })}
            </text>
          </g>
        )}
        {!compact && setLabels.map((l) => (
          <text key={l.set} x={x(l.from) + 4} y={H - 6} className="fill-muted-foreground" style={{ font: "600 10px var(--font-inter, sans-serif)" }}>
            {l.label}
          </text>
        ))}
      </svg>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />{t("chartLeads", { name: names.p1 })}</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />{t("chartLeads", { name: names.p2 })}</span>
          {breaks.length > 0 && (
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-blue-500" />{t("chartBreak")}</span>
          )}
        </div>
      )}
    </div>
  )
}

/** Index (into the lead line) of the server's lowest moment in a game they came back in */
function lowestPoint(insights: MatchInsights, first: number, last: number, server: Side) {
  const sign = server === "p1" ? 1 : -1
  let best = first
  for (let i = first; i <= last + 1; i++) if (sign * insights.worm[i] < sign * insights.worm[best]) best = i
  return best
}
