import { percent, type MatchInsights, type Side, type SideTotals } from "@/lib/utils/match-insights"
import { buildShotStats, type ShotLine, type ShotPoint, type ShotStats, type SideShotStats } from "@/lib/utils/shot-stats"

export interface AnalysisPlayer {
  name: string
  yearOfBirth?: number
  rating?: string
  club?: string
}

export interface AnalysisInput {
  locale: string
  insights: MatchInsights
  /** One entry per side; a doubles team is one entry with both names */
  players: Record<Side, AnalysisPlayer>
  /** Whose coach the analysis is written for */
  focus: Side
  /** The stored winner; after a retirement it can be the side that was behind */
  winner?: Side | null
  matchDate?: string
  tournamentName?: string
  durationMinutes?: number | null
  endReason?: string | null
  doubles?: boolean
  /** The raw point log: every field a point recorded goes into the analysis */
  points?: AnalysisPoint[]
  detailLevel?: string
  noAd?: boolean
}

/** A logged point with everything the analysis reads (a stored PointDetail fits) */
export type AnalysisPoint = ShotPoint & {
  setNumber?: number
  gameNumber?: number
  serveType?: string
}

export interface MatchAnalysis {
  summary: string
  strengths: string[]
  improvements: string[]
  trainingTips: string[]
}

/** An analysis as stored and shown: what the model wrote, which model, and when */
export interface SavedAnalysis {
  analysis: MatchAnalysis
  model: string
  createdAt: string
}

/** One stored analysis document: a finished analysis, one being written, or one that failed */
export interface StoredAnalysis {
  content: string
  model: string
  status?: string | null
  error?: string | null
  $createdAt: string
}

export type AnalysisJob =
  | { status: "idle" }
  | { status: "pending"; startedAt: string }
  | { status: "failed"; reason: string }

/** An analysis being written longer than this has died with its server function */
export const ANALYSIS_STALE_MS = 5 * 60_000

/**
 * What the AI card shows: the newest finished analysis (kept while a new one is written or after
 * a later attempt failed) and the state of the newest attempt. Documents come newest first.
 */
export function analysisState(docs: StoredAnalysis[], now = Date.now()): { saved: SavedAnalysis | null; job: AnalysisJob } {
  const ready = docs.find((doc) => (doc.status ?? "ready") === "ready" && parseAnalysis(doc.content))
  const saved = ready ? { analysis: parseAnalysis(ready.content)!, model: ready.model, createdAt: ready.$createdAt } : null
  const latest = docs[0]
  if (!latest || latest === ready) return { saved, job: { status: "idle" } }
  if (latest.status === "pending") {
    return now - Date.parse(latest.$createdAt) < ANALYSIS_STALE_MS
      ? { saved, job: { status: "pending", startedAt: latest.$createdAt } }
      : { saved, job: { status: "failed", reason: "timeout" } }
  }
  if (latest.status === "failed") return { saved, job: { status: "failed", reason: latest.error || "failed" } }
  return { saved, job: { status: "idle" } }
}

/** Gemini structured output: the answer must be exactly this shape */
export const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "4–6 sentences about how the match went and why" },
    strengths: { type: "ARRAY", items: { type: "STRING" }, description: "3–4 things that worked, each with numbers from the data (and the shot when recorded)" },
    improvements: { type: "ARRAY", items: { type: "STRING" }, description: "2–3 things to work on, each tied to numbers from the data (and the shot when recorded)" },
    trainingTips: { type: "ARRAY", items: { type: "STRING" }, description: "2–3 concrete drills for the next training, aimed at the weakest areas in the data" },
  },
  required: ["summary", "strengths", "improvements", "trainingTips"],
  propertyOrdering: ["summary", "strengths", "improvements", "trainingTips"],
}

export function analysisSystemPrompt(locale: string): string {
  const language = locale === "cs"
    ? "Czech (standard Czech with Czech tennis words: podání, return, brejk, brejkbol, shoda, forhend, bekhend, volej, smeč, kraťas, lob, vítězný úder, nevynucená chyba; a game is always \"hra\" – never \"gem\", \"gam\" or \"game\")"
    : "English"
  return [
    "You are an experienced junior tennis coach writing a post-match analysis for the parents and coach of one player.",
    `Write in ${language}.`,
    "The data says under \"recorded\" exactly what was tracked in this match and under \"notRecorded\" what was not. Use everything that was recorded and nothing else: never guess about anything listed as not recorded.",
    "When \"shotStats\" is present, analyse the shots explicitly: which shot (forehand, backhand, volley, overhead, drop shot, lob) produced winners, which leaked unforced or forced errors, the forehand against the backhand, how returns ended, where aces and serves landed, directions and net play when given. Compare the focus player with the opponent.",
    "Use \"breakPoints\" to say how the big points were won or lost, with the shot when it is known, and \"setStats\" to say how the match changed from set to set.",
    "The statistics are already counted: quote those numbers rather than recounting from the point list. The point list is for patterns and context.",
    "Be specific, honest and encouraging; the players are children, so no harsh language.",
    "Write about the focus player; mention the opponent only for context. Scores in the data are written focus player first.",
    "match.type says singles or doubles: in singles never call the player a team or a pair.",
    "Training tips must be concrete drills (what, how many repetitions, what to focus on) aimed at the weakest areas the numbers show.",
    "Keep it compact: the summary 4–6 sentences, every list item one or two sentences.",
  ].join("\n")
}

const pct = (part: number, whole: number) => {
  const value = percent(part, whole)
  return value === null ? null : `${value}%`
}

function sideStats(t: SideTotals, hasServeDetail: boolean) {
  return {
    pointsWon: t.points,
    gamesWon: t.gamesWon,
    servicePointsWon: pct(t.servePointsWon, t.servePoints),
    returnPointsWon: pct(t.returnPointsWon, t.returnPoints),
    serviceGamesHeld: `${t.serviceGamesHeld}/${t.serviceGames}`,
    breaks: t.breaks,
    breakPointsSaved: `${t.breakPointsSaved}/${t.breakPointsFaced}`,
    breakPointsConverted: `${t.breakPointsWon}/${t.breakPointChances}`,
    deuceGamesWon: t.deuceGamesWon,
    pressurePointsWon: t.pressurePointsWon,
    longestRunOfPoints: t.longestPointRun,
    longestRunOfGames: t.longestGameRun,
    tiebreaksWon: t.tiebreaksWon || undefined,
    ...(hasServeDetail ? {
      firstServeIn: pct(t.firstServes, t.servePoints),
      firstServePointsWon: pct(t.firstServePointsWon, t.firstServes),
      secondServePointsWon: pct(t.secondServePointsWon, t.secondServes),
      aces: t.aces,
      doubleFaults: t.doubleFaults,
      winners: t.winners,
      unforcedErrors: t.unforcedErrors,
      forcedErrors: t.forcedErrors,
    } : {}),
  }
}

const SHOT_NAMES: Record<string, string> = { forehand: "forehand", backhand: "backhand", volley: "volley", overhead: "overhead", drop_shot: "drop shot", lob: "lob" }
const OUTCOME_NAMES: Record<string, string> = { winner: "winner", ace: "ace", unforced_error: "unforced error", forced_error: "forced error", double_fault: "double fault" }

/** A side's shot statistics in plain names, leaving out everything that was not recorded */
function shotSummary(side: SideShotStats, recorded: ShotStats["recorded"]) {
  const lines = (byKey: Record<string, ShotLine>) => Object.fromEntries(Object.entries(byKey).map(([k, v]) => [SHOT_NAMES[k] ?? k, v]))
  const won = (map: Record<string, { played: number; won: number }>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, `${v.won}/${v.played} won`]))
  const speeds = side.serveSpeeds
  return {
    pointEndingShots: recorded.shots ? lines(side.byShot as Record<string, ShotLine>) : undefined,
    returnsThatEndedThePoint: recorded.returns ? side.returns : undefined,
    acesByPlacement: recorded.acePlacements && Object.keys(side.acePlacements).length ? side.acePlacements : undefined,
    servesByPlacement: recorded.servePlacements && Object.keys(side.servePlacements).length ? won(side.servePlacements) : undefined,
    shotDirections: recorded.directions ? Object.fromEntries(Object.entries(side.directions).map(([k, v]) => [SHOT_NAMES[k] ?? k, v])) : undefined,
    netPoints: recorded.net ? `${side.netPoints.won}/${side.netPoints.played} won` : undefined,
    pointsByCourtPosition: recorded.courtPositions ? won(side.courtPositions) : undefined,
    serveSpeedKmh: recorded.serveSpeeds && speeds.length ? { average: Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length), fastest: Math.max(...speeds), measured: speeds.length } : undefined,
    serveSpeedClass: recorded.customServeSpeed && Object.keys(side.customServeSpeed).length ? won(side.customServeSpeed) : undefined,
    returnQuality: recorded.customReturnQuality && Object.keys(side.customReturnQuality).length ? won(side.customReturnQuality) : undefined,
  }
}

/** What was and was not tracked in this match, in words the model can follow */
function recordedLists(hasServeDetail: boolean, shots: ShotStats | null) {
  const recorded = ["who won each point and who served", "the score after every point and game", "time of every point"]
  const notRecorded: string[] = []
  if (hasServeDetail) recorded.push("first or second serve", "how each point ended: winner, ace, unforced error, forced error, double fault")
  else notRecorded.push("first or second serve", "how points ended")
  const r = shots?.recorded
  ;(r?.shots ? recorded : notRecorded).push("the shot that ended each point (forehand, backhand, volley, overhead, drop shot, lob) and who hit it")
  ;(r?.returns ? recorded : notRecorded).push("whether the point-ending shot was a return")
  if (r?.servePlacements) recorded.push("where every serve landed")
  else if (r?.acePlacements) { recorded.push("where aces landed"); notRecorded.push("where other serves landed") }
  else notRecorded.push("where serves landed")
  ;(r?.directions ? recorded : notRecorded).push("the direction of the point-ending shot")
  ;(r?.net ? recorded : notRecorded).push("who was at the net")
  if (r?.courtPositions) recorded.push("court position of the point")
  if (r?.serveSpeeds) recorded.push("measured serve speed")
  if (r?.customServeSpeed) recorded.push("serve speed class (slow, medium, fast)")
  if (r?.customReturnQuality) recorded.push("return quality (defensive, neutral, offensive)")
  ;(r?.rallyLengths ? recorded : notRecorded).push("rally length")
  return { recorded, notRecorded }
}

/** The match as compact JSON, told from the focus player's side, with every statistic the match recorded */
export function analysisPrompt(input: AnalysisInput): string {
  const { insights, players, focus } = input
  const other: Side = focus === "p1" ? "p2" : "p1"
  const pair = (score: [number, number]) => (focus === "p1" ? `${score[0]}:${score[1]}` : `${score[1]}:${score[0]}`)
  const who = (side: Side | null | undefined) => (side ? players[side].name : null)
  const fo = (side: Side | null | undefined) => (side ? (side === focus ? "F" : "O") : undefined)
  const decided = input.winner ?? (insights.complete ? insights.leader : null)
  const resultFor = decided
    ? `${decided === focus ? "won" : "lost"}${insights.complete ? "" : " (the match ended early)"}`
    : input.endReason ? "match ended early" : "in progress"
  const points = input.points ?? []
  const shots = buildShotStats(points, input.detailLevel)
  const { recorded, notRecorded } = recordedLists(insights.hasServeDetail, shots)
  const realShot = (p: AnalysisPoint) => (shots?.recorded.shots && p.lastShotType && SHOT_NAMES[p.lastShotType] ? p.lastShotType : undefined)

  // How a point ended, in words: "unforced error (backhand, return) by Klaudie Davidová"
  const how = (p: AnalysisPoint) => {
    if (!insights.hasServeDetail || !p.pointOutcome || !OUTCOME_NAMES[p.pointOutcome]) return `won by ${who(p.winner)}`
    const byWinner = p.pointOutcome === "winner" || p.pointOutcome === "ace"
    const hitter: Side = p.lastShotPlayer ?? (byWinner ? p.winner : p.winner === "p1" ? "p2" : "p1")
    const shot = realShot(p)
    const extra = [shot ? SHOT_NAMES[shot] : null, p.winnerType === "return" && shot ? "return" : null, p.servePlacement ? `serve ${p.servePlacement}` : null, p.shotDirection ? p.shotDirection : null].filter(Boolean).join(", ")
    return `${OUTCOME_NAMES[p.pointOutcome]}${extra ? ` (${extra})` : ""} by ${who(hitter)}`
  }

  // Every break point: the score, who served, and how it ended
  const noAd = input.noAd === true
  const breakPoints: { set: number; game: number; server: string | null; score: string; won: boolean; how: string }[] = []
  for (const g of insights.games) {
    if (g.tiebreak) continue
    let s = 0, r = 0
    g.points.forEach((winner, i) => {
      const isBreakPoint = r >= 3 && (r > s || (noAd && r === s))
      const point = points[g.firstPoint + i]
      if (isBreakPoint && point) {
        const label = (n: number) => (["0", "15", "30", "40"][n] ?? "Ad")
        // From deuce on the receiver has the advantage (or it is the no-ad deciding point at 40:40)
        const serverScore = s >= 3 && r >= 3 ? "40" : label(s)
        const receiverScore = s >= 3 && r >= 3 ? (r > s ? "Ad" : "40") : label(r)
        const score = g.server === focus ? `${serverScore}:${receiverScore}` : `${receiverScore}:${serverScore}`
        breakPoints.push({ set: g.set, game: g.game, server: who(g.server), score, won: winner === focus, how: how(point) })
      }
      if (winner === g.server) s++
      else r++
    })
  }

  const data = {
    match: {
      date: input.matchDate,
      tournament: input.tournamentName,
      type: input.doubles ? "doubles" : "singles",
      detailLevel: input.detailLevel,
      result: resultFor,
      endReason: input.endReason ?? undefined,
      sets: insights.sets.map((s) => ({
        set: s.set,
        score: s.superTiebreak && s.tiebreakPoints ? `match tiebreak ${pair(s.tiebreakPoints)}` : pair(s.games),
        tiebreak: s.tiebreakPoints && !s.superTiebreak ? pair(s.tiebreakPoints) : undefined,
        minutes: s.durationSec ? Math.round(s.durationSec / 60) : undefined,
        breaks: pair(s.breaks),
      })),
      durationMinutes: input.durationMinutes ?? undefined,
      typicalSecondsBetweenPoints: insights.medianSecondsBetweenPoints ?? undefined,
      pressurePointsPlayed: insights.pressurePointsPlayed,
      deuceGamesPlayed: insights.deuceGamesPlayed,
    },
    recorded,
    notRecorded,
    focusPlayer: players[focus],
    opponent: players[other],
    focusPlayerStats: sideStats(insights.totals[focus], insights.hasServeDetail),
    opponentStats: sideStats(insights.totals[other], insights.hasServeDetail),
    shotStats: shots ? {
      pointsWithRecordedShot: shots.pointsWithShot,
      focusPlayer: shotSummary(shots.sides[focus], shots.recorded),
      opponent: shotSummary(shots.sides[other], shots.recorded),
      pointsWonByRallyLength: shots.recorded.rallyLengths
        ? Object.fromEntries(Object.entries(shots.rallyLengths).map(([bucket, wins]) => [bucket, pair([wins.p1, wins.p2])]))
        : undefined,
    } : undefined,
    setStats: insights.sets.map((s) => {
      const t = insights.totalsBySet[s.set]
      return t ? { set: s.set, focusPlayer: sideStats(t[focus], insights.hasServeDetail), opponent: sideStats(t[other], insights.hasServeDetail) } : null
    }).filter(Boolean),
    breakPoints,
    keyMoments: insights.moments.map((m) => ({ ...m, side: who(m.side) })),
    games: insights.games.map((g) => ({
      set: g.set,
      game: g.game,
      server: who(g.server),
      winner: who(g.winner),
      scoreAfter: pair(g.gamesAfter),
      tiebreak: g.tiebreak || undefined,
      points: g.points.map((p) => fo(p)).join(""),
      breakPointsFaced: g.breakPointsFaced || undefined,
      comebackFrom: g.comebackFrom ?? undefined,
    })),
    // Every point with whatever was recorded about it (W = winner of the point, F/O as above)
    points: points.length && insights.hasServeDetail ? points.map((p, i) => ({
      n: i + 1,
      set: p.setNumber,
      game: p.gameNumber,
      server: fo(p.server),
      w: fo(p.winner),
      serve: p.serveType === "second" ? 2 : 1,
      end: p.pointOutcome ? OUTCOME_NAMES[p.pointOutcome] ?? p.pointOutcome : undefined,
      shot: realShot(p) ? SHOT_NAMES[realShot(p)!] : undefined,
      by: realShot(p) ? fo(p.lastShotPlayer ?? (p.pointOutcome === "winner" ? p.winner : p.winner === "p1" ? "p2" : "p1")) : undefined,
      return: p.winnerType === "return" && realShot(p) ? true : undefined,
      servePlacement: p.servePlacement,
      direction: p.shotDirection,
      atNet: p.atNet ? (p.atNet === "both" ? "both" : fo(p.atNet as Side)) : undefined,
      position: p.courtPosition,
      serveKmh: typeof p.serveSpeed === "number" && p.serveSpeed > 0 ? p.serveSpeed : undefined,
      serveSpeedClass: p.customFields?.serveSpeed,
      returnQuality: p.customFields?.returnQuality,
      rally: shots?.recorded.rallyLengths ? p.customFields?.rallyLength : undefined,
    })) : undefined,
  }
  return [
    "Match data (JSON). F = the focus player, O = the opponent (in \"points\" strings and the point list).",
    JSON.stringify(data),
  ].join("\n")
}

/** The model's JSON answer, checked and trimmed; null when it is not usable */
export function parseAnalysis(text: string): MatchAnalysis | null {
  try {
    const raw = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""))
    const list = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim()).slice(0, 5) : [])
    const analysis: MatchAnalysis = {
      summary: typeof raw?.summary === "string" ? raw.summary.trim() : "",
      strengths: list(raw?.strengths),
      improvements: list(raw?.improvements),
      trainingTips: list(raw?.trainingTips),
    }
    return analysis.summary ? analysis : null
  } catch {
    return null
  }
}
