import type { Player } from "@/lib/types"
import type { SetSummary, Side } from "@/lib/utils/match-insights"

/** "6:2"; a match tiebreak shows its points ("10:7"), as the scoreboard does */
export function setScoreLabel(set: Pick<SetSummary, "games" | "superTiebreak" | "tiebreakPoints">): string {
  const [a, b] = set.superTiebreak && set.tiebreakPoints ? set.tiebreakPoints : set.games
  return `${a}:${b}`
}

/** "5 min 14 s", "48 s", "1 h 3 min" in the page language */
export function formatSeconds(seconds: number, locale: string): string {
  const unit = (value: number, name: "second" | "minute" | "hour") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(value)
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return unit(total, "second")
  const minutes = Math.floor(total / 60)
  if (minutes < 60) {
    const rest = total % 60
    return rest ? `${unit(minutes, "minute")} ${unit(rest, "second")}` : unit(minutes, "minute")
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${unit(hours, "hour")} ${unit(rest, "minute")}` : unit(hours, "hour")
}

/** Short names for stat legends: the first name in singles, "Anna / Eva" in doubles */
export function shortSideNames(players: { p1?: Player; p2?: Player; p3?: Player; p4?: Player }, fallback: Record<Side, string>): Record<Side, string> {
  const first = (p?: Player) => p?.firstName?.trim() || p?.lastName?.trim() || ""
  const side = (a?: Player, b?: Player, otherwise = "") => {
    const names = [first(a), first(b)].filter(Boolean)
    return names.length ? names.join(" / ") : otherwise
  }
  return { p1: side(players.p1, players.p3, fallback.p1), p2: side(players.p2, players.p4, fallback.p2) }
}

/** The side the overview is told from: the main player's when they play, else the winner's, else player one's */
export function focusSide(players: { p1?: Player; p2?: Player; p3?: Player; p4?: Player }, leader: Side | null): Side {
  if (players.p1?.isMainPlayer || players.p3?.isMainPlayer) return "p1"
  if (players.p2?.isMainPlayer || players.p4?.isMainPlayer) return "p2"
  return leader ?? "p1"
}

export const sideText: Record<Side, string> = {
  p1: "text-blue-600 dark:text-blue-400",
  p2: "text-red-600 dark:text-red-400",
}
