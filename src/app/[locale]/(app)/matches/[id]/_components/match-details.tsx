"use client"

import { Link } from "@/i18n/navigation"
import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { Calendar } from "lucide-react"
import { Trophy } from "lucide-react"
import { Share2 } from "lucide-react"
import { Play } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { Activity } from "lucide-react"
import { Users } from "lucide-react"
import { Target } from "lucide-react"
import { Player, PointDetail } from "@/lib/types"
import { toast } from "sonner"
import { MatchStatsComponentSimpleFixed } from "./match-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { CustomPointStats } from './custom-point-stats'
import { PointByPointView } from "./point-by-point-view"
import { useLocale, useTranslations } from "@/i18n"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"
import { PlayerMeta } from "@/components/shared/player-meta"
import { formatMatchDuration } from "@/lib/utils/statistics-summary"
import { endReasonMessageKey } from "@/lib/utils/end-reasons"
import { MatchDashboard } from "@/components/features/match-insights/match-dashboard"
import { MatchFlow } from "@/components/features/match-insights/match-flow"
import { AiAnalysisCard } from "@/components/features/match-insights/ai-analysis-card"
import { PdfExportButton } from "@/components/features/match-insights/pdf-export-button"
import { focusSide, shortSideNames } from "@/components/features/match-insights/labels"
import { buildMatchInsights, type Side } from "@/lib/utils/match-insights"
import { formatPlayerRating } from "@/lib/utils/player-rating"
import type { SavedAnalysis } from "@/lib/ai/match-analysis"
import { ShareScoreCardButton } from "@/components/shared/share-score-card-button"
import { normalizeMatchFormat } from "@/lib/utils/match-format"
import { parseDbScore } from "@/lib/utils/db-score"

interface MatchDetailsProps {
  match: {
    $id: string
    playerOneId: string
    playerTwoId: string
    playerThreeId?: string
    playerFourId?: string
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
    winner?: Player
    matchDate: string
    status: "In Progress" | "Completed"
    score: string
    scoreParsed?: {
      sets: { p1: number; p2: number }[]
      games: number[]
      points: number[]
    }
    pointLog: string[]
    matchFormat: string
    detailLevel?: 'points' | 'simple' | 'shot-type' | 'detailed' | 'complex' | 'custom'
    winnerId?: string
    startTime?: string
    endTime?: string
    setDurations?: number[]
    retirementReason?: string
    userId: string
    $collectionId: string
    $databaseId: string
    $createdAt: string
    $updatedAt: string
    $permissions: string[]
    tournamentName?: string
  }
  /** The two admin accounts see the AI analysis card */
  canUseAi?: boolean
}

export function MatchDetails({ match, canUseAi = false }: MatchDetailsProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const isDoubles = match.playerThreeId && match.playerFourId
  const t = useTranslations('common')
  const tMatch = useTranslations('match')
  const tInsights = useTranslations('insights')
  // Early endings (retirement, injury) are named on the badge and in the details
  const endReasonKey = endReasonMessageKey(match.retirementReason)
  const endReason = endReasonKey ? tMatch(endReasonKey) : null
  const locale = useLocale()

  // Everything the overview, flow tab and PDF show comes from the point log
  const pointDetails = useMemo(() => match.pointLog.map(pointStr => {
    try {
      return JSON.parse(pointStr) as PointDetail
    } catch {
      return null
    }
  }).filter((point): point is PointDetail => point !== null), [match.pointLog])
  const insights = useMemo(
    () => buildMatchInsights(pointDetails, { format: normalizeMatchFormat(match.matchFormat), detailLevel: match.detailLevel }),
    [pointDetails, match.matchFormat, match.detailLevel]
  )
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null)

  const handleShareMatch = () => {
    const shareUrl = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)

    toast.success(match.status === "Completed" ? t('linkCopiedResults') : t('linkCopiedLive'))
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // "30 s", "45 min", "1 h 5 min" in the page language, as on the statistics page
  const formatDuration = (durationMinutes: number) => formatMatchDuration(durationMinutes, locale) || t('unknown')

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const getMatchTitle = () => {
    if (isDoubles) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">{t('doublesMatch')}</span>
          </div>
          <div className="text-2xl font-bold">
            <span className="name-gradient">{getTeamName("team1")}</span>
          </div>
          <div className="text-lg text-muted-foreground">{t('vs')}</div>
          <div className="text-2xl font-bold">
            <span className="name-gradient">{getTeamName("team2")}</span>
          </div>
        </div>
      )
    }

    return (
      <h1 className="text-2xl font-bold">
        <span className="name-gradient">{getTeamName("team1")}</span> {t('vs')} <span className="name-gradient">{getTeamName("team2")}</span>
      </h1>
    )
  }

  const playerName = (player?: Player) => player ? formatPlayerFromObject(player) : t('unknownPlayer')

  const getTeamName = (team: "team1" | "team2") => {
    if (!isDoubles) {
      return team === "team1" ? playerName(match.playerOne) : playerName(match.playerTwo)
    }

    return team === "team1"
      ? `${playerName(match.playerOne)} / ${playerName(match.playerThree)}`
      : `${playerName(match.playerTwo)} / ${playerName(match.playerFour)}`
  }

  // Names, perspective and labels shared by the overview, the flow tab and the PDF report
  const sidePlayers = { p1: match.playerOne, p2: match.playerTwo, p3: match.playerThree, p4: match.playerFour }
  const fullNames: Record<Side, string> = { p1: getTeamName("team1"), p2: getTeamName("team2") }
  const shortNames = shortSideNames(sidePlayers, fullNames)
  const focus = focusSide(sidePlayers, insights.leader)
  const isCompleted = match.status === "Completed"
  // The stored winner decides the trophy: after a retirement the loser may have been ahead
  const winnerSide: Side | null = !match.winnerId ? null
    : match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId ? "p1"
    : match.winnerId === match.playerTwoId || match.winnerId === match.playerFourId ? "p2" : null
  const statusLabel = isCompleted ? `${t('completed')}${endReason ? ` — ${endReason}` : ''}` : t('inProgress')
  // A fixed time zone so the server and the browser print the same date
  const dateLabel = new Date(match.matchDate).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Prague" })
  const durationMinutes = match.startTime && match.endTime ? (Date.parse(match.endTime) - Date.parse(match.startTime)) / 60000 : null
  const durationText = durationMinutes && durationMinutes > 0 ? formatDuration(durationMinutes) : undefined
  const metaLine = (players: (Player | undefined)[]) => players
    .filter((player): player is Player => Boolean(player))
    .map(player => [player.yearOfBirth, formatPlayerRating(player), player.club].filter(Boolean).join(" · "))
    .filter(Boolean)
    .join(" / ")
  const storedScore = parseDbScore(match.score)
  const scoreboard = {
    sets: storedScore.sets,
    current: !isCompleted && (storedScore.games[0] > 0 || storedScore.games[1] > 0 || storedScore.sets.length === 0) ? storedScore.games : undefined,
  }
  const buildReport = () => ({
    insights,
    fullNames,
    shortNames,
    metaLines: { p1: metaLine([match.playerOne, match.playerThree]), p2: metaLine([match.playerTwo, match.playerFour]) },
    focus,
    winner: winnerSide,
    scoreboard,
    completed: isCompleted,
    dateLabel,
    tournamentName: match.tournamentName,
    durationText,
    analysis,
  })
  const reportFileParts = [shortNames.p1, shortNames.p2, match.matchDate.slice(0, 10)]
  // The details card: the played time, the time so far, or at least how many points were logged
  const matchDurationText = durationText
    ?? (match.startTime && !isCompleted ? `${formatDuration((Date.now() - Date.parse(match.startTime)) / 60000)} (${t('ongoing')})` : null)
    ?? (pointDetails.length > 0 ? t('pointsCount', { count: pointDetails.length }) : t('noData'))

  return (
    <div className="w-full">
      {/* Tournament/League Badge - REMOVE for mobile */}
      {/* Removed badge/button here */}
      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="w-full bg-background border-b">
          {/* One compact row of labelled icon buttons; text labels wrapped into three rows on phones */}
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <Button variant="outline" size="icon" asChild className="h-11 w-11">
              <Link href="/matches" aria-label={t('backToMatches')} title={t('backToMatches')}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {insights.hasPoints && (
                <PdfExportButton report={buildReport} filenameParts={reportFileParts} size="icon" variant="outline" className="h-11 w-11" />
              )}
              <ShareScoreCardButton
                compact
                fileName={`score-${match.$id}.png`}
                input={{
                  teamOne: isDoubles
                    ? `${match.playerOne ? formatPlayerFromObject(match.playerOne) : t('unknownPlayer')} / ${match.playerThree ? formatPlayerFromObject(match.playerThree) : t('unknownPlayer')}`
                    : (match.playerOne ? formatPlayerFromObject(match.playerOne) : t('unknownPlayer')),
                  teamTwo: isDoubles
                    ? `${match.playerTwo ? formatPlayerFromObject(match.playerTwo) : t('unknownPlayer')} / ${match.playerFour ? formatPlayerFromObject(match.playerFour) : t('unknownPlayer')}`
                    : (match.playerTwo ? formatPlayerFromObject(match.playerTwo) : t('unknownPlayer')),
                  sets: match.scoreParsed?.sets ?? [],
                  winner: match.status === "Completed"
                    ? (match.winnerId && match.winnerId === match.playerOne?.$id ? 'p1' : match.winnerId && match.winnerId === match.playerTwo?.$id ? 'p2' : null)
                    : null,
                  subtitle: new Date(match.matchDate).toLocaleDateString(locale),
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleShareMatch}
                aria-label={copiedLink ? t('copied') : match.status === "Completed" ? t('shareResults') : t('shareLive')}
                title={match.status === "Completed" ? t('shareResults') : t('shareLive')}
                className={`h-11 w-11 ${copiedLink ? "border-green-500/40 text-green-500" : ""}`}
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Player names section */}
          <div className="px-4 pb-4">
            <div className="text-center space-y-3">
              <div className="space-y-2">
                {isDoubles ? (
                  <>
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      <span className="name-gradient">{getTeamName("team1")}</span>
                    </h1>
                    <div className="text-lg font-medium text-muted-foreground">{t('vs')}</div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      <span className="name-gradient">{getTeamName("team2")}</span>
                    </h2>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      <span className="name-gradient">{getTeamName("team1")}</span>
                    </h1>
                    <div className="text-lg font-medium text-muted-foreground">{t('vs')}</div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      <span className="name-gradient">{getTeamName("team2")}</span>
                    </h2>
                  </>
                )}
              </div>
              {/* Match details */}
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateTime(match.matchDate)}</span>
                </div>
                {match.tournamentName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('tournamentLeague')}</span>
                    <span className="text-sm font-medium">{match.tournamentName}</span>
                  </div>
                )}
              </div>

              {/* Continue match button for in-progress matches */}
              {match.status === "In Progress" && (
                <Button size="sm" asChild className="mt-3">
                  <Link href={`/matches/live/${match.$id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    {t('continuScoring')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container mx-auto p-4 max-w-6xl">
          {/* Actions row first, title on its own row so it never squeezes between buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/matches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToMatches')}
              </Link>
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {insights.hasPoints && (
                <PdfExportButton report={buildReport} filenameParts={reportFileParts} size="sm" variant="outline" />
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShareMatch}
                className={copiedLink ? "bg-green-50 border-green-200" : ""}
              >
                <Share2 className="h-4 w-4 mr-2" />
                {copiedLink ? t('copied') : match.status === "Completed" ? t('shareResults') : t('shareLive')}
              </Button>
              {match.status === "In Progress" && (
                <Button size="sm" asChild>
                  <Link href={`/matches/live/${match.$id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    {t('continuScoring')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mb-6 min-w-0">
            {getMatchTitle()}
            <p className="text-muted-foreground">
              {t('matchDetails')} • {formatDateTime(match.matchDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 md:px-4 max-w-6xl">

      <Tabs defaultValue="overview" className="space-y-6">
        {/* Icon over a short label on phones, side by side from sm; bare icons were hard to tell apart */}
        <TabsList className="grid w-full grid-cols-4 min-h-14 sm:min-h-10">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-0.5 px-1 py-1.5 whitespace-normal leading-tight sm:flex-row sm:gap-2 sm:px-3">
            <Trophy className="h-4 w-4" />
            <span className="text-[11px] sm:text-sm">{t('overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="flow" className="flex flex-col items-center gap-0.5 px-1 py-1.5 whitespace-normal leading-tight sm:flex-row sm:gap-2 sm:px-3">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[11px] sm:text-sm">{tInsights('tabFlow')}</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex flex-col items-center gap-0.5 px-1 py-1.5 whitespace-normal leading-tight sm:flex-row sm:gap-2 sm:px-3">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[11px] sm:text-sm">{t('statistics')}</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="flex flex-col items-center gap-0.5 px-1 py-1.5 whitespace-normal leading-tight sm:flex-row sm:gap-2 sm:px-3">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] sm:text-sm">{t('pointLog')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab: the match dashboard, then the match details */}
        <TabsContent value="overview" className="space-y-6">
          <MatchDashboard
            insights={insights}
            players={sidePlayers}
            fullNames={fullNames}
            shortNames={shortNames}
            focus={focus}
            winner={winnerSide}
            scoreboard={scoreboard}
            completed={isCompleted}
            statusLabel={statusLabel}
            dateLabel={dateLabel}
            tournamentName={match.tournamentName}
            durationText={durationText}
            aiCard={canUseAi && insights.hasPoints ? <AiAnalysisCard matchId={match.$id} onChange={setAnalysis} /> : undefined}
            actions={insights.hasPoints ? (
              <div className="flex gap-2.5">
                <PdfExportButton report={buildReport} filenameParts={reportFileParts} className="h-12 flex-1 rounded-xl" />
                <Button variant="outline" size="lg" className="h-12 flex-1 rounded-xl" onClick={handleShareMatch}>
                  <Share2 className="h-4 w-4" />
                  {copiedLink ? t('copied') : isCompleted ? t('shareResults') : t('shareLive')}
                </Button>
              </div>
            ) : undefined}
          />

        {/* Match Information & Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Match Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('matchDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('date')}</span>
                  <span className="text-sm font-medium">{formatFullDate(match.matchDate)}</span>
                </div>
                {match.tournamentName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('tournamentLeague')}</span>
                    <span className="text-sm font-medium">{match.tournamentName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('duration')}</span>
                  <span className="text-sm font-medium">{matchDurationText}</span>
                </div>
                {match.startTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('started')}</span>
                    <span className="text-sm font-medium">{formatTime(match.startTime)}</span>
                  </div>
                )}
                {match.endTime && match.status === "Completed" && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('finished')}</span>
                    <span className="text-sm font-medium">{formatTime(match.endTime)}</span>
                  </div>
                )}
                {endReason && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t('reason')}</span>
                    <span className="text-sm font-medium text-orange-600">{endReason}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('format')}</span>
                  <span className="text-sm font-medium">
                    {(() => {
                      try {
                        const format = JSON.parse(match.matchFormat)
                        return `${t('bestOf')} ${format.sets} ${format.noAd ? `(${t('noAd')})` : ''}`
                                                      } catch {
                          return t('standard')
                        }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('type')}</span>
                  <span className="text-sm font-medium">{isDoubles ? t('doubles') : t('singles')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players/Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {isDoubles ? t('teams') : t('players')}
              </CardTitle>
            </CardHeader>
            <CardContent data-players-card>
              {/* Same look as the live scoreboard: one row per side, split by a hairline */}
              <div className="divide-y divide-foreground/[0.06]">
                {([
                  ["team1", match.playerOne, match.playerThree],
                  ["team2", match.playerTwo, match.playerFour],
                ] as const).map(([team, main, partner]) => (
                  <div key={team} data-side={team} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    {main && <PlayerAvatar player={main} className="h-10 w-10 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        <span className="name-gradient">{getTeamName(team)}</span>
                      </div>
                      <PlayerMeta players={[main, isDoubles ? partner : undefined]} className="mt-0.5 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        {/* Flow Tab: every game in order */}
        <TabsContent value="flow" className="space-y-6">
          <MatchFlow insights={insights} names={shortNames} />
        </TabsContent>

        {/* Point Log Tab */}
        <TabsContent value="points" className="space-y-6">
          {(() => {
            // Parse point log for PointByPointView component
            const pointDetails = match.pointLog.map(pointStr => {
              try {
                return JSON.parse(pointStr) as PointDetail
              } catch {
                return null
              }
            }).filter((point): point is PointDetail => point !== null)

            if (pointDetails.length === 0) {
              return (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">{t('noPointLogTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('noPointLogHint')}</p>
                  </CardContent>
                </Card>
              )
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    {t('pointByPointTitle', { count: pointDetails.length })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PointByPointView
                    pointLog={pointDetails}
                    detailLevel={match.detailLevel === 'custom' ? 'complex' : match.detailLevel}
                    playerObjects={match.playerOne && match.playerTwo ? {
                      p1: match.playerOne,
                      p2: match.playerTwo,
                      ...(match.playerThree ? { p3: match.playerThree } : {}),
                      ...(match.playerFour ? { p4: match.playerFour } : {})
                    } : undefined}
                  />
                </CardContent>
              </Card>
            )
          })()}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {(() => {
            // Parse point details for statistics
            const pointDetails = match.pointLog.map(pointStr => {
              try {
                return JSON.parse(pointStr) as PointDetail
              } catch {
                return null
              }
            }).filter((point): point is PointDetail => point !== null)

            // Calculate modern match stats
            calculateMatchStats(pointDetails)

            if (pointDetails.length === 0) {
              return (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">{t('noStatsTitle')}</p>
                    <p className="text-sm text-muted-foreground">{t('noStatsHint')}</p>
                  </CardContent>
                </Card>
              )
            }

            const parsedMatchFormat = (() => {
              try {
                return JSON.parse(match.matchFormat)
              } catch {
                return { detailLevel: 'simple' }
              }
            })()
            
            const detailLevel = match.detailLevel || parsedMatchFormat.detailLevel || 'simple'
            const stats = calculateMatchStats(pointDetails)
            
            return (
              <><CustomPointStats points={pointDetails} players={[
                match.playerOne ? formatPlayerFromObject(match.playerOne) : t('player1'),
                match.playerTwo ? formatPlayerFromObject(match.playerTwo) : t('player2'),
              ]} /><MatchStatsComponentSimpleFixed
                stats={stats}
                playerNames={{
                  p1: match.playerOne ? formatPlayerFromObject(match.playerOne) : t('player1'),
                  p2: match.playerTwo ? formatPlayerFromObject(match.playerTwo) : t('player2')
                }}
                detailLevel={detailLevel}
                pointLog={pointDetails}
              /></>
            )
          })()}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
