import { notFound, redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import { ArrowLeft, ExternalLink, Play, Star } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { getServerTranslator } from "@/i18n/server-translator"
import { getCurrentUser } from "@/lib/auth"
import { getMainPlayer, getPlayerById } from "@/lib/actions/players"
import { getMatchesByPlayer } from "@/lib/actions/matches"
import { getMatchesWithStats } from "@/lib/actions/statistics"
import { Button } from "@/components/ui/button"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { PlayerMeta } from "@/components/shared/player-meta"
import type { Match } from "@/lib/types"
import { formatPlayerFromObject } from "@/lib/utils"
import { openSet, parseDbScore } from "@/lib/utils/db-score"
import { matchStatusKey } from "@/lib/utils/match-status"
import { matchPerspective } from "@/lib/utils/match-perspective"
import { headToHead, playerProgress, type ProgressRow } from "@/lib/utils/player-profile"

const PAGE = 100

/** The last 12 months of matches with point logs; the totals are worked out here, so the page stays light */
async function progressMatches(playerId: string): Promise<Match[]> {
  const since = new Date()
  since.setMonth(since.getMonth() - 12)
  const matches: Match[] = []
  let cursorAfter: string | undefined
  for (let page = 0; page < 6; page++) {
    const batch = await getMatchesWithStats(playerId, { limit: PAGE, cursorAfter, dateAfter: since.toISOString() })
    matches.push(...batch)
    if (batch.length < PAGE) break
    cursorAfter = batch[batch.length - 1].$id
  }
  return matches
}

/** The score from the main player's side: "6:4 3:6 10:7", with the set in play or cut short */
function scoreFor(match: Match, mainPlayerId: string) {
  const score = parseDbScore(match.score)
  const open = openSet(score, match.status !== "in-progress")
  const flip = [match.playerTwoId, match.playerFourId].includes(mainPlayerId)
  return [...score.sets, ...(open ? [open.games] : [])].map(([a, b]) => (flip ? `${b}:${a}` : `${a}:${b}`)).join(" ")
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const { id } = await params
  const [player, mainPlayer, t, locale] = await Promise.all([getPlayerById(id), getMainPlayer(), getServerTranslator("player"), getLocale()])
  if (!player || player.userId !== user.$id) notFound()

  const [matches, withPoints] = await Promise.all([getMatchesByPlayer(id), progressMatches(id).catch(() => [] as Match[])])
  const isMain = mainPlayer?.$id === player.$id
  const meetings = mainPlayer && !isMain ? headToHead(matches, player.$id, mainPlayer.$id) : null
  const progress = playerProgress(withPoints, player.$id)
  const name = formatPlayerFromObject(player)
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "numeric", year: "numeric" })
  const month = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
  const share = (part: number, total: number) => total > 0 ? t("profileShare", { percent: Math.round((part / total) * 100), part, total }) : "–"
  const result = (match: Match) => {
    const key = matchStatusKey(match)
    if (key === "in-progress") return { label: t("profileInProgress"), tone: "text-muted-foreground" }
    if (key !== "completed" || !mainPlayer) return { label: t("profileUnfinished"), tone: "text-muted-foreground" }
    return matchPerspective(match, mainPlayer.$id).isWin
      ? { label: t("profileWon"), tone: "text-win" }
      : { label: t("profileLost"), tone: "text-loss" }
  }
  const columns: [string, (row: ProgressRow) => string][] = [
    [t("profileMatches"), (row) => String(row.matches)],
    [t("profileRecord"), (row) => `${row.wins} : ${row.losses}`],
    [t("profileHolds"), (row) => share(row.serviceGamesHeld, row.serviceGames)],
    [t("profileBreaks"), (row) => share(row.breaks, row.returnGames)],
    [t("profilePoints"), (row) => share(row.pointsWon, row.pointsPlayed)],
    [t("profileSaved"), (row) => share(row.breakPointsSaved, row.breakPointsFaced)],
  ]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/players"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t("backToPlayers")}</Link>
      </Button>

      <section className="surface flex items-center gap-4 rounded-2xl p-4">
        <PlayerAvatar player={player} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <span className="name-gradient truncate">{name}</span>
            {isMain && <Star className="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" aria-label={t("mainPlayer")} />}
          </h1>
          <PlayerMeta players={[player]} />
          <p className="mt-1 text-xs text-muted-foreground">{t("profileTotalMatches", { count: matches.length })}</p>
          {player.cztennisUrl && (
            <a href={player.cztennisUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs text-muted-foreground underline underline-offset-2">
              <ExternalLink className="h-3 w-3" aria-hidden="true" />cztenis.cz
            </a>
          )}
        </div>
      </section>

      {mainPlayer && !isMain && (
        <Button asChild className="h-12 w-full">
          <Link href={`/matches/new?opponent=${player.$id}`}><Play className="mr-2 h-4 w-4" aria-hidden="true" />{t("profileStartMatch")}</Link>
        </Button>
      )}

      {meetings && mainPlayer && (
        <section className="surface rounded-2xl p-4" aria-labelledby="h2h-title">
          <h2 id="h2h-title" className="text-sm font-semibold">{t("profileHeadToHead")}</h2>
          {meetings.matches.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("profileNoMeetings")}</p>
          ) : (
            <>
              <p data-head-to-head className="mt-2 text-lg font-semibold tabular-nums">
                {t("profileHeadToHeadRecord", { main: mainPlayer.firstName, wins: meetings.wins, losses: meetings.losses, name: player.firstName })}
              </p>
              <ul className="mt-2 divide-y divide-border/60">
                {meetings.matches.map((match) => {
                  const outcome = result(match)
                  return (
                    <li key={match.$id}>
                      <Link href={`/matches/${match.$id}`} className="flex min-h-12 items-center gap-3 py-2 text-sm">
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">{date.format(new Date(match.matchDate))}</span>
                        <span className="min-w-0 flex-1 truncate font-mono tabular-nums">{scoreFor(match, mainPlayer.$id)}</span>
                        <span className={`shrink-0 text-xs font-semibold ${outcome.tone}`}>{outcome.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="surface rounded-2xl p-4" aria-labelledby="progress-title">
        <h2 id="progress-title" className="text-sm font-semibold">{t("profileProgress")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("profileProgressHint")}</p>
        {progress.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("profileNoProgress")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table data-progress className="w-full min-w-[36rem] text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("profileMonth")}</th>
                  {columns.map(([label]) => <th key={label} scope="col" className="py-2 pr-3 font-medium">{label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 tabular-nums">
                {progress.map((row) => (
                  <tr key={row.month}>
                    <th scope="row" className="py-2 pr-3 font-medium capitalize">{month.format(new Date(`${row.month}-01T12:00:00Z`))}</th>
                    {columns.map(([label, value]) => <td key={label} className="py-2 pr-3">{value(row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
