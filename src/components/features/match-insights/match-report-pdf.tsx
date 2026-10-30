import { Document, Font, Page, StyleSheet, Svg, Polygon, Polyline, Line, Circle, Text, View } from "@react-pdf/renderer"
import type { SavedAnalysis } from "@/lib/ai/match-analysis"
import { percent, type MatchInsights, type Side, type SideTotals } from "@/lib/utils/match-insights"
import { formatSeconds, setScoreLabel } from "./labels"
import { headlineDetail, headlineTitle, momentText, pointSources, pressureShares, type Translate } from "./texts"

/**
 * The match report as a PDF (react-pdf): an A4 overview page in the app's look, then the full
 * statistics, the saved AI analysis and every game. Loaded only when someone exports, so the
 * PDF engine never weighs on the match page.
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

const INK = "#172014"
const MUTED = "#53614d"
const FAINT = "#7c8a75"
const BOX = "#f6f7f1"
const LINE = "#e3e5dc"
const BLUE = "#2563eb"
const RED = "#dc2626"
const side = (s: Side) => (s === "p1" ? BLUE : RED)

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9.5, color: INK, paddingBottom: 36 },
  band: { backgroundColor: "#101411", color: "#f4f7ed", paddingHorizontal: 34, paddingTop: 20, paddingBottom: 16 },
  bandTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  brand: { fontSize: 8.5, fontWeight: 800, letterSpacing: 1.6, color: "#d9f99d", textTransform: "uppercase" },
  bandMeta: { fontSize: 8.5, color: "#adb8a7" },
  playerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  playerName: { fontSize: 17, fontWeight: 800 },
  playerMeta: { fontSize: 8, marginTop: 2 },
  setCell: { width: 34, textAlign: "center", fontSize: 22, fontWeight: 800 },
  body: { paddingHorizontal: 34, paddingTop: 14 },
  headline: { fontSize: 15, fontWeight: 800, marginBottom: 3 },
  sub: { fontSize: 9, color: MUTED, lineHeight: 1.4 },
  row: { flexDirection: "row", gap: 9 },
  box: { backgroundColor: BOX, borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 10 },
  label: { fontSize: 6.8, letterSpacing: 0.8, textTransform: "uppercase", color: MUTED, fontWeight: 600 },
  h: { fontSize: 10.5, fontWeight: 800, marginBottom: 6 },
  big: { fontSize: 16, fontWeight: 800, marginTop: 2 },
  footer: { position: "absolute", bottom: 16, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: FAINT, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, paddingVertical: 3.5, alignItems: "center" },
  tableHead: { fontSize: 7, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 },
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

function Pair({ a, b, sep = ":", size = 16 }: { a: string | number; b: string | number; sep?: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: 800 }}>
      <Text style={{ color: BLUE }}>{a}</Text>
      <Text style={{ color: "#a3ad9c" }}>{sep}</Text>
      <Text style={{ color: RED }}>{b}</Text>
    </Text>
  )
}

function Bar({ value, color, align }: { value: number; color: string; align: "left" | "right" }) {
  return (
    <View style={{ flex: 1, height: 4, backgroundColor: LINE, borderRadius: 2, flexDirection: "row", justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: 4, backgroundColor: color, borderRadius: 2 }} />
    </View>
  )
}

function SplitRow({ label, a, b, wa, wb }: { label: string; a: string; b: string; wa: number; wb: number }) {
  return (
    <View style={{ marginBottom: 5 }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2 }}>
        <Text style={{ color: BLUE, fontWeight: 800, fontSize: 9.5 }}>{a}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={{ color: RED, fontWeight: 800, fontSize: 9.5 }}>{b}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        <Bar value={wa} color="#3b82f6" align="right" />
        <Bar value={wb} color="#ef4444" align="left" />
      </View>
    </View>
  )
}

const pctText = (v: number | null) => (v === null ? "–" : `${v} %`)

function Chart({ insights, width, height }: { insights: MatchInsights; width: number; height: number }) {
  const values = insights.worm
  const lo = Math.min(-3, ...values), hi = Math.max(3, ...values)
  const n = Math.max(1, values.length - 1)
  const padTop = 6, padBottom = 6
  const x = (i: number) => (i * width) / n
  const y = (v: number) => padTop + ((hi - v) * (height - padTop - padBottom)) / (hi - lo)
  const zero = y(0)
  const pts = (fn: (v: number) => number) => values.map((v, i) => `${x(i).toFixed(1)},${y(fn(v)).toFixed(1)}`).join(" ")
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polygon points={`0,${zero} ${pts((v) => Math.max(v, 0))} ${width},${zero}`} fill="#3b82f6" fillOpacity={0.18} />
      <Polygon points={`0,${zero} ${pts((v) => Math.min(v, 0))} ${width},${zero}`} fill="#ef4444" fillOpacity={0.25} />
      <Line x1={0} x2={width} y1={zero} y2={zero} stroke="#a3ad9c" strokeWidth={0.8} />
      {insights.setEnds.filter((i) => i > 0 && i < n).map((i) => (
        <Line key={i} x1={x(i)} x2={x(i)} y1={2} y2={height - 2} stroke="#a3ad9c" strokeWidth={0.8} strokeDasharray="2 2" />
      ))}
      <Polyline points={pts((v) => v)} fill="none" stroke="#1d4ed8" strokeWidth={1.6} />
      {insights.breakMarks.map((b) => (
        <Circle key={b.at} cx={Math.min(x(b.at), width - 4)} cy={y(values[b.at])} r={3.2} fill="#ffffff" stroke={b.side === "p1" ? BLUE : RED} strokeWidth={1.6} />
      ))}
    </Svg>
  )
}

function statRows(t: Translate, a: SideTotals, b: SideTotals, detail: boolean): { label: string; a: string; b: string }[] {
  const frac = (x: number, y: number) => `${x}/${y}`
  const p = (x: number, y: number) => pctText(percent(x, y))
  const rows = [
    { label: t("pdfTotalPoints"), a: String(a.points), b: String(b.points) },
    { label: t("pdfServiceGames"), a: frac(a.serviceGamesHeld, a.serviceGames), b: frac(b.serviceGamesHeld, b.serviceGames) },
    { label: t("pdfBreaks"), a: String(a.breaks), b: String(b.breaks) },
    { label: t("bpSaved"), a: frac(a.breakPointsSaved, a.breakPointsFaced), b: frac(b.breakPointsSaved, b.breakPointsFaced) },
    { label: t("bpConverted"), a: frac(a.breakPointsWon, a.breakPointChances), b: frac(b.breakPointsWon, b.breakPointChances) },
    { label: t("servePointsWon"), a: p(a.servePointsWon, a.servePoints), b: p(b.servePointsWon, b.servePoints) },
    { label: t("returnWon"), a: p(a.returnPointsWon, a.returnPoints), b: p(b.returnPointsWon, b.returnPoints) },
  ]
  if (detail) {
    rows.push(
      { label: t("firstServeIn"), a: p(a.firstServes, a.servePoints), b: p(b.firstServes, b.servePoints) },
      { label: t("firstServeWon"), a: p(a.firstServePointsWon, a.firstServes), b: p(b.firstServePointsWon, b.firstServes) },
      { label: t("secondServeWon"), a: p(a.secondServePointsWon, a.secondServes), b: p(b.secondServePointsWon, b.secondServes) },
      { label: t("aces"), a: String(a.aces), b: String(b.aces) },
      { label: t("doubleFaults"), a: String(a.doubleFaults), b: String(b.doubleFaults) },
      { label: t("pdfWinners"), a: String(a.winners), b: String(b.winners) },
      { label: t("pdfUnforced"), a: String(a.unforcedErrors), b: String(b.unforcedErrors) },
      { label: t("pdfForced"), a: String(a.forcedErrors), b: String(b.forcedErrors) },
    )
  }
  rows.push(
    { label: t("deuceGames"), a: String(a.deuceGamesWon), b: String(b.deuceGamesWon) },
    { label: t("pressurePoints"), a: String(a.pressurePointsWon), b: String(b.pressurePointsWon) },
    { label: t("longestPointRun"), a: String(a.longestPointRun), b: String(b.longestPointRun) },
    { label: t("longestGameRun"), a: String(a.longestGameRun), b: String(b.longestGameRun) },
  )
  return rows
}

function Footer({ t, generatedLabel }: { t: Translate; generatedLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{`${t("pdfFooter")} · ${generatedLabel}`}</Text>
      <Text render={({ pageNumber, totalPages }) => t("pdfPage", { page: pageNumber, total: totalPages })} />
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
  const contentWidth = 595.28 - 68

  return (
    <Document title={`${props.fullNames.p1} – ${props.fullNames.p2}`} author="tenis.click" creator="tenis.click" language={locale}>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <View style={styles.bandTop}>
            <Text style={styles.brand}>{`Tenis.click · ${t("pdfTitle")}`}</Text>
            <Text style={styles.bandMeta}>{[props.dateLabel, props.tournamentName, props.durationText].filter(Boolean).join(" · ")}</Text>
          </View>
          {(["p1", "p2"] as Side[]).map((s, i) => (
            <View key={s} style={[styles.playerRow, i === 0 ? { borderBottomWidth: 1, borderBottomColor: "#2c3628" } : {}]}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                {winner === s && <View style={{ width: 4, height: 22, backgroundColor: "#fbbf24", borderRadius: 2 }} />}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, winner && winner !== s ? { color: "#c9d2c3" } : {}]}>{fullNames[s]}</Text>
                  {props.metaLines[s] ? <Text style={[styles.playerMeta, { color: "#b6c2ae" }]}>{props.metaLines[s]}</Text> : null}
                </View>
              </View>
              {props.scoreboard.sets.map(([a, b], j) => {
                const lost = a !== b && (s === "p1" ? a < b : b < a)
                return <Text key={j} style={[styles.setCell, lost ? { color: "#6b7a65" } : {}]}>{s === "p1" ? a : b}</Text>
              })}
              {props.scoreboard.current && <Text style={[styles.setCell, { color: "#fbbf24" }]}>{s === "p1" ? props.scoreboard.current[0] : props.scoreboard.current[1]}</Text>}
            </View>
          ))}
        </View>

        <View style={styles.body}>
          <Text style={styles.headline}>{headlineTitle(insights, shortNames, t, props.winner)}</Text>
          <Text style={[styles.sub, { marginBottom: 10 }]}>{headlineDetail(insights, focus, shortNames, t, props.durationText)}</Text>

          <View style={[styles.row, { marginBottom: 10 }]}>
            <View style={[styles.box, { flex: 1 }]}><Text style={styles.label}>{t("tilePoints")}</Text><Pair a={p1.points} b={p2.points} /><Text style={styles.sub}>{t("tilePointsSub", { name: shortNames[focus], pct: percent(f.points, totalPoints) ?? 0 })}</Text></View>
            <View style={[styles.box, { flex: 1 }]}><Text style={styles.label}>{t("tileBreaks")}</Text><Pair a={p1.breaks} b={p2.breaks} /><Text style={styles.sub}>{f.breakPointChances ? t("tileBreaksSub", { won: f.breakPointsWon, chances: f.breakPointChances }) : " "}</Text></View>
            <View style={[styles.box, { flex: 1 }]}><Text style={styles.label}>{t("tileHolds")}</Text><Pair a={`${p1.serviceGamesHeld}/${p1.serviceGames}`} b={`${p2.serviceGamesHeld}/${p2.serviceGames}`} sep=" · " size={14} /><Text style={styles.sub}> </Text></View>
            <View style={[styles.box, { flex: 1 }]}>
              {detail
                ? <><Text style={styles.label}>{t("tileUnforced")}</Text><Pair a={p1.unforcedErrors} b={p2.unforcedErrors} /></>
                : <><Text style={styles.label}>{t("longestGameRun")}</Text><Pair a={p1.longestGameRun} b={p2.longestGameRun} /></>}
              <Text style={styles.sub}> </Text>
            </View>
          </View>

          <View style={[styles.box, { marginBottom: 10 }]} wrap={false}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={[styles.h, { marginBottom: 0 }]}>{t("chartTitle")}</Text>
              <Text style={{ fontSize: 7.5, color: MUTED }}>
                <Text style={{ color: BLUE }}>■ </Text>{t("chartLeads", { name: shortNames.p1 })}{"   "}
                <Text style={{ color: RED }}>■ </Text>{t("chartLeads", { name: shortNames.p2 })}{"   "}
                ○ {t("chartBreak")}
              </Text>
            </View>
            <Chart insights={insights} width={contentWidth - 22} height={130} />
            <View style={{ flexDirection: "row", marginTop: 3 }}>
              {sets.map((st) => {
                const games = insights.games.filter((g) => g.set === st.set)
                const share = games.length ? (games[games.length - 1].lastPoint + 1 - games[0].firstPoint) / Math.max(1, insights.worm.length - 1) : 0
                return <Text key={st.set} style={{ width: `${share * 100}%`, fontSize: 7.5, color: MUTED, fontWeight: 600 }}>{t("chartSetLabel", { set: st.set, score: setScoreLabel(st) })}</Text>
              })}
            </View>
          </View>

          <View style={[styles.row, { marginBottom: 10 }]}>
            <View style={[styles.box, { flex: 1 }]} wrap={false}>
              <Text style={styles.h}>{t("gamesTitle")}</Text>
              {sets.map((st) => (
                <View key={st.set} style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 7.5, color: MUTED, fontWeight: 600, marginBottom: 3 }}>{st.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(st) }) : t("setTitle", { set: st.set, score: setScoreLabel(st) })}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}>
                    {insights.games.filter((g) => g.set === st.set).map((g) => {
                      const solid = g.isBreak || g.tiebreak
                      const color = g.winner ? side(g.winner) : FAINT
                      return (
                        <View key={g.game} style={{ minWidth: 26, height: 17, paddingHorizontal: 2, borderRadius: 4, borderWidth: 1, borderColor: color, backgroundColor: solid ? color : g.winner === "p1" ? "#dbeafe" : g.winner === "p2" ? "#fee2e2" : "#ffffff", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 7, fontWeight: 800, color: solid ? "#ffffff" : g.winner ? (g.winner === "p1" ? "#1e3a8a" : "#7f1d1d") : FAINT }}>
                            {g.tiebreak ? t("tiebreakShort") : g.winner ? `${g.gamesAfter[0]}:${g.gamesAfter[1]}` : "…"}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
              <Text style={{ fontSize: 7, color: FAINT }}>{t("gamesHint")}</Text>
            </View>
            <View style={[styles.box, { flex: 1 }]} wrap={false}>
              <Text style={styles.h}>{t("momentsTitle")}</Text>
              {insights.moments.slice(0, 5).map((m) => {
                const mt = momentText(m, shortNames, t, locale)
                return (
                  <View key={`${m.kind}-${m.at}`} style={{ flexDirection: "row", gap: 6, marginBottom: 5 }}>
                    <Text style={{ width: 52, fontSize: 7, fontWeight: 800, color: "#b45309", backgroundColor: "#fef3c7", borderRadius: 3, paddingVertical: 2, textAlign: "center" }}>{mt.when}</Text>
                    <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.35 }}><Text style={{ fontWeight: 800 }}>{mt.title}</Text>{` – ${mt.text}`}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.row} wrap={false}>
            <View style={[styles.box, { flex: 1 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.h}>{t("serveTitle")}</Text>
                <Text style={{ fontSize: 7.5, fontWeight: 800 }}><Text style={{ color: BLUE }}>{shortNames.p1}</Text> · <Text style={{ color: RED }}>{shortNames.p2}</Text></Text>
              </View>
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
            <View style={[styles.box, { flex: 1 }]}>
              <Text style={styles.h}>{t("bigTitle")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 6 }}>
                {[
                  [t("bpSaved"), `${p1.breakPointsSaved}/${p1.breakPointsFaced}`, `${p2.breakPointsSaved}/${p2.breakPointsFaced}`, " · "],
                  [t("bpConverted"), `${p1.breakPointsWon}/${p1.breakPointChances}`, `${p2.breakPointsWon}/${p2.breakPointChances}`, " · "],
                  [t("deuceGames"), p1.deuceGamesWon, p2.deuceGamesWon, ":"],
                  [t("pressurePoints"), p1.pressurePointsWon, p2.pressurePointsWon, ":"],
                ].map(([label, a, b, sep]) => (
                  <View key={String(label)} style={{ width: "50%" }}>
                    <Text style={styles.label}>{label}</Text>
                    <Pair a={a} b={b} sep={String(sep)} size={12} />
                  </View>
                ))}
              </View>
              {pressure.pressure !== null && pressure.rest !== null && insights.pressurePointsPlayed >= 4 && (
                <Text style={[styles.sub, { fontSize: 7.5, marginTop: 6 }]}>{t("bigNote", { name: shortNames[focus], pct: pressure.pressure, rest: pressure.rest })}</Text>
              )}
            </View>
          </View>
        </View>
        <Footer t={t} generatedLabel={props.generatedLabel} />
      </Page>

      <Page size="A4" style={[styles.page, { paddingTop: 28 }]}>
        <View style={styles.body}>
          <Text style={[styles.headline, { marginBottom: 8 }]}>{t("pdfStatsTitle")}</Text>
          <View style={[styles.tableRow, { borderBottomColor: INK }]}>
            <Text style={[styles.tableHead, { flex: 1 }]}>{t("pdfStat")}</Text>
            <Text style={[styles.tableHead, { width: 70, textAlign: "right", color: BLUE }]}>{shortNames.p1}</Text>
            <Text style={[styles.tableHead, { width: 70, textAlign: "right", color: RED }]}>{shortNames.p2}</Text>
            {sets.length > 1 && sets.map((st) => <Text key={st.set} style={[styles.tableHead, { width: 52, textAlign: "right" }]}>{t("momentSet", { set: st.set })}</Text>)}
          </View>
          {statRows(t, p1, p2, detail).map((row, i) => {
            const bySet = sets.length > 1 ? sets.map((st) => statRows(t, insights.totalsBySet[st.set]?.p1 ?? p1, insights.totalsBySet[st.set]?.p2 ?? p2, detail)[i]) : []
            return (
              <View key={row.label} style={styles.tableRow} wrap={false}>
                <Text style={{ flex: 1 }}>{row.label}</Text>
                <Text style={{ width: 70, textAlign: "right", fontWeight: 800, color: BLUE }}>{row.a}</Text>
                <Text style={{ width: 70, textAlign: "right", fontWeight: 800, color: RED }}>{row.b}</Text>
                {bySet.map((s, j) => <Text key={j} style={{ width: 52, textAlign: "right", color: MUTED, fontSize: 8 }}>{`${s.a} · ${s.b}`}</Text>)}
              </View>
            )
          })}

          {detail && (
            <View style={[styles.box, { marginTop: 14 }]} wrap={false}>
              <Text style={styles.h}>{t("howTitle")}</Text>
              {(["p1", "p2"] as Side[]).map((s) => {
                const src = pointSources(insights, s)
                const share = (n: number) => `${src.total ? (100 * n) / src.total : 0}%`
                const color = side(s)
                return (
                  <View key={s} style={{ marginBottom: 7 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={{ fontWeight: 800, color }}>{t("howRow", { name: shortNames[s], count: src.total })}</Text>
                      <Text style={{ color: MUTED, fontSize: 8 }}>{t("howRowSub", { own: src.own, errors: src.errors })}</Text>
                    </View>
                    <View style={{ flexDirection: "row", height: 8, borderRadius: 4, backgroundColor: LINE, gap: 1 }}>
                      <View style={{ width: share(src.own), backgroundColor: color, opacity: 1 }} />
                      <View style={{ width: share(src.unforced), backgroundColor: color, opacity: 0.6 }} />
                      <View style={{ width: share(src.forced), backgroundColor: color, opacity: 0.4 }} />
                      <View style={{ width: share(src.doubleFaults), backgroundColor: color, opacity: 0.2 }} />
                    </View>
                  </View>
                )
              })}
              <Text style={{ fontSize: 7.5, color: MUTED }}>{[t("legendOwn"), t("legendUnforced"), t("legendForced"), t("legendDoubleFaults")].join(" · ")}</Text>
            </View>
          )}

          <View style={[styles.box, { marginTop: 10 }]} wrap={false}>
            <Text style={styles.h}>{t("runsTitle")}</Text>
            <Text style={styles.sub}>
              {[
                sets.filter((s) => s.durationSec).map((s) => `${t("momentSet", { set: s.set })}: ${formatSeconds(Math.round((s.durationSec ?? 0) / 60) * 60, locale)}`).join(" · "),
                insights.medianSecondsBetweenPoints !== null ? `${t("pace")}: ${t("paceValue", { seconds: insights.medianSecondsBetweenPoints })}` : "",
              ].filter(Boolean).join("   ·   ")}
            </Text>
            {insights.longestGame && (
              <Text style={[styles.sub, { marginTop: 3 }]}>
                {insights.longestGame.durationSec
                  ? t("longestGame", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length, duration: formatSeconds(insights.longestGame.durationSec, locale) })
                  : t("longestGameNoTime", { set: insights.longestGame.set, game: insights.longestGame.game, points: insights.longestGame.points.length })}
              </Text>
            )}
          </View>

          {props.analysis && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.headline, { marginBottom: 6 }]}>{t("pdfAiTitle")}</Text>
              <View style={[styles.box, { backgroundColor: "#f6f3ff", borderColor: "#ddd6fe" }]}>
                <Text style={{ fontSize: 9.5, lineHeight: 1.5, marginBottom: 8 }}>{props.analysis.analysis.summary}</Text>
                {([
                  [t("aiStrengths"), props.analysis.analysis.strengths],
                  [t("aiImprovements"), props.analysis.analysis.improvements],
                  [t("aiTraining"), props.analysis.analysis.trainingTips],
                ] as [string, string[]][]).filter(([, items]) => items.length).map(([title, items]) => (
                  <View key={title} style={{ marginBottom: 6 }} wrap={false}>
                    <Text style={[styles.label, { color: "#6d28d9", marginBottom: 2 }]}>{title}</Text>
                    {items.map((item, i) => <Text key={i} style={{ fontSize: 9, lineHeight: 1.45, marginBottom: 1.5 }}>{`•  ${item}`}</Text>)}
                  </View>
                ))}
                <Text style={{ fontSize: 7, color: FAINT, marginTop: 2 }}>{`${t("aiDisclaimer")} (${props.analysis.model})`}</Text>
              </View>
            </View>
          )}
        </View>
        <Footer t={t} generatedLabel={props.generatedLabel} />
      </Page>

      <Page size="A4" style={[styles.page, { paddingTop: 28 }]}>
        <View style={styles.body}>
          <Text style={[styles.headline, { marginBottom: 8 }]}>{t("pdfFlowTitle")}</Text>
          {sets.map((st) => (
            <View key={st.set} style={{ marginBottom: 10 }}>
              <Text style={[styles.h, { marginBottom: 3 }]}>{st.superTiebreak ? t("superTiebreakTitle", { score: setScoreLabel(st) }) : t("setTitle", { set: st.set, score: setScoreLabel(st) })}</Text>
              <View style={[styles.tableRow, { borderBottomColor: INK }]}>
                <Text style={[styles.tableHead, { width: 54 }]}>{t("pdfGame")}</Text>
                <Text style={[styles.tableHead, { width: 70 }]}>{t("pdfServer")}</Text>
                <Text style={[styles.tableHead, { flex: 1 }]}>{t("pdfPoints")}</Text>
                <Text style={[styles.tableHead, { width: 40, textAlign: "right" }]}>{t("pdfScore")}</Text>
                <Text style={[styles.tableHead, { width: 150, paddingLeft: 8 }]}>{t("pdfNotes")}</Text>
              </View>
              {insights.games.filter((g) => g.set === st.set).map((g) => {
                const notes = [
                  g.isBreak ? t("tagBreak") : "",
                  g.comebackFrom ? t("tagComeback", { from: g.comebackFrom }) : "",
                  g.breakPointsSaved > 0 && g.winner === g.server ? t("tagSaved", { count: g.breakPointsSaved }) : "",
                  g.deuce ? t("tagDeuce") : "",
                ].filter(Boolean).join(" · ")
                return (
                  <View key={g.game} style={styles.tableRow} wrap={false}>
                    <Text style={{ width: 54, fontWeight: 600 }}>{g.tiebreak ? t("flowTiebreak") : t("flowGame", { game: g.game })}</Text>
                    <Text style={{ width: 70, color: side(g.server) }}>{shortNames[g.server]}</Text>
                    <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                      {g.points.map((w, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: w === "p1" ? "#3b82f6" : "#ef4444" }} />)}
                    </View>
                    <Text style={{ width: 40, textAlign: "right", fontWeight: 800, color: g.winner ? side(g.winner) : FAINT }}>{g.winner ? `${g.gamesAfter[0]}:${g.gamesAfter[1]}` : "…"}</Text>
                    <Text style={{ width: 150, paddingLeft: 8, fontSize: 7.5, color: "#b45309" }}>{notes}</Text>
                  </View>
                )
              })}
            </View>
          ))}
        </View>
        <Footer t={t} generatedLabel={props.generatedLabel} />
      </Page>
    </Document>
  )
}
