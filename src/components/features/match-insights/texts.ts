import type { HeadlineFact, MatchInsights, Moment, Side } from "@/lib/utils/match-insights"
import { percent } from "@/lib/utils/match-insights"
import { formatSeconds } from "./labels"

/** The insights namespace's translate function, loosely typed so texts can be built outside components (PDF) */
export type Translate = (key: string, values?: Record<string, string | number>) => string

const score = (pair: [number, number]) => `${pair[0]}:${pair[1]}`

const capitalize = (text: string) => (text ? text[0].toLocaleUpperCase() + text.slice(1) : text)

function factText(fact: HeadlineFact, t: Translate): string {
  switch (fact.kind) {
    case "setComeback": return t("factSetComeback")
    case "decidedInTiebreak": return t(fact.superTiebreak ? "factSuperTiebreak" : "factTiebreak")
    case "noServeLost": return t("factNoServeLost")
    case "gameRun": return t("factGameRun", { count: fact.count })
    case "bagel": return t("factBagel")
    case "bigPoints": return t("factBigPoints", { pct: fact.pct })
    case "pointsDominance": return t("factPointsDominance", { pct: fact.pct })
    case "tight": return t("factTight")
    case "breaks": return t("factBreaks", { count: fact.count })
  }
}

/**
 * "Bez ztráty podání, 10 her v řadě" — or who won / leads when nothing stands out. `winner` is the
 * stored result: after a retirement it can differ from whoever was ahead, and then it wins the say.
 */
export function headlineTitle(insights: MatchInsights, names: Record<Side, string>, t: Translate, winner?: Side | null): string {
  if (winner) {
    if (insights.leader === winner && insights.headline.length) return capitalize(insights.headline.map((fact) => factText(fact, t)).join(", "))
    return t("headlineWins", { name: names[winner] })
  }
  if (!insights.leader) return t("headlineEven")
  if (!insights.headline.length) {
    return t(insights.complete ? "headlineWins" : "headlineLeads", { name: names[insights.leader] })
  }
  return capitalize(insights.headline.map((fact) => factText(fact, t)).join(", "))
}

/** "Sofie: 7 z 7 udržených podání · 4 ze 4 zachráněných brejkbolů" from the focus player's side */
export function headlineDetail(insights: MatchInsights, focus: Side, names: Record<Side, string>, t: Translate, duration?: string): string {
  const total = insights.totals[focus]
  const parts: string[] = []
  if (total.serviceGames > 0) parts.push(t("detailHolds", { held: total.serviceGamesHeld, total: total.serviceGames }))
  if (total.breakPointsFaced > 0) parts.push(t("detailBreakPointsSaved", { saved: total.breakPointsSaved, faced: total.breakPointsFaced }))
  if (total.breakPointChances > 0) parts.push(t("detailBreakPointsWon", { won: total.breakPointsWon, chances: total.breakPointChances }))
  if (duration) parts.push(t("detailDuration", { duration }))
  return parts.length ? `${names[focus]}: ${parts.join(" · ")}` : ""
}

/** Title, one-line story and a short "when" label for a key moment */
export function momentText(moment: Moment, names: Record<Side, string>, t: Translate, locale: string): { title: string; text: string; when: string } {
  const name = names[moment.side]
  switch (moment.kind) {
    case "firstBreak":
      return {
        when: t("momentWhen", { set: moment.set, score: score(moment.gamesAfter) }),
        title: t("momentFirstBreak"),
        text: t("momentFirstBreakText", { name, points: moment.points, deuces: moment.deuces, score: score(moment.gamesAfter) }),
      }
    case "comeback":
      return {
        when: t("momentWhen", { set: moment.set, score: score(moment.gamesAfter) }),
        title: t(moment.role === "hold" ? "momentComebackHold" : "momentComebackBreak", { from: moment.from }),
        text: moment.role === "hold"
          ? t("momentComebackHoldText", { name, saved: moment.savedBreakPoints, score: score(moment.gamesAfter) })
          : t("momentComebackBreakText", { name, score: score(moment.gamesAfter) }),
      }
    case "gameRun":
      return {
        when: t("momentWhen", { set: moment.set, score: score(moment.fromScore) }),
        title: t("momentGameRun", { count: moment.length }),
        text: t("momentGameRunText", { name, score: score(moment.fromScore), set: moment.set }),
      }
    case "bagel":
      return {
        when: t("momentSet", { set: moment.set }),
        title: t("momentBagel", { set: moment.set }),
        text: moment.minutes
          ? t("momentBagelText", { name, won: moment.pointsWon, total: moment.pointsTotal, duration: formatSeconds(moment.minutes * 60, locale) })
          : t("momentBagelTextNoTime", { name, won: moment.pointsWon, total: moment.pointsTotal }),
      }
    case "setComeback":
      return {
        when: t("momentSet", { set: moment.set }),
        title: t("momentSetComeback", { set: moment.set }),
        text: t("momentSetComebackText", { name, from: score(moment.from), games: score(moment.games) }),
      }
    case "tiebreak":
      return {
        when: t("momentSet", { set: moment.set }),
        title: moment.superTiebreak ? t("momentSuperTiebreak") : t("momentTiebreak", { set: moment.set }),
        text: t("momentTiebreakText", { name, score: score(moment.points) }),
      }
  }
}

/** How a side's points came: its own winners and aces, and the other side's errors */
export function pointSources(insights: MatchInsights, side: Side) {
  const mine = insights.totals[side]
  const theirs = insights.totals[side === "p1" ? "p2" : "p1"]
  const own = mine.winners + mine.aces
  const unforced = theirs.unforcedErrors
  const forced = theirs.forcedErrors
  const doubleFaults = theirs.doubleFaults
  return { total: mine.points, own, unforced, forced, doubleFaults, errors: unforced + forced + doubleFaults }
}

/** Share of pressure points won next to the share of all other points, for the focus side */
export function pressureShares(insights: MatchInsights, side: Side) {
  const played = insights.pressurePointsPlayed
  const won = insights.totals[side].pressurePointsWon
  const totalPoints = insights.totals.p1.points + insights.totals.p2.points
  return {
    pressure: percent(won, played),
    rest: percent(insights.totals[side].points - won, totalPoints - played),
  }
}
