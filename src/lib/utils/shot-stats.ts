/**
 * Shot statistics from the point log, for matches scored at a level that records the shot that
 * ended each point ("shot-type", "detailed", "complex", "custom"). At the "simple" and "points"
 * levels every point stores the filler shot "serve", so there is nothing to report and the
 * builder returns null.
 *
 * Who hit the shot: `lastShotPlayer` when recorded, else the point's winner for winners and aces
 * and the loser for errors. `winnerType: "return"` marks the shot as the receiver's return (for
 * a return winner and for a return error alike).
 */

import type { Side } from "./match-insights"

export type ShotKind = "forehand" | "backhand" | "volley" | "overhead" | "drop_shot" | "lob"

export const SHOT_KINDS: ShotKind[] = ["forehand", "backhand", "volley", "overhead", "drop_shot", "lob"]

export interface ShotPoint {
  winner: Side
  server: Side
  pointOutcome?: string
  lastShotType?: string
  lastShotPlayer?: Side
  winnerType?: string
  servePlacement?: string
  shotDirection?: string
  atNet?: string
  courtPosition?: string
  serveSpeed?: number
  rallyLength?: number
  customFields?: { serveSpeed?: string; returnQuality?: string; rallyLength?: number }
}

export interface ShotLine {
  winners: number
  unforcedErrors: number
  forcedErrors: number
}

export interface SideShotStats {
  /** Point-ending shots by kind; kinds never used are left out */
  byShot: Partial<Record<ShotKind, ShotLine>>
  /** Returns that ended the point: winners and errors */
  returns: ShotLine
  /** Where this side's aces landed */
  acePlacements: Record<string, number>
  /** Direction of point-ending shots by kind (only when directions were recorded) */
  directions: Partial<Record<ShotKind, Record<string, ShotLine>>>
  /** Points this side played at the net, and won */
  netPoints: { played: number; won: number }
  /** This side's serves by where they landed: points served there, and won */
  servePlacements: Record<string, { played: number; won: number }>
  /** Points won by court position (when recorded) */
  courtPositions: Record<string, { played: number; won: number }>
  /** Measured serve speeds of this side (km/h), when recorded */
  serveSpeeds: number[]
  /** Custom statistics: serve speed class and return quality, with points won */
  customServeSpeed: Record<string, { played: number; won: number }>
  customReturnQuality: Record<string, { played: number; won: number }>
}

export interface ShotStats {
  /** How many points carry a real shot (not the "serve" filler) */
  pointsWithShot: number
  recorded: {
    shots: boolean; returns: boolean; acePlacements: boolean; servePlacements: boolean; directions: boolean
    net: boolean; courtPositions: boolean; serveSpeeds: boolean; customServeSpeed: boolean; customReturnQuality: boolean; rallyLengths: boolean
  }
  sides: Record<Side, SideShotStats>
  /** Points won by rally length bucket ("1-3", "4-6", "7-9", "10+"), when rally length was really recorded */
  rallyLengths: Record<string, Record<Side, number>>
}

const SHOT_LEVELS = new Set(["shot-type", "detailed", "complex", "custom"])
const other = (side: Side): Side => (side === "p1" ? "p2" : "p1")
const emptyLine = (): ShotLine => ({ winners: 0, unforcedErrors: 0, forcedErrors: 0 })
const emptySide = (): SideShotStats => ({
  byShot: {}, returns: emptyLine(), acePlacements: {}, directions: {}, netPoints: { played: 0, won: 0 },
  servePlacements: {}, courtPositions: {}, serveSpeeds: [], customServeSpeed: {}, customReturnQuality: {},
})
const tally = (map: Record<string, { played: number; won: number }>, key: string, won: boolean) => {
  const entry = (map[key] ??= { played: 0, won: 0 })
  entry.played++
  if (won) entry.won++
}
const rallyBucket = (length: number) => (length <= 3 ? "1-3" : length <= 6 ? "4-6" : length <= 9 ? "7-9" : "10+")

function count(line: ShotLine, outcome: string | undefined) {
  if (outcome === "winner") line.winners++
  else if (outcome === "unforced_error") line.unforcedErrors++
  else if (outcome === "forced_error") line.forcedErrors++
}

export function buildShotStats(points: ReadonlyArray<ShotPoint>, detailLevel?: string): ShotStats | null {
  if (!detailLevel || !SHOT_LEVELS.has(detailLevel)) return null
  const withShot = points.filter((p) => SHOT_KINDS.includes(p.lastShotType as ShotKind))
  const anyDetail = withShot.length > 0 || points.some((p) => p.servePlacement || p.shotDirection || p.atNet || p.courtPosition || p.customFields || (typeof p.serveSpeed === "number" && p.serveSpeed > 0))
  if (!anyDetail) return null

  const sides: Record<Side, SideShotStats> = { p1: emptySide(), p2: emptySide() }
  const recorded = {
    shots: withShot.length > 0, returns: false, acePlacements: false, servePlacements: false, directions: false, net: false,
    courtPositions: false, serveSpeeds: false, customServeSpeed: false, customReturnQuality: false, rallyLengths: false,
  }
  const rallyLengths: Record<string, Record<Side, number>> = {}
  // Placement of every serve, or only of aces (the shot-type level asks only for an ace's placement)
  recorded.servePlacements = points.some((p) => p.servePlacement && p.pointOutcome !== "ace")
  // Rally length is a filler (1–2) unless the custom statistics recorded it
  const customRallies = points.some((p) => typeof p.customFields?.rallyLength === "number")

  for (const p of points) {
    const outcome = p.pointOutcome
    const receiver = other(p.server)
    if (p.servePlacement) tally(sides[p.server].servePlacements, p.servePlacement, p.winner === p.server)
    if (p.courtPosition) {
      recorded.courtPositions = true
      tally(sides.p1.courtPositions, p.courtPosition, p.winner === "p1")
      tally(sides.p2.courtPositions, p.courtPosition, p.winner === "p2")
    }
    if (typeof p.serveSpeed === "number" && p.serveSpeed > 0) {
      recorded.serveSpeeds = true
      sides[p.server].serveSpeeds.push(p.serveSpeed)
    }
    if (p.customFields?.serveSpeed) {
      recorded.customServeSpeed = true
      tally(sides[p.server].customServeSpeed, p.customFields.serveSpeed, p.winner === p.server)
    }
    if (p.customFields?.returnQuality) {
      recorded.customReturnQuality = true
      tally(sides[receiver].customReturnQuality, p.customFields.returnQuality, p.winner === receiver)
    }
    if (customRallies && typeof p.customFields?.rallyLength === "number") {
      recorded.rallyLengths = true
      const bucket = (rallyLengths[rallyBucket(p.customFields.rallyLength)] ??= { p1: 0, p2: 0 })
      bucket[p.winner]++
    }
    if (outcome === "ace" && p.servePlacement) {
      const aces = sides[p.winner].acePlacements
      aces[p.servePlacement] = (aces[p.servePlacement] ?? 0) + 1
      recorded.acePlacements = true
    }
    if (p.atNet) {
      recorded.net = true
      const atNet: Side[] = p.atNet === "both" ? ["p1", "p2"] : p.atNet === "p1" || p.atNet === "p2" ? [p.atNet] : []
      for (const side of atNet) {
        sides[side].netPoints.played++
        if (p.winner === side) sides[side].netPoints.won++
      }
    }
    const kind = p.lastShotType as ShotKind
    if (!SHOT_KINDS.includes(kind)) continue
    if (outcome !== "winner" && outcome !== "unforced_error" && outcome !== "forced_error") continue
    const hitter: Side = p.lastShotPlayer ?? (outcome === "winner" ? p.winner : other(p.winner))
    const side = sides[hitter]
    const line = (side.byShot[kind] ??= emptyLine())
    count(line, outcome)
    if (p.winnerType === "return" && hitter !== p.server) {
      recorded.returns = true
      count(side.returns, outcome)
    }
    if (p.shotDirection) {
      recorded.directions = true
      const byDirection = (side.directions[kind] ??= {})
      count((byDirection[p.shotDirection] ??= emptyLine()), outcome)
    }
  }

  return { pointsWithShot: withShot.length, recorded, sides, rallyLengths }
}
