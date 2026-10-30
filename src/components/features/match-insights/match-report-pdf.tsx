import { Circle, Defs, Document, Font, Line, LinearGradient, Page, Path, Polygon, Polyline, Rect, Stop, StyleSheet, Svg, Text, View } from "@react-pdf/renderer"
import type { ReactNode } from "react"
import type { SavedAnalysis } from "@/lib/ai/match-analysis"
import { percent, type MatchInsights, type Side, type SideTotals } from "@/lib/utils/match-insights"
import { formatSeconds, setScoreLabel } from "./labels"
import { headlineDetail, headlineTitle, momentText, pointSources, pressureShares, type Translate } from "./texts"

/**
 * The match report as a PDF (react-pdf), in the app's look: a dark cover with the score, the key
 * numbers and how the match went; then every statistic by set, the saved AI analysis on its own
 * page, and every game. Loaded only when someone exports, so it never weighs on the match page.
 */

let fontsReady = false
export function registerPdfFonts(origin: string) {
  if (fontsReady) return
  // Inter with every Czech letter (ř, ů, ě…): PDF's built-in fonts cannot show them
  Font.register({
    family: "Inter",
    fonts: [
      { src: `${origin}/fonts/pdf/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${origin}/fonts/pdf/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${origin}/fonts/pdf/Inter-ExtraBold.ttf`, fontWeight: 800 },
    ],
  })
  // Keep words whole; the default hyphenation is English and splits Czech words badly
  Font.registerHyphenationCallback((word) => [word])
  fontsReady = true
}

// The app's dark theme and its lime brand colour; blue and red stay the players' colours
const NIGHT = "#0d120e"
const NIGHT_LINE = "#25302a"
const COURT_LINE = "#1c2520"
const NIGHT_TEXT = "#eef3e6"
const NIGHT_MUTED = "#98a592"
const LIME = "#cbf564"
const LIME_DARK = "#4d7c0f"
const INK = "#121812"
const MUTED = "#5b6656"
const FAINT = "#8a9684"
const LINE = "#e6e9df"
const SOFT = "#f5f7f0"
const BLUE = "#2563eb"
const BLUE_SOFT = "#dbeafe"
const RED = "#dc2626"
const RED_SOFT = "#fee2e2"
const AMBER = "#b45309"
const AMBER_SOFT = "#fef3c7"
const color = (s: Side) => (s === "p1" ? BLUE : RED)
const soft = (s: Side) => (s === "p1" ? BLUE_SOFT : RED_SOFT)

const PAGE_X = 36

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, color: INK, paddingBottom: 40, backgroundColor: "#ffffff" },
  inner: { paddingHorizontal: PAGE_X },
  eyebrow: { fontSize: 7, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: LIME_DARK },
  sectionTitle: { fontSize: 11.5, fontWeight: 800, color: INK },
  label: { fontSize: 6.6, letterSpacing: 0.9, textTransform: "uppercase", color: MUTED, fontWeight: 600 },
  sub: { fontSize: 8.5, color: MUTED, lineHeight: 1.45 },
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 12, backgroundColor: "#ffffff" },
  footer: { position: "absolute", bottom: 16, left: PAGE_X, right: PAGE_X, flexDirection: "row", justifyContent: "space-between", alignItems: "center", fontSize: 7.5, color: FAINT },
})

export interface MatchReportProps {
  insights: MatchInsights
  t: Translate
  locale: string
  fullNames: Record<Side, string>
  shortNames: Record<Side, string>
  /** "2015 · 45 BH • 39 CŽ · SK Hamr" per side */
  metaLines: Record<Side, string>
  focus: Side
  /** The stored winner (a retirement can leave the loser ahead on the court) */
  winner?: Side | null
  /** The official score as stored; the open set last while playing */
  scoreboard: { sets: [number, number][]; current?: [number, number] }
  completed: boolean
  dateLabel: string
  tournamentName?: string
  durationText?: string
  generatedLabel: string
  analysis?: SavedAnalysis | null
}

/** A tennis ball: the brand mark in the cover and the footer */
function BallMark({ size = 14, fill = LIME, seam = NIGHT }: { size?: number; fill?: string; seam?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={7.5} fill={fill} />
      <Path d="M3.2 2.6 Q8 8 3.2 13.4" stroke={seam} strokeWidth={1.2} fill="none" />
      <Path d="M12.8 2.6 Q8 8 12.8 13.4" stroke={seam} strokeWidth={1.2} fill="none" />
    </Svg>
  )
}

/** Faint court lines behind the cover's score */
function CourtLines({ width, height }: { width: number; height: number }) {
  const w = width, h = height
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", right: 0, top: 0 }}>
      <Rect x={w * 0.18} y={h * 0.12} width={w * 0.78} height={h * 0.76} stroke={COURT_LINE} strokeWidth={1.2} fill="none" />
      <Line x1={w * 0.18} x2={w * 0.96} y1={h * 0.24} y2={h * 0.24} stroke={COURT_LINE} strokeWidth={1} />
      <Line x1={w * 0.18} x2={w * 0.96} y1={h * 0.76} y2={h * 0.76} stroke={COURT_LINE} strokeWidth={1} />
      <Line x1={w * 0.42} x2={w * 0.42} y1={h * 0.24} y2={h * 0.76} stroke={COURT_LINE} strokeWidth={1} />
      <Line x1={w * 0.42} x2={w * 0.96} y1={h * 0.5} y2={h * 0.5} stroke={COURT_LINE} strokeWidth={1} />
      <Line x1={w * 0.96} x2={w * 0.96} y1={h * 0.06} y2={h * 0.94} stroke={COURT_LINE} strokeWidth={2.4} />
    </Svg>
  )
}

/** Lime disc with a tick, beside the winner's name */
function WinnerMark() {
  return (
    <Svg width={13} height={13} viewBox="0 0 13 13">
      <Circle cx={6.5} cy={6.5} r={6.5} fill={LIME} />
      <Path d="M3.6 6.7 L5.6 8.6 L9.4 4.5" stroke={NIGHT} strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

function Pair({ a, b, sep = ":", size = 18 }: { a: string | number; b: string | number; sep?: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: 800, letterSpacing: -0.3 }}>
      <Text style={{ color: BLUE }}>{a}</Text>
      <Text style={{ color: "#b4bcae" }}>{sep}</Text>
      <Text style={{ color: RED }}>{b}</Text>
    </Text>
  )
}

/** Blue share against red share in one thin bar */
function ShareBar({ a, b, height = 4 }: { a: number; b: number; height?: number }) {
  const total = a + b
  const left = total > 0 ? (100 * a) / total : 50
  return (
    <View style={{ flexDirection: "row", height, borderRadius: height / 2, overflow: "hidden", backgroundColor: LINE }}>
      {total > 0 && <View style={{ width: `${left}%`, backgroundColor: BLUE }} />}
      {total > 0 && <View style={{ width: `${100 - left}%`, backgroundColor: RED, borderLeftWidth: 1, borderLeftColor: "#ffffff" }} />}
    </View>
  )
}

/** Two bars growing out from the middle, each against 100 % (percentages) or the larger value */
function SplitRow({ label, a, b, wa, wb }: { label: string; a: string; b: string; wa: number; wb: number }) {
  const bar = (value: number, c: string, align: "flex-start" | "flex-end") => (
    <View style={{ flex: 1, height: 5, backgroundColor: SOFT, borderRadius: 3, flexDirection: "row", justifyContent: align }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: 5, backgroundColor: c, borderRadius: 3 }} />
    </View>
  )
  return (
    <View style={{ marginBottom: 7 }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 3 }}>
        <Text style={{ color: BLUE, fontWeight: 800, fontSize: 10.5 }}>{a}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={{ color: RED, fontWeight: 800, fontSize: 10.5 }}>{b}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {bar(wa, BLUE, "flex-end")}
        {bar(wb, RED, "flex-start")}
      </View>
    </View>
  )
}

function SectionHead({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 3, height: eyebrow ? 22 : 13, backgroundColor: LIME, borderRadius: 2 }} />
        <View>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      {right}
    </View>
  )
}

const pctText = (v: number | null) => (v === null ? "–" : `${v} %`)

/** The lead line: gradient areas for who leads, shaded set bands, rings for breaks */
function FlowChart({ insights, width, height }: { insights: MatchInsights; width: number; height: number }) {
  const values = insights.worm
  const lo = Math.min(-3, ...values), hi = Math.max(3, ...values)
  const n = Math.max(1, values.length - 1)
  const padTop = 8, padBottom = 8, padLeft = 18
  const x = (i: number) => padLeft + (i * (width - padLeft - 4)) / n
  const y = (v: number) => padTop + ((hi - v) * (height - padTop - padBottom)) / (hi - lo)
  const zero = y(0)
  const pts = (fn: (v: number) => number) => values.map((v, i) => `${x(i).toFixed(1)},${y(fn(v)).toFixed(1)}`).join(" ")
  const step = hi - lo > 30 ? 10 : 5
  const grid: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) if (v !== 0) grid.push(v)
  const bands = insights.sets.map((s, i) => {
    const games = insights.games.filter((g) => g.set === s.set)
    return games.length ? { i, from: games[0].firstPoint, to: games[games.length - 1].lastPoint + 1 } : null
  }).filter((b): b is { i: number; from: number; to: number } => b !== null)
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="lead1" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={BLUE} stopOpacity={0.42} />
          <Stop offset="1" stopColor={BLUE} stopOpacity={0.04} />
        </LinearGradient>
        <LinearGradient id="lead2" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={RED} stopOpacity={0.04} />
          <Stop offset="1" stopColor={RED} stopOpacity={0.42} />
        </LinearGradient>
      </Defs>
      {bands.map((b) => (
        <Rect key={b.i} x={x(b.from)} y={2} width={Math.max(0, x(b.to) - x(b.from))} height={height - 4} fill={b.i % 2 ? "#ffffff" : SOFT} />
      ))}
      {grid.map((v) => (
        <Line key={v} x1={padLeft} x2={width} y1={y(v)} y2={y(v)} stroke={LINE} strokeWidth={0.8} strokeDasharray="2 3" />
      ))}
      <Polygon points={`${x(0)},${zero} ${pts((v) => Math.max(v, 0))} ${x(n)},${zero}`} fill="url(#lead1)" />
      <Polygon points={`${x(0)},${zero} ${pts((v) => Math.min(v, 0))} ${x(n)},${zero}`} fill="url(#lead2)" />
      <Line x1={padLeft} x2={width} y1={zero} y2={zero} stroke="#aab3a4" strokeWidth={0.8} />
      <Polyline points={pts((v) => v)} fill="none" stroke={INK} strokeWidth={1.6} />
      {insights.breakMarks.map((b) => (
        <Circle key={b.at} cx={Math.min(x(b.at), width - 5)} cy={y(values[b.at])} r={3.6} fill="#ffffff" stroke={color(b.side)} strokeWidth={1.8} />
      ))}
    </Svg>
  )
}

interface StatRow { label: string; a: string; b: string; wa: number; wb: number }

/** Every statistic for one pair of totals; bars compare the two sides (shares or percentages) */
function statRows(t: Translate, a: SideTotals, b: SideTotals, detail: boolean): StatRow[] {
  const frac = (label: string, x: number, xOf: number, y: number, yOf: number): StatRow =>
    ({ label, a: `${x}/${xOf}`, b: `${y}/${yOf}`, wa: percent(x, xOf) ?? 0, wb: percent(y, yOf) ?? 0 })
  const count = (label: string, x: number, y: number): StatRow => {
    const max = Math.max(x, y, 1)
    return { label, a: String(x), b: String(y), wa: (100 * x) / max, wb: (100 * y) / max }
  }
  const pct = (label: string, x: number, xOf: number, y: number, yOf: number): StatRow => {
    const pa = percent(x, xOf), pb = percent(y, yOf)
    return { label, a: pctText(pa), b: pctText(pb), wa: pa ?? 0, wb: pb ?? 0 }
  }
  const rows: StatRow[] = [
    count(t("pdfTotalPoints"), a.points, b.points),
    frac(t("pdfServiceGames"), a.serviceGamesHeld, a.serviceGames, b.serviceGamesHeld, b.serviceGames),
    count(t("pdfBreaks"), a.breaks, b.breaks),
    frac(t("bpSaved"), a.breakPointsSaved, a.breakPointsFaced, b.breakPointsSaved, b.breakPointsFaced),
    frac(t("bpConverted"), a.breakPointsWon, a.breakPointChances, b.breakPointsWon, b.breakPointChances),
    pct(t("servePointsWon"), a.servePointsWon, a.servePoints, b.servePointsWon, b.servePoints),
    pct(t("returnWon"), a.returnPointsWon, a.returnPoints, b.returnPointsWon, b.returnPoints),
  ]
  if (detail) {
    rows.push(
      pct(t("firstServeIn"), a.firstServes, a.servePoints, b.firstServes, b.servePoints),
      pct(t("firstServeWon"), a.firstServePointsWon, a.firstServes, b.firstServePointsWon, b.firstServes),
      pct(t("secondServeWon"), a.secondServePointsWon, a.secondServes, b.secondServePointsWon, b.secondServes),
      count(t("aces"), a.aces, b.aces),
      count(t("doubleFaults"), a.doubleFaults, b.doubleFaults),
      count(t("pdfWinners"), a.winners, b.winners),
      count(t("pdfUnforced"), a.unforcedErrors, b.unforcedErrors),
      count(t("pdfForced"), a.forcedErrors, b.forcedErrors),
    )
  }
  rows.push(
    count(t("deuceGames"), a.deuceGamesWon, b.deuceGamesWon),
    count(t("pressurePoints"), a.pressurePointsWon, b.pressurePointsWon),
    count(t("longestPointRun"), a.longestPointRun, b.longestPointRun),
    count(t("longestGameRun"), a.longestGameRun, b.longestGameRun),
  )
  return rows
}

function Footer({ t, generatedLabel }: { t: Translate; generatedLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <BallMark size={9} fill={LIME} seam={LIME_DARK} />
        <Text style={{ fontWeight: 800, color: INK }}>{t("pdfFooter")}</Text>
        <Text>{`· ${generatedLabel}`}</Text>
      </View>
      <Text render={({ pageNumber, totalPages }) => t("pdfPage", { page: pageNumber, total: totalPages })} />
    </View>
  )
}

/** A thin dark strip with the match and the brand, on every page after the cover */
function RunningHeader({ title, t }: { title: string; t: Translate }) {
  return (
    <View fixed style={{ backgroundColor: NIGHT, paddingHorizontal: PAGE_X, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <Text style={{ fontSize: 8, color: NIGHT_TEXT, fontWeight: 600 }}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <BallMark size={9} />
        <Text style={{ fontSize: 7, color: LIME, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase" }}>{`Tenis.click · ${t("pdfTitle")}`}</Text>
      </View>
    </View>
  )
}

export function MatchReportDocument(props: MatchReportProps) {
  const { insights, t, locale, fullNames, shortNames, focus, completed } = props
  const { p1, p2 } = insights.totals
  const detail = insights.hasServeDetail
  const winner = props.winner ?? (completed ? insights.leader : null)
  const totalPoints = p1.points + p2.points
  const f = insights.totals[focus]
  const pressure = pressureShares(insights, focus)
  const sets = insights.sets
  const pageWidth = 595.28
  const contentWidth = pageWidth - 2 * PAGE_X
  const matchTitle = `${fullNames.p1} ${t("pdfVs")} ${fullNames.p2} · ${props.dateLabel}`
  const meta = [props.tournamentName, props.dateLabel, props.durationText].filter(Boolean).join("  ·  ")

  const kpis = [
    { label: t("tilePoints"), a: p1.points, b: p2.points, bar: [p1.points, p2.points], sub: t("tilePointsSub", { name: shortNames[focus], pct: percent(f.points, totalPoints) ?? 0 }) },
    { label: t("tileBreaks"), a: p1.breaks, b: p2.breaks, bar: [p1.breaks, p2.breaks], sub: f.breakPointChances ? t("tileBreaksSub", { won: f.breakPointsWon, chances: f.breakPointChances }) : "" },
    { label: t("tileHolds"), a: `${p1.serviceGamesHeld}/${p1.serviceGames}`, b: `${p2.serviceGamesHeld}/${p2.serviceGames}`, sep: " · ", bar: [p1.serviceGamesHeld, p2.serviceGamesHeld], sub: f.serviceGames && f.serviceGamesHeld === f.serviceGames ? t("tileHoldsAll", { name: shortNames[focus] }) : "" },
    detail
      ? { label: t("tileUnforced"), a: p1.unforcedErrors, b: p2.unforcedErrors, bar: [p1.unforcedErrors, p2.unforcedErrors], sub: "" }
      : { label: t("longestGameRun"), a: p1.longestGameRun, b: p2.longestGameRun, bar: [p1.longestGameRun, p2.longestGameRun], sub: "" },
  ]

  return (
    <Document title={`${fullNames.p1} – ${fullNames.p2}`} author="tenis.click" creator="tenis.click" language={locale}>
      {/* Cover and overview */}
      <Page size="A4" style={styles.page}>
        <View style={{ backgroundColor: NIGHT, paddingHorizontal: PAGE_X, paddingTop: 22, paddingBottom: 20, position: "relative" }}>
          <CourtLines width={260} height={168} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <BallMark size={15} />
              <Text style={{ fontSize: 10, fontWeight: 800, color: NIGHT_TEXT, letterSpacing: 0.4 }}>Tenis.click</Text>
            </View>
            <Text style={{ fontSize: 7.5, fontWeight: 800, color: LIME, letterSpacing: 1.6, textTransform: "uppercase" }}>{t("pdfTitle")}</Text>
          </View>
          {meta ? <Text style={{ fontSize: 8, color: NIGHT_MUTED, marginBottom: 10, letterSpacing: 0.3 }}>{meta}</Text> : null}
          {(["p1", "p2"] as Side[]).map((s, i) => {
            const won = winner === s
            const lost = winner && !won
            return (
              <View key={s} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, borderTopWidth: i === 1 ? 1 : 0, borderTopColor: NIGHT_LINE }}>
                <View style={{ width: 4, height: 30, borderRadius: 2, backgroundColor: color(s), marginRight: 9 }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 19, fontWeight: 800, color: lost ? "#b8c2b2" : NIGHT_TEXT, letterSpacing: -0.3 }}>{fullNames[s]}</Text>
                    {won && <WinnerMark />}
                  </View>
                  {props.metaLines[s] ? <Text style={{ fontSize: 7.8, color: NIGHT_MUTED, marginTop: 2 }}>{props.metaLines[s]}</Text> : null}
                </View>
                <View style={{ flexDirection: "row", gap: 5 }}>
                  {props.scoreboard.sets.map(([a, b], j) => {
                    const mine = s === "p1" ? a : b, theirs = s === "p1" ? b : a
                    const setWon = mine > theirs
                    return (
                      <View key={j} style={{ width: 30, height: 30, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: setWon ? LIME : "transparent", borderWidth: setWon ? 0 : 1, borderColor: NIGHT_LINE }}>
                        <Text style={{ fontSize: 15, fontWeight: 800, color: setWon ? NIGHT : NIGHT_MUTED }}>{mine}</Text>
                      </View>
                    )
                  })}
                  {props.scoreboard.current && (
                    <View style={{ width: 30, height: 30, borderRadius: 7, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f59e0b" }}>
                      <Text style={{ fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>{s === "p1" ? props.scoreboard.current[0] : props.scoreboard.current[1]}</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        <View style={[styles.inner, { paddingTop: 16 }]}>
          <View style={{ flexDirection: "row", gap: 9, marginBottom: 14 }}>
            <View style={{ width: 4, backgroundColor: LIME, borderRadius: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 3 }}>{headlineTitle(insights, shortNames, t, props.winner)}</Text>
              <Text style={styles.sub}>{headlineDetail(insights, focus, shortNames, t, props.durationText)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {kpis.map((k) => (
              <View key={k.label} style={[styles.card, { flex: 1, padding: 10, gap: 4 }]}>
                <Text style={styles.label}>{k.label}</Text>
                <Pair a={k.a} b={k.b} sep={k.sep} size={k.sep ? 14 : 19} />
                <ShareBar a={k.bar[0]} b={k.bar[1]} />
                <Text style={{ fontSize: 7, color: MUTED, minHeight: 9 }}>{k.sub}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { marginBottom: 12, paddingBottom: 8 }]} wrap={false}>
            <SectionHead
              title={t("chartTitle")}
              right={
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  {(["p1", "p2"] as Side[]).map((s) => (
                    <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color(s) }} />
                      <Text style={{ fontSize: 7, color: MUTED }}>{t("chartLeads", { name: shortNames[s] })}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: MUTED }} />
                    <Text style={{ fontSize: 7, color: MUTED }}>{t("chartBreak")}</Text>
                  </View>
                </View>
              }
            />
            <FlowChart insights={insights} width={contentWidth - 26} height={128} />
            <View style={{ flexDirection: "row", marginTop: 4, paddingLeft: 18 }}>
              {sets.map((st) => {
                const games = insights.games.filter((g) => g.set === st.set)
                const share = games.length ? (games[games.length - 1].lastPoint + 1 - games[0].firstPoint) / Math.max(1, insights.worm.length - 1) : 0
                return (
                  <Text key={st.set} style={{ width: `${share * 100}%`, fontSize: 7, color: MUTED, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" }}>
                    {st.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(st) }) : t("chartSetLabel", { set: st.set, score: setScoreLabel(st) })}
                  </Text>
                )
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View style={[styles.card, { flex: 1 }]} wrap={false}>
              <SectionHead title={t("gamesTitle")} />
              {sets.map((st) => (
                <View key={st.set} style={{ marginBottom: 7 }}>
                  <Text style={{ fontSize: 7, color: MUTED, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>
                    {st.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(st) }) : t("setTitle", { set: st.set, score: setScoreLabel(st) })}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                    {insights.games.filter((g) => g.set === st.set).map((g) => {
                      const solid = g.isBreak || g.tiebreak
                      return (
                        <View key={g.game} style={{ minWidth: 25, height: 18, paddingHorizontal: 2, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: !g.winner ? "#ffffff" : solid ? color(g.winner) : soft(g.winner), borderWidth: g.winner ? 0 : 1, borderColor: FAINT }}>
                          <Text style={{ fontSize: 7, fontWeight: 800, color: !g.winner ? FAINT : solid ? "#ffffff" : g.winner === "p1" ? "#1e3a8a" : "#7f1d1d" }}>
                            {g.tiebreak ? t("tiebreakShort") : g.winner ? `${g.gamesAfter[0]}:${g.gamesAfter[1]}` : "…"}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
              <Text style={{ fontSize: 6.8, color: FAINT, lineHeight: 1.35 }}>{t("gamesHint")}</Text>
            </View>
            <View style={[styles.card, { flex: 1.15 }]} wrap={false}>
              <SectionHead title={t("momentsTitle")} />
              <View style={{ position: "relative", paddingLeft: 12 }}>
                <View style={{ position: "absolute", left: 3, top: 3, bottom: 3, width: 1, backgroundColor: LINE }} />
                {insights.moments.slice(0, 5).map((m) => {
                  const mt = momentText(m, shortNames, t, locale)
                  return (
                    <View key={`${m.kind}-${m.at}`} style={{ marginBottom: 6, position: "relative" }}>
                      <View style={{ position: "absolute", left: -12, top: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: color(m.side), borderWidth: 1.5, borderColor: "#ffffff" }} />
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 1 }}>
                        <Text style={{ fontSize: 8.5, fontWeight: 800 }}>{mt.title}</Text>
                        <Text style={{ fontSize: 6.5, fontWeight: 800, color: AMBER, backgroundColor: AMBER_SOFT, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 }}>{mt.when}</Text>
                      </View>
                      <Text style={{ fontSize: 7.6, color: MUTED, lineHeight: 1.35 }}>{mt.text}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          </View>

        </View>
        <Footer t={t} generatedLabel={props.generatedLabel} />
      </Page>

      {/* The saved AI analysis, as a coach's note */}
      {props.analysis && (
        <Page size="A4" style={styles.page}>
          <RunningHeader title={matchTitle} t={t} />
          <View style={styles.inner}>
            <SectionHead eyebrow="Gemini" title={t("pdfAiTitle")} />
            <View style={{ backgroundColor: NIGHT, borderRadius: 12, padding: 18, marginBottom: 12, position: "relative" }}>
              <Text style={{ position: "absolute", top: 12, left: 14, fontSize: 46, fontWeight: 800, color: LIME, opacity: 0.4 }}>“</Text>
              <Text style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: LIME, marginBottom: 6, marginLeft: 36 }}>{t("aiSummary")}</Text>
              <Text style={{ fontSize: 11, lineHeight: 1.55, color: NIGHT_TEXT, marginLeft: 36 }}>{props.analysis.analysis.summary}</Text>
            </View>
            {([
              [t("aiStrengths"), props.analysis.analysis.strengths, "#15803d", "#dcfce7"],
              [t("aiImprovements"), props.analysis.analysis.improvements, AMBER, AMBER_SOFT],
              [t("aiTraining"), props.analysis.analysis.trainingTips, "#6d28d9", "#ede9fe"],
            ] as [string, string[], string, string][]).filter(([, items]) => items.length).map(([title, items, accent, tint]) => (
              <View key={title} style={[styles.card, { marginBottom: 10, borderLeftWidth: 4, borderLeftColor: accent }]} wrap={false}>
                <Text style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: accent, marginBottom: 7 }}>{title}</Text>
                {items.map((item, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 5 }}>
                    <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: tint, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 7.5, fontWeight: 800, color: accent }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 9.3, lineHeight: 1.5 }}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
            <Text style={{ fontSize: 7, color: FAINT, marginTop: 2 }}>{`${t("aiDisclaimer")} (${props.analysis.model})`}</Text>
          </View>
          <Footer t={t} generatedLabel={props.generatedLabel} />
        </Page>
      )}

      {/* The detail cards, every statistic by set and every game, flowing across pages */}
      <Page size="A4" style={styles.page}>
        <RunningHeader title={matchTitle} t={t} />
        <View style={styles.inner}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }} wrap={false}>
            <View style={[styles.card, { flex: 1 }]}>
              <SectionHead
                title={t("serveTitle")}
                right={<Text style={{ fontSize: 7.5, fontWeight: 800 }}><Text style={{ color: BLUE }}>{shortNames.p1}</Text><Text style={{ color: FAINT }}> · </Text><Text style={{ color: RED }}>{shortNames.p2}</Text></Text>}
              />
              {((detail ? [
                [t("firstServeIn"), percent(p1.firstServes, p1.servePoints), percent(p2.firstServes, p2.servePoints)],
                [t("firstServeWon"), percent(p1.firstServePointsWon, p1.firstServes), percent(p2.firstServePointsWon, p2.firstServes)],
                [t("secondServeWon"), percent(p1.secondServePointsWon, p1.secondServes), percent(p2.secondServePointsWon, p2.secondServes)],
                [t("returnWon"), percent(p1.returnPointsWon, p1.returnPoints), percent(p2.returnPointsWon, p2.returnPoints)],
              ] : [
                [t("servePointsWon"), percent(p1.servePointsWon, p1.servePoints), percent(p2.servePointsWon, p2.servePoints)],
                [t("returnWon"), percent(p1.returnPointsWon, p1.returnPoints), percent(p2.returnPointsWon, p2.returnPoints)],
              ]) as [string, number | null, number | null][]).map(([label, a, b]) => (
                <SplitRow key={label} label={label} a={pctText(a)} b={pctText(b)} wa={a ?? 0} wb={b ?? 0} />
              ))}
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <SectionHead title={t("bigTitle")} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
                {[
                  [t("bpSaved"), `${p1.breakPointsSaved}/${p1.breakPointsFaced}`, `${p2.breakPointsSaved}/${p2.breakPointsFaced}`, " · "],
                  [t("bpConverted"), `${p1.breakPointsWon}/${p1.breakPointChances}`, `${p2.breakPointsWon}/${p2.breakPointChances}`, " · "],
                  [t("deuceGames"), p1.deuceGamesWon, p2.deuceGamesWon, ":"],
                  [t("pressurePoints"), p1.pressurePointsWon, p2.pressurePointsWon, ":"],
                ].map(([label, a, b, sep]) => (
                  <View key={String(label)} style={{ width: "50%", paddingRight: 6 }}>
                    <Text style={styles.label}>{label}</Text>
                    <Pair a={a} b={b} sep={String(sep)} size={13} />
                  </View>
                ))}
              </View>
              {pressure.pressure !== null && pressure.rest !== null && insights.pressurePointsPlayed >= 4 && (
                <Text style={[styles.sub, { fontSize: 7.3, marginTop: 8 }]}>{t("bigNote", { name: shortNames[focus], pct: pressure.pressure, rest: pressure.rest })}</Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }} wrap={false}>
            {detail && (
              <View style={[styles.card, { flex: 1.3 }]}>
                <SectionHead title={t("howTitle")} />
                {(["p1", "p2"] as Side[]).map((s) => {
                  const src = pointSources(insights, s)
                  const share = (n: number) => `${src.total ? (100 * n) / src.total : 0}%`
                  return (
                    <View key={s} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontWeight: 800, color: color(s), fontSize: 9 }}>{t("howRow", { name: shortNames[s], count: src.total })}</Text>
                        <Text style={{ color: MUTED, fontSize: 7.5 }}>{t("howRowSub", { own: src.own, errors: src.errors })}</Text>
                      </View>
                      <View style={{ flexDirection: "row", height: 9, borderRadius: 5, overflow: "hidden", backgroundColor: LINE }}>
                        {[[src.own, 1], [src.unforced, 0.6], [src.forced, 0.38], [src.doubleFaults, 0.2]].map(([n, o], k) => (
                          <View key={k} style={{ width: share(n), backgroundColor: color(s), opacity: o, borderRightWidth: 1, borderRightColor: "#ffffff" }} />
                        ))}
                      </View>
                    </View>
                  )
                })}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                  {([[t("legendOwn"), 1], [t("legendUnforced"), 0.6], [t("legendForced"), 0.38], [t("legendDoubleFaults"), 0.2]] as [string, number][]).map(([label, o]) => (
                    <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: INK, opacity: o }} />
                      <Text style={{ fontSize: 6.8, color: MUTED }}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={[styles.card, { flex: 1 }]}>
              <SectionHead title={t("runsTitle")} />
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}><Text style={styles.label}>{t("longestPointRun")}</Text><Pair a={p1.longestPointRun} b={p2.longestPointRun} size={14} /></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>{t("longestGameRun")}</Text><Pair a={p1.longestGameRun} b={p2.longestGameRun} size={14} /></View>
              </View>
              {sets.some((s) => s.durationSec) && (
                <Text style={[styles.sub, { fontSize: 7.8 }]}>
                  {sets.filter((s) => s.durationSec).map((s) => `${t("momentSet", { set: s.set })}: ${formatSeconds(Math.round((s.durationSec ?? 0) / 60) * 60, locale)}`).join("  ·  ")}
                </Text>
              )}
              {insights.medianSecondsBetweenPoints !== null && <Text style={[styles.sub, { fontSize: 7.8 }]}>{`${t("pace")}: ${t("paceValue", { seconds: insights.medianSecondsBetweenPoints })}`}</Text>}
              {insights.longestGame && (
                <Text style={[styles.sub, { fontSize: 7.8, marginTop: 3 }]}>
                  {insights.longestGame.durationSec
                    ? t("longestGame", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length, duration: formatSeconds(insights.longestGame.durationSec, locale) })
                    : t("longestGameNoTime", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length })}
                </Text>
              )}
            </View>
          </View>

          <View minPresenceAhead={160}>
            <SectionHead eyebrow={t("pdfStat")} title={t("pdfStatsTitle")} />
          </View>
          <View style={{ borderRadius: 10, borderWidth: 1, borderColor: LINE, overflow: "hidden", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: NIGHT, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ flex: 1, fontSize: 7, color: NIGHT_MUTED, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>{t("pdfStat")}</Text>
              <Text style={{ width: 54, textAlign: "right", fontSize: 7.5, color: "#93c5fd", fontWeight: 800 }}>{shortNames.p1}</Text>
              <View style={{ width: 70 }} />
              <Text style={{ width: 54, fontSize: 7.5, color: "#fca5a5", fontWeight: 800 }}>{shortNames.p2}</Text>
              {sets.length > 1 && sets.map((st) => <Text key={st.set} style={{ width: 50, textAlign: "right", fontSize: 7, color: NIGHT_MUTED, fontWeight: 800, textTransform: "uppercase" }}>{t("momentSet", { set: st.set })}</Text>)}
            </View>
            {statRows(t, p1, p2, detail).map((row, i) => {
              const bySet = sets.length > 1 ? sets.map((st) => statRows(t, insights.totalsBySet[st.set]?.p1 ?? p1, insights.totalsBySet[st.set]?.p2 ?? p2, detail)[i]) : []
              return (
                <View key={row.label} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 3.6, backgroundColor: i % 2 ? "#ffffff" : SOFT }} wrap={false}>
                  <Text style={{ flex: 1, fontSize: 8.6 }}>{row.label}</Text>
                  <Text style={{ width: 54, textAlign: "right", fontWeight: 800, color: BLUE, paddingRight: 6 }}>{row.a}</Text>
                  <View style={{ width: 70, flexDirection: "row", gap: 2 }}>
                    <View style={{ flex: 1, height: 4, flexDirection: "row", justifyContent: "flex-end" }}>
                      <View style={{ width: `${Math.min(100, row.wa)}%`, height: 4, backgroundColor: BLUE, borderRadius: 2 }} />
                    </View>
                    <View style={{ flex: 1, height: 4, flexDirection: "row" }}>
                      <View style={{ width: `${Math.min(100, row.wb)}%`, height: 4, backgroundColor: RED, borderRadius: 2 }} />
                    </View>
                  </View>
                  <Text style={{ width: 54, fontWeight: 800, color: RED, paddingLeft: 6 }}>{row.b}</Text>
                  {bySet.map((s, j) => <Text key={j} style={{ width: 50, textAlign: "right", color: MUTED, fontSize: 7.6 }}>{`${s.a} · ${s.b}`}</Text>)}
                </View>
              )
            })}
          </View>


          <View style={{ marginTop: 16 }} minPresenceAhead={120}>
            <SectionHead eyebrow={t("pdfGame")} title={t("pdfFlowTitle")} />
          </View>
          {sets.map((st) => (
            <View key={st.set} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }} wrap={false} minPresenceAhead={60}>
                <Text style={{ fontSize: 9.5, fontWeight: 800, color: NIGHT, backgroundColor: LIME, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                  {st.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(st) }) : t("setTitle", { set: st.set, score: setScoreLabel(st) })}
                </Text>
                {st.durationSec ? <Text style={{ fontSize: 8, color: MUTED }}>{formatSeconds(Math.round(st.durationSec / 60) * 60, locale)}</Text> : null}
              </View>
              <View style={{ borderRadius: 8, borderWidth: 1, borderColor: LINE, overflow: "hidden" }}>
                <View style={{ flexDirection: "row", backgroundColor: SOFT, paddingHorizontal: 8, paddingVertical: 4 }}>
                  {[[t("pdfGame"), 52], [t("pdfServer"), 70], [t("pdfPoints"), 0], [t("pdfScore"), 40], [t("pdfNotes"), 150]].map(([label, w]) => (
                    <Text key={String(label)} style={{ ...(w ? { width: Number(w) } : { flex: 1 }), fontSize: 6.6, color: MUTED, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", textAlign: label === t("pdfScore") ? "right" : "left", paddingLeft: label === t("pdfNotes") ? 10 : 0 }}>{label}</Text>
                  ))}
                </View>
                {insights.games.filter((g) => g.set === st.set).map((g) => {
                  const notes = [
                    g.isBreak ? { text: t("tagBreak"), fg: g.winner ? color(g.winner) : MUTED, bg: g.winner ? soft(g.winner) : SOFT } : null,
                    g.comebackFrom ? { text: t("tagComeback", { from: g.comebackFrom }), fg: AMBER, bg: AMBER_SOFT } : null,
                    g.breakPointsSaved > 0 && g.winner === g.server ? { text: t("tagSaved", { count: g.breakPointsSaved }), fg: AMBER, bg: AMBER_SOFT } : null,
                    g.deuce ? { text: t("tagDeuce"), fg: MUTED, bg: SOFT } : null,
                  ].filter((n): n is { text: string; fg: string; bg: string } => n !== null)
                  return (
                    <View key={g.game} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4.5, borderTopWidth: 1, borderTopColor: LINE, backgroundColor: g.isBreak ? "#fbfcf7" : "#ffffff" }} wrap={false}>
                      <Text style={{ width: 52, fontWeight: 800, fontSize: 8.5 }}>{g.tiebreak ? t("flowTiebreak") : t("flowGame", { game: g.game })}</Text>
                      <View style={{ width: 70, flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color(g.server) }} />
                        <Text style={{ fontSize: 8.5 }}>{shortNames[g.server]}</Text>
                      </View>
                      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                        {g.points.map((w, i) => <View key={i} style={{ width: 6.5, height: 6.5, borderRadius: 3.25, backgroundColor: w === "p1" ? BLUE : RED }} />)}
                      </View>
                      <Text style={{ width: 40, textAlign: "right", fontWeight: 800, fontSize: 9.5, color: g.winner ? color(g.winner) : FAINT }}>{g.winner ? `${g.gamesAfter[0]}:${g.gamesAfter[1]}` : "…"}</Text>
                      <View style={{ width: 150, flexDirection: "row", flexWrap: "wrap", gap: 3, paddingLeft: 10 }}>
                        {notes.map((n) => <Text key={n.text} style={{ fontSize: 6.8, fontWeight: 800, color: n.fg, backgroundColor: n.bg, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5 }}>{n.text}</Text>)}
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
        <Footer t={t} generatedLabel={props.generatedLabel} />
      </Page>
    </Document>
  )
}
