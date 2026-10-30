/**
 * Match insights: what the match overview, the live screen, the PDF report and the AI analysis
 * show, computed from the point log alone (the log is the source of truth for a match).
 *
 * Only fields recorded at every detail level are trusted: who won the point, who served, set and
 * game numbers and timestamps. Serve type and how the point ended are real from the "simple"
 * level up; at the "points" level they are placeholders, so `hasServeDetail` is false there and
 * screens hide those numbers. Shot type and rally length are never used: simple-level points
 * store fillers ("serve", 1–2 shots) in them.
 */

export type Side = 'p1' | 'p2'

export const otherSide = (side: Side): Side => (side === 'p1' ? 'p2' : 'p1')

/** The point fields the insights read; a stored PointDetail fits. */
export interface InsightPoint {
  winner: Side
  server: Side
  serveType?: string
  pointOutcome?: string
  setNumber?: number
  gameNumber?: number
  timestamp?: string
  isTiebreak?: boolean
}

/** The match format fields the insights read; a normalized MatchFormat fits. */
export interface InsightFormat {
  sets?: number
  gamesPerSet?: number
  tiebreakAt?: number
  tiebreak?: boolean
  finalSetTiebreak?: 'standard' | 'super' | 'none'
  finalSetTiebreakAt?: number
  noAd?: boolean
}

export interface SideTotals {
  points: number
  servePoints: number
  servePointsWon: number
  /** Points where the first serve went in */
  firstServes: number
  firstServePointsWon: number
  /** Points played on a second serve, double faults included */
  secondServes: number
  secondServePointsWon: number
  returnPoints: number
  returnPointsWon: number
  aces: number
  doubleFaults: number
  winners: number
  unforcedErrors: number
  forcedErrors: number
  gamesWon: number
  /** Finished service games outside tiebreaks */
  serviceGames: number
  serviceGamesHeld: number
  breaks: number
  breakPointsFaced: number
  breakPointsSaved: number
  breakPointChances: number
  breakPointsWon: number
  deuceGamesWon: number
  /** 30:30, deuce, break points and the closing points of a tiebreak */
  pressurePointsWon: number
  longestPointRun: number
  longestGameRun: number
  tiebreaksWon: number
}

export interface GameSummary {
  set: number
  /** Game number within its set, from 1 */
  game: number
  server: Side
  /** Null while the game is still being played (or was cut short by a retirement) */
  winner: Side | null
  tiebreak: boolean
  isBreak: boolean
  /** Who won each point, in order */
  points: Side[]
  /** Reached deuce (or the deciding point in no-ad) */
  deuce: boolean
  breakPointsFaced: number
  breakPointsSaved: number
  /** The game winner came back from two points down at 40 or worse, e.g. "0:40" in the winner's view */
  comebackFrom: string | null
  /** Games score in the set after this game, player one first */
  gamesAfter: [number, number]
  durationSec: number | null
  /** Index of the game's first and last point in the point log */
  firstPoint: number
  lastPoint: number
}

export interface SetSummary {
  set: number
  games: [number, number]
  points: [number, number]
  winner: Side | null
  /** Tiebreak points when the set ended in a tiebreak, player one first */
  tiebreakPoints: [number, number] | null
  /** The whole set was one match tiebreak (super tiebreak instead of a deciding set) */
  superTiebreak: boolean
  breaks: [number, number]
  durationSec: number | null
}

export type Moment =
  | { kind: 'firstBreak'; side: Side; set: number; gamesAfter: [number, number]; points: number; deuces: number; at: number }
  | { kind: 'comeback'; side: Side; role: 'hold' | 'break'; from: string; savedBreakPoints: number; set: number; gamesAfter: [number, number]; at: number }
  | { kind: 'gameRun'; side: Side; length: number; set: number; fromScore: [number, number]; at: number }
  | { kind: 'setComeback'; side: Side; set: number; from: [number, number]; games: [number, number]; at: number }
  | { kind: 'bagel'; side: Side; set: number; games: [number, number]; minutes: number | null; pointsWon: number; pointsTotal: number; at: number }
  | { kind: 'tiebreak'; side: Side; set: number; points: [number, number]; superTiebreak: boolean; at: number }

export type HeadlineFact =
  | { kind: 'setComeback' }
  | { kind: 'decidedInTiebreak'; superTiebreak: boolean }
  | { kind: 'noServeLost' }
  | { kind: 'gameRun'; count: number }
  | { kind: 'bagel' }
  | { kind: 'bigPoints'; pct: number }
  | { kind: 'pointsDominance'; pct: number }
  | { kind: 'tight'; pct: number }
  | { kind: 'breaks'; count: number }

export interface MatchInsights {
  hasPoints: boolean
  /** Serve type and point outcome are real (false at the "points" detail level) */
  hasServeDetail: boolean
  totals: Record<Side, SideTotals>
  /** Totals counted inside one set, keyed by set number */
  totalsBySet: Record<number, Record<Side, SideTotals>>
  games: GameSummary[]
  sets: SetSummary[]
  setsWon: [number, number]
  /** All sets needed were won (false for a retirement or a match still being played) */
  complete: boolean
  /** The winner, or whoever is ahead (sets, then games, then points) while unfinished */
  leader: Side | null
  /** Player one's lead in points after each point, starting at 0 before the first point */
  worm: number[]
  /** Point indexes (into worm, so after that many points) where a set ended */
  setEnds: number[]
  /** Point index and side of every break of serve */
  breakMarks: { at: number; side: Side }[]
  pressurePointsPlayed: number
  deuceGamesPlayed: number
  /** Points in a row the side who won the last point has won */
  currentRun: { side: Side; length: number } | null
  moments: Moment[]
  headline: HeadlineFact[]
  /** Typical seconds between points (median, pauses over 10 minutes left out) */
  medianSecondsBetweenPoints: number | null
  /** First to last point */
  playingTimeSec: number | null
  longestGame: GameSummary | null
}

interface Options {
  format?: InsightFormat
  detailLevel?: string
}

const SCORE_LABELS = ['0', '15', '30', '40']

const emptyTotals = (): SideTotals => ({
  points: 0, servePoints: 0, servePointsWon: 0, firstServes: 0, firstServePointsWon: 0, secondServes: 0,
  secondServePointsWon: 0, returnPoints: 0, returnPointsWon: 0, aces: 0, doubleFaults: 0, winners: 0,
  unforcedErrors: 0, forcedErrors: 0, gamesWon: 0, serviceGames: 0, serviceGamesHeld: 0, breaks: 0,
  breakPointsFaced: 0, breakPointsSaved: 0, breakPointChances: 0, breakPointsWon: 0, deuceGamesWon: 0,
  pressurePointsWon: 0, longestPointRun: 0, longestGameRun: 0, tiebreaksWon: 0,
})

const time = (point: InsightPoint | undefined) => {
  const parsed = Date.parse(point?.timestamp ?? '')
  return Number.isNaN(parsed) ? null : parsed
}

const span = (from: InsightPoint | undefined, to: InsightPoint | undefined) => {
  const a = time(from), b = time(to)
  return a !== null && b !== null && b >= a ? Math.round((b - a) / 1000) : null
}

const longestRun = (sides: Side[], side: Side) => {
  let best = 0, run = 0
  for (const s of sides) {
    run = s === side ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** Per-point context worked out while replaying the games */
interface PointContext {
  game: number // index into games
  breakPoint: boolean
  pressure: boolean
}

export function buildMatchInsights(points: ReadonlyArray<InsightPoint>, options: Options = {}): MatchInsights {
  const format = options.format ?? {}
  const noAd = format.noAd === true
  const gamesPerSet = format.gamesPerSet ?? 6
  const tiebreakAt = format.tiebreakAt ?? gamesPerSet
  const bestOf = format.sets ?? 3
  const setsToWin = Math.ceil(bestOf / 2)
  const superTarget = format.finalSetTiebreakAt ?? 10

  const games: GameSummary[] = []
  const contexts: PointContext[] = []
  const sets: SetSummary[] = []
  const setsWon: [number, number] = [0, 0]

  // Replay state
  let set: SetSummary | null = null
  let game: GameSummary | null = null
  let gamePoints = { p1: 0, p2: 0 }
  let target = 0 // tiebreak target points, 0 outside tiebreaks
  let worst: Record<Side, { diff: number; label: string }> = { p1: { diff: 0, label: '' }, p2: { diff: 0, label: '' } }

  const gameDone = (p: { p1: number; p2: number }, tbTarget: number) => {
    const hi = Math.max(p.p1, p.p2), lo = Math.min(p.p1, p.p2)
    if (tbTarget) return hi >= tbTarget && hi - lo >= 2
    return noAd ? hi >= 4 : hi >= 4 && hi - lo >= 2
  }

  const setDone = (s: SetSummary) => {
    const [a, b] = s.games
    if (s.superTiebreak) return a + b >= 1
    const hi = Math.max(a, b), lo = Math.min(a, b)
    if (s.tiebreakPoints) return true
    return hi >= gamesPerSet && hi - lo >= 2
  }

  const closeGame = (winner: Side | null) => {
    if (!game || !set) return
    game.winner = winner
    if (winner) {
      game.isBreak = !game.tiebreak && winner !== game.server
      const idx = winner === 'p1' ? 0 : 1
      set.games[idx]++
      if (game.tiebreak) set.tiebreakPoints = [gamePoints.p1, gamePoints.p2]
      if (game.isBreak) set.breaks[idx]++
      const trail = worst[winner]
      game.comebackFrom = !game.tiebreak && trail.diff >= 2 ? trail.label : null
    }
    game.gamesAfter = [set.games[0], set.games[1]]
  }

  /** `force`: the log moved on to the next set, so this one is over whoever leads */
  const closeSet = (force: boolean) => {
    if (!set || set.winner) return
    if (setDone(set) || (force && set.games[0] !== set.games[1])) {
      set.winner = set.games[0] > set.games[1] ? 'p1' : 'p2'
      setsWon[set.winner === 'p1' ? 0 : 1]++
    }
  }

  // Games and sets close when the log moves on (the scorer's numbering is the truth); only the
  // last game and set are judged by the rules, to tell a finished match from one still going.
  points.forEach((point, index) => {
    const setNo = point.setNumber ?? set?.set ?? 1
    let gameNo = point.gameNumber ?? game?.game ?? 1
    // Old points without a game number continue the open game until the rules say it is over
    if (point.gameNumber === undefined && game && game.set === setNo && gameDone(gamePoints, target)) gameNo = game.game + 1

    const newSet = !set || setNo !== set.set
    const newGame = newSet || !game || gameNo !== game.game

    if (newGame && game) closeGame(game.points[game.points.length - 1] ?? null)
    if (newSet) {
      closeSet(true)
      const decider = setsWon[0] === setsToWin - 1 && setsWon[1] === setsToWin - 1 && bestOf > 1
      set = {
        set: setNo, games: [0, 0], points: [0, 0], winner: null, tiebreakPoints: null,
        // A deciding set that opens with a tiebreak is a match tiebreak, whatever an old format says
        superTiebreak: decider && (format.finalSetTiebreak === 'super' || point.isTiebreak === true),
        breaks: [0, 0], durationSec: null,
      }
      sets.push(set)
    }
    if (newGame) {
      const s = set!
      const tied = s.games[0] === s.games[1] && s.games[0] === tiebreakAt && format.tiebreak !== false
      const tiebreak = s.superTiebreak || tied || point.isTiebreak === true
      target = tiebreak ? (s.superTiebreak ? superTarget : 7) : 0
      game = {
        set: setNo, game: gameNo, server: point.server, winner: null, tiebreak, isBreak: false, points: [],
        deuce: false, breakPointsFaced: 0, breakPointsSaved: 0, comebackFrom: null,
        gamesAfter: [s.games[0], s.games[1]], durationSec: null, firstPoint: index, lastPoint: index,
      }
      games.push(game)
      gamePoints = { p1: 0, p2: 0 }
      worst = { p1: { diff: 0, label: '' }, p2: { diff: 0, label: '' } }
    }

    const g = game!
    const s = set!
    const serverPts = gamePoints[g.server]
    const receiverPts = gamePoints[otherSide(g.server)]
    let breakPoint = false
    let pressure = false
    if (g.tiebreak) {
      pressure = Math.max(gamePoints.p1, gamePoints.p2) >= target - 1
    } else {
      breakPoint = receiverPts >= 3 && (receiverPts > serverPts || (noAd && receiverPts === serverPts))
      const deuce = serverPts >= 3 && receiverPts >= 3 && serverPts === receiverPts
      if (deuce) g.deuce = true
      pressure = breakPoint || deuce || (serverPts === 2 && receiverPts === 2)
      if (breakPoint) {
        g.breakPointsFaced++
        if (point.winner === g.server) g.breakPointsSaved++
      }
    }
    contexts.push({ game: games.length - 1, breakPoint, pressure })

    gamePoints[point.winner]++
    g.points.push(point.winner)
    g.lastPoint = index
    s.points[point.winner === 'p1' ? 0 : 1]++

    // Track how far behind each side has been while the other stood at 40 or better
    if (!g.tiebreak) {
      for (const side of ['p1', 'p2'] as Side[]) {
        const mine = gamePoints[side], theirs = gamePoints[otherSide(side)]
        if (theirs >= 3 && theirs - mine > worst[side].diff) {
          worst[side] = { diff: theirs - mine, label: `${SCORE_LABELS[mine]}:${SCORE_LABELS[theirs]}` }
        }
      }
    }
  })

  // The last game counts only if the rules say it is over; otherwise it is still being played
  // (or was cut short by a retirement)
  const lastGame = game as GameSummary | null
  if (lastGame && gameDone(gamePoints, target)) {
    closeGame(lastGame.points[lastGame.points.length - 1])
    closeSet(false)
  }

  // Durations
  for (const g of games) g.durationSec = span(points[g.firstPoint], points[g.lastPoint])
  for (const s of sets) {
    const inSet = games.filter((g) => g.set === s.set)
    if (inSet.length) s.durationSec = span(points[inSet[0].firstPoint], points[inSet[inSet.length - 1].lastPoint])
  }

  const hasServeDetail = options.detailLevel !== 'points'
  const totalsFor = (filter: (i: number) => boolean, gameFilter: (g: GameSummary) => boolean): Record<Side, SideTotals> => {
    const t = { p1: emptyTotals(), p2: emptyTotals() }
    const sequence: Side[] = []
    points.forEach((p, i) => {
      if (!filter(i)) return
      const winner = p.winner, loser = otherSide(winner)
      const server = p.server, receiver = otherSide(server)
      const ctx = contexts[i]
      sequence.push(winner)
      t[winner].points++
      t[server].servePoints++
      t[receiver].returnPoints++
      if (winner === server) t[server].servePointsWon++
      else t[receiver].returnPointsWon++
      const first = p.serveType !== 'second' && p.pointOutcome !== 'double_fault'
      if (first) {
        t[server].firstServes++
        if (winner === server) t[server].firstServePointsWon++
      } else {
        t[server].secondServes++
        if (winner === server) t[server].secondServePointsWon++
      }
      if (p.pointOutcome === 'ace') t[winner].aces++
      else if (p.pointOutcome === 'winner') t[winner].winners++
      else if (p.pointOutcome === 'double_fault') t[loser].doubleFaults++
      else if (p.pointOutcome === 'unforced_error') t[loser].unforcedErrors++
      else if (p.pointOutcome === 'forced_error') t[loser].forcedErrors++
      if (ctx?.breakPoint) {
        t[server].breakPointsFaced++
        t[receiver].breakPointChances++
        if (winner === server) t[server].breakPointsSaved++
        else t[receiver].breakPointsWon++
      }
      if (ctx?.pressure) t[winner].pressurePointsWon++
    })
    const chosen = games.filter(gameFilter)
    const gameWinners: Side[] = []
    for (const g of chosen) {
      if (!g.winner) continue
      gameWinners.push(g.winner)
      t[g.winner].gamesWon++
      if (g.tiebreak) {
        t[g.winner].tiebreaksWon++
        continue
      }
      t[g.server].serviceGames++
      if (g.winner === g.server) t[g.server].serviceGamesHeld++
      else t[g.winner].breaks++
      if (g.deuce) t[g.winner].deuceGamesWon++
    }
    for (const side of ['p1', 'p2'] as Side[]) {
      t[side].longestPointRun = longestRun(sequence, side)
      t[side].longestGameRun = longestRun(gameWinners, side)
    }
    return t
  }

  const totals = totalsFor(() => true, () => true)
  const totalsBySet: Record<number, Record<Side, SideTotals>> = {}
  for (const s of sets) {
    totalsBySet[s.set] = totalsFor((i) => games[contexts[i].game].set === s.set, (g) => g.set === s.set)
  }

  // Lead line and markers
  const worm = [0]
  points.forEach((p) => worm.push(worm[worm.length - 1] + (p.winner === 'p1' ? 1 : -1)))
  const setEnds = sets.filter((s) => s.winner).map((s) => {
    const last = games.filter((g) => g.set === s.set).pop()
    return last ? last.lastPoint + 1 : 0
  })
  const breakMarks = games.filter((g) => g.isBreak && g.winner).map((g) => ({ at: g.lastPoint + 1, side: g.winner as Side }))

  const complete = setsWon[0] >= setsToWin || setsWon[1] >= setsToWin
  const leader = leadingSide(setsWon, sets, totals)

  let currentRun: MatchInsights['currentRun'] = null
  if (points.length) {
    const side = points[points.length - 1].winner
    let length = 0
    for (let i = points.length - 1; i >= 0 && points[i].winner === side; i--) length++
    currentRun = { side, length }
  }

  const gaps: number[] = []
  for (let i = 1; i < points.length; i++) {
    const gap = span(points[i - 1], points[i])
    if (gap !== null && gap < 600) gaps.push(gap)
  }
  gaps.sort((a, b) => a - b)
  const medianSecondsBetweenPoints = gaps.length ? gaps[Math.floor((gaps.length - 1) / 2)] : null
  const playingTimeSec = points.length > 1 ? span(points[0], points[points.length - 1]) : null

  const finished = games.filter((g) => g.winner && !g.tiebreak)
  const longestGame = finished.reduce<GameSummary | null>((best, g) => (!best || g.points.length > best.points.length ? g : best), null)

  const pressurePointsPlayed = contexts.filter((c) => c.pressure).length
  const deuceGamesPlayed = games.filter((g) => g.deuce && g.winner).length

  const insights: MatchInsights = {
    hasPoints: points.length > 0,
    hasServeDetail,
    totals,
    totalsBySet,
    games,
    sets,
    setsWon,
    complete,
    leader,
    worm,
    setEnds,
    breakMarks,
    pressurePointsPlayed,
    deuceGamesPlayed,
    currentRun,
    moments: [],
    headline: [],
    medianSecondsBetweenPoints,
    playingTimeSec,
    longestGame: longestGame && longestGame.points.length >= 8 ? longestGame : null,
  }
  insights.moments = findMoments(insights, gamesPerSet)
  insights.headline = headlineFacts(insights, gamesPerSet)
  return insights
}

function leadingSide(setsWon: [number, number], sets: SetSummary[], totals: Record<Side, SideTotals>): Side | null {
  if (setsWon[0] !== setsWon[1]) return setsWon[0] > setsWon[1] ? 'p1' : 'p2'
  const open = sets[sets.length - 1]
  if (open && open.games[0] !== open.games[1]) return open.games[0] > open.games[1] ? 'p1' : 'p2'
  if (totals.p1.points !== totals.p2.points) return totals.p1.points > totals.p2.points ? 'p1' : 'p2'
  return null
}

/** The few moments worth naming, in match order: first break, comebacks, runs, bagels, tiebreaks */
function findMoments(insights: MatchInsights, gamesPerSet: number): Moment[] {
  const { games, sets } = insights
  const moments: Moment[] = []

  const firstBreak = games.find((g) => g.isBreak && g.winner)
  if (firstBreak) {
    const deuces = deuceCount(firstBreak.points, firstBreak.server)
    moments.push({ kind: 'firstBreak', side: firstBreak.winner!, set: firstBreak.set, gamesAfter: firstBreak.gamesAfter, points: firstBreak.points.length, deuces, at: firstBreak.lastPoint + 1 })
  }

  // Comebacks: the deepest two (most break points saved first, then the bigger deficit)
  const comebacks = games
    .filter((g) => g.comebackFrom && g.winner)
    .sort((a, b) => b.breakPointsSaved - a.breakPointsSaved || deficit(b.comebackFrom!) - deficit(a.comebackFrom!))
    .slice(0, 2)
  for (const g of comebacks) {
    moments.push({ kind: 'comeback', side: g.winner!, role: g.winner === g.server ? 'hold' : 'break', from: g.comebackFrom!, savedBreakPoints: g.breakPointsSaved, set: g.set, gamesAfter: g.gamesAfter, at: g.lastPoint + 1 })
  }

  // The longest run of games, when it is four or more
  let best: { side: Side; length: number; start: number } | null = null
  let run: { side: Side; length: number; start: number } | null = null
  games.forEach((g, i) => {
    if (!g.winner) return
    run = run && run.side === g.winner ? { ...run, length: run.length + 1 } : { side: g.winner, length: 1, start: i }
    if (!best || run.length > best.length) best = run
  })
  const longest = best as { side: Side; length: number; start: number } | null
  if (longest && longest.length >= 4) {
    const start = games[longest.start]
    const before: [number, number] = start.game === 1 ? [0, 0] : games[longest.start - 1].set === start.set ? games[longest.start - 1].gamesAfter : [0, 0]
    // Placed where the run began, so the list reads in match order
    moments.push({ kind: 'gameRun', side: longest.side, length: longest.length, set: start.set, fromScore: before, at: start.firstPoint })
  }

  for (const s of sets) {
    if (!s.winner) continue
    const inSet = games.filter((g) => g.set === s.set && g.winner)
    const last = inSet[inSet.length - 1]
    const at = last ? last.lastPoint + 1 : 0
    const idx = s.winner === 'p1' ? 0 : 1
    if (s.tiebreakPoints) {
      moments.push({ kind: 'tiebreak', side: s.winner, set: s.set, points: s.tiebreakPoints, superTiebreak: s.superTiebreak, at })
      continue
    }
    if (s.games[1 - idx] === 0 && s.games[idx] >= gamesPerSet) {
      moments.push({ kind: 'bagel', side: s.winner, set: s.set, games: s.games, minutes: s.durationSec === null ? null : Math.round(s.durationSec / 60), pointsWon: s.points[idx], pointsTotal: s.points[0] + s.points[1], at })
      continue
    }
    // Won the set from three or more games down
    let deepest: [number, number] | null = null
    for (const g of inSet) {
      const mine = g.gamesAfter[idx], theirs = g.gamesAfter[1 - idx]
      if (theirs - mine >= 3 && (!deepest || theirs - mine > deepest[1 - idx] - deepest[idx])) deepest = g.gamesAfter
    }
    if (deepest) moments.push({ kind: 'setComeback', side: s.winner, set: s.set, from: deepest, games: s.games, at })
  }

  return moments.sort((a, b) => a.at - b.at).slice(0, 6)
}

function deuceCount(points: Side[], server: Side) {
  let s = 0, r = 0, deuces = 0
  for (const p of points) {
    if (p === server) s++
    else r++
    if (s >= 3 && s === r) deuces++
  }
  return deuces
}

const deficit = (label: string) => {
  const [a, b] = label.split(':').map((x) => SCORE_LABELS.indexOf(x))
  return b - a
}

/** One or two facts that sum up how the match was won (or who is ahead), strongest first */
function headlineFacts(insights: MatchInsights, gamesPerSet: number): HeadlineFact[] {
  const side = insights.leader
  if (!side) return []
  const idx = side === 'p1' ? 0 : 1
  const t = insights.totals[side]
  const facts: HeadlineFact[] = []
  const totalPoints = insights.totals.p1.points + insights.totals.p2.points
  const share = totalPoints ? t.points / totalPoints : 0

  const finishedSets = insights.sets.filter((s) => s.winner)
  if (insights.complete && finishedSets.length >= 2 && finishedSets[0].winner !== side) facts.push({ kind: 'setComeback' })
  const lastSet = finishedSets[finishedSets.length - 1]
  if (insights.complete && lastSet?.tiebreakPoints && lastSet.winner === side && finishedSets.length > 1) {
    facts.push({ kind: 'decidedInTiebreak', superTiebreak: lastSet.superTiebreak })
  }
  if (t.serviceGames >= 3 && t.serviceGamesHeld === t.serviceGames) facts.push({ kind: 'noServeLost' })
  if (t.longestGameRun >= 5) facts.push({ kind: 'gameRun', count: t.longestGameRun })
  if (insights.sets.some((s) => s.winner === side && s.games[1 - idx] === 0 && s.games[idx] >= gamesPerSet)) facts.push({ kind: 'bagel' })
  if (insights.pressurePointsPlayed >= 8) {
    const pct = Math.round((100 * t.pressurePointsWon) / insights.pressurePointsPlayed)
    if (pct >= 65) facts.push({ kind: 'bigPoints', pct })
  }
  if (share >= 0.6) facts.push({ kind: 'pointsDominance', pct: Math.round(share * 100) })
  else if (totalPoints >= 20 && Math.abs(share - 0.5) <= 0.03) facts.push({ kind: 'tight', pct: Math.round(share * 100) })
  if (t.breaks >= 3) facts.push({ kind: 'breaks', count: t.breaks })
  return facts.slice(0, 2)
}

/** Share as a whole percentage, or null when there is nothing to divide by */
export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((100 * part) / whole) : null
}
