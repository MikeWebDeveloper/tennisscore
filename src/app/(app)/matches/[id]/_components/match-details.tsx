"use client"

import Link from "next/link"
import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  Share2, 
  Play, 
  TrendingUp,
  BarChart3,
  Activity,
  Users,
  Target
} from "lucide-react"
import { Player, PointDetail } from "@/lib/types"
import { toast } from "sonner"
import { MatchStatsComponentSimpleFixed } from "./match-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { PointByPointView } from "./point-by-point-view"
import { useTranslations } from "@/hooks/use-translations"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { formatPlayerFromObject } from "@/lib/utils"

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
}

// PlayerDetailsLine: shows year, rating, and club in scoreboard style
function PlayerDetailsLine({ yearOfBirth, rating, club }: { yearOfBirth?: number; rating?: string; club?: string }) {
  return (
    <div className="space-y-0.5">
      {(yearOfBirth || rating) && (
        <div className="player-details-line flex gap-1">
          {yearOfBirth && (
            <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">{yearOfBirth}</span>
          )}
          {rating && (
            <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium">({rating})</span>
          )}
        </div>
      )}
      {club && (
        <div className="player-details-line">
          <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium">{club}</span>
        </div>
      )}
    </div>
  )
}

export function MatchDetails({ match }: MatchDetailsProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const isDoubles = match.playerThreeId && match.playerFourId
  const t = useTranslations()

  // Debug timing data
  console.log('Match timing data received:', {
    startTime: match.startTime,
    endTime: match.endTime,
    setDurations: match.setDurations,
    status: match.status
  })

  const handleShareMatch = () => {
    const shareUrl = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    
    const shareText = match.status === "Completed" 
      ? "Match results link copied to clipboard!"
      : "Live match link copied to clipboard!"
    toast.success(shareText)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const formatDuration = (durationMinutes?: number) => {
    console.log('formatDuration called with:', durationMinutes)
    
    if (durationMinutes === undefined || durationMinutes === null) return "Unknown"
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    
    // Handle very short durations (less than 1 minute)
    if (durationMinutes < 1) {
      return "< 1m"
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-GB", {
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
            {match.playerOne && formatPlayerFromObject(match.playerOne)} / {match.playerThree && formatPlayerFromObject(match.playerThree)}
          </div>
          <div className="text-lg text-muted-foreground">vs</div>
          <div className="text-2xl font-bold">
            {match.playerTwo && formatPlayerFromObject(match.playerTwo)} / {match.playerFour && formatPlayerFromObject(match.playerFour)}
          </div>
        </div>
      )
    }
    
    return (
      <h1 className="text-2xl font-bold">
        {match.playerOne && formatPlayerFromObject(match.playerOne)} vs{" "}
        {match.playerTwo && formatPlayerFromObject(match.playerTwo)}
      </h1>
    )
  }

  const getTeamName = (team: "team1" | "team2") => {
    if (!isDoubles) {
      return team === "team1" 
        ? (match.playerOne ? formatPlayerFromObject(match.playerOne) : "Unknown Player")
        : (match.playerTwo ? formatPlayerFromObject(match.playerTwo) : "Unknown Player")
    }
    
    return team === "team1"
      ? `${match.playerOne && formatPlayerFromObject(match.playerOne)} / ${match.playerThree && formatPlayerFromObject(match.playerThree)}`
      : `${match.playerTwo && formatPlayerFromObject(match.playerTwo)} / ${match.playerFour && formatPlayerFromObject(match.playerFour)}`
  }

  return (
    <div className="w-full">
      {/* Tournament/League Badge - REMOVE for mobile */}
      {/* Removed badge/button here */}
      {/* Mobile Header */}
      <div className="block md:hidden">
        <div className="w-full bg-background border-b">
          {/* Top row: Back button and Share button */}
          <div className="flex items-center justify-between p-2">
            <Button variant="outline" size="sm" asChild className="flex items-center gap-1 text-xs px-2 py-1 h-8">
              <Link href="/matches">
                <ArrowLeft className="h-3 w-3" />
                <span>{t('backToMatches')}</span>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShareMatch}
              className={`flex items-center gap-1 text-xs px-2 py-1 h-8 ${copiedLink ? "bg-green-50 border-green-200" : ""}`}
            >
              <Share2 className="h-3 w-3" />
              <span>{copiedLink ? t('copied') : match.status === "Completed" ? t('shareResults') : t('shareLive')}</span>
            </Button>
          </div>

          {/* Player names section */}
          <div className="px-4 pb-4">
            <div className="text-center space-y-3">
              <div className="space-y-2">
                {isDoubles ? (
                  <>
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      {match.playerOne ? formatPlayerFromObject(match.playerOne) : "Unknown Player"} / {match.playerThree ? formatPlayerFromObject(match.playerThree) : "Unknown Player"}
                    </h1>
                    <div className="text-lg font-medium text-muted-foreground">{t('vs')}</div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {match.playerTwo ? formatPlayerFromObject(match.playerTwo) : "Unknown Player"} / {match.playerFour ? formatPlayerFromObject(match.playerFour) : "Unknown Player"}
                    </h2>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-foreground leading-tight">
                      {match.playerOne ? formatPlayerFromObject(match.playerOne) : "Unknown Player"}
                    </h1>
                    <div className="text-lg font-medium text-muted-foreground">{t('vs')}</div>
                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {match.playerTwo ? formatPlayerFromObject(match.playerTwo) : "Unknown Player"}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/matches">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToMatches')}
                </Link>
              </Button>
              <div>
                {getMatchTitle()}
                <p className="text-muted-foreground">
                  {t('matchDetails')} • {formatDateTime(match.matchDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Content Container */}
      <div className="container mx-auto px-4 md:px-4 max-w-6xl">

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 md:h-10">
          <TabsTrigger value="overview" className="flex items-center gap-1 px-2 md:gap-2 md:px-3">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">{t('overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-1 px-2 md:gap-2 md:px-3">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{t('pointLog')}</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-1 px-2 md:gap-2 md:px-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('statistics')}</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1 px-2 md:gap-2 md:px-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t('analysis')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {(() => {
            // Parse score data and calculate match insights
            const pointDetails = match.pointLog.map(pointStr => {
              try {
                return JSON.parse(pointStr) as PointDetail
              } catch {
                return null
              }
            }).filter((point): point is PointDetail => point !== null)

            const stats = calculateMatchStats(pointDetails)
            let score: { sets?: Array<number[] | { p1?: number; p2?: number; [key: number]: number }> } = {}
            try {
              score = JSON.parse(match.score || "{}")
            } catch {}

            const formatSetsScore = () => {
              if (!score.sets || score.sets.length === 0) return "0-0"
              
              return score.sets.map((set: number[] | { p1?: number; p2?: number; [key: number]: number }) => {
                const p1Score = Array.isArray(set) ? set[0] : set.p1 || set[0] || 0
                const p2Score = Array.isArray(set) ? set[1] : set.p2 || set[1] || 0
                return `${p1Score}-${p2Score}`
              }).join(", ")
            }

            const getSetsWon = () => {
              if (!score.sets || score.sets.length === 0) return { p1: 0, p2: 0 }
              
              let p1Sets = 0, p2Sets = 0
              score.sets.forEach((set: number[] | { p1?: number; p2?: number; [key: number]: number }) => {
                const p1Score = Array.isArray(set) ? set[0] : set.p1 || set[0] || 0
                const p2Score = Array.isArray(set) ? set[1] : set.p2 || set[1] || 0
                if (p1Score > p2Score) p1Sets++
                else if (p2Score > p1Score) p2Sets++
              })
              return { p1: p1Sets, p2: p2Sets }
            }

            const setsWon = getSetsWon()
            const totalPoints = stats.totalPoints
            // Calculate match duration from start/end time
            const getMatchDuration = () => {
              console.log('getMatchDuration called with:', {
                startTime: match.startTime,
                endTime: match.endTime,
                status: match.status
              })
              
              if (match.startTime && match.endTime) {
                const durationMs = Date.parse(match.endTime) - Date.parse(match.startTime)
                const totalMinutes = Math.floor(durationMs / (1000 * 60))
                console.log('Duration calculation:', { durationMs, totalMinutes })
                return formatDuration(totalMinutes)
              } else if (match.startTime && match.status === "In Progress") {
                const durationMs = Date.now() - Date.parse(match.startTime)
                const totalMinutes = Math.floor(durationMs / (1000 * 60))
                console.log('Ongoing duration calculation:', { durationMs, totalMinutes })
                return formatDuration(totalMinutes) + " (ongoing)"
              }
              
              console.log('No timing data available, falling back')
              return pointDetails.length > 0 ? `${pointDetails.length} points` : "No data"
            }

            const matchDurationText = getMatchDuration()

            return (
              <>
                {/* Hero Match Score */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.05)_0%,_transparent_50%)]"></div>
                  <div className="relative z-10">
                    <div className="text-center space-y-6">
                      <div className="flex items-center justify-center gap-3">
                        <Badge variant="secondary" className="text-white bg-white/20">
                          {match.status}
                        </Badge>
                        {match.status === "Completed" && (
                          <Badge className="bg-green-500 text-white">
                            <Trophy className="w-3 h-3 mr-1" />
{t('completed')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-6xl font-mono font-bold tracking-tight">
                          {setsWon.p1} - {setsWon.p2}
                        </div>
                        <div className="text-lg text-slate-300">
                          Sets: {formatSetsScore()}
                        </div>
                      </div>

                      {match.winner && (
                        <div className="flex items-center justify-center gap-2 text-yellow-400">
                          <Trophy className="h-6 w-6" />
                          <span className="text-xl font-semibold">
                            {(() => {
                              if (isDoubles && match.winnerId) {
                                // For doubles, determine which team won and display both players
                                if (match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId) {
                                  // Team 1 won
                                  return `${getTeamName("team1")} Wins!`
                                } else if (match.winnerId === match.playerTwoId || match.winnerId === match.playerFourId) {
                                  // Team 2 won
                                  return `${getTeamName("team2")} Wins!`
                                }
                              }
                              // For singles or fallback
                              return `${formatPlayerFromObject(match.winner)} Wins!`
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Match Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                    <CardContent className="p-6 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                                                  <div className="text-3xl font-bold text-blue-900">{totalPoints}</div>
                        <div className="text-sm text-blue-600">{t('totalPoints')}</div>
                        </div>
                        <div className="text-xs text-blue-500">
                          {stats.totalPointsWonByPlayer[0]} - {stats.totalPointsWonByPlayer[1]}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-6 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                                                  <div className="text-xl font-bold text-green-900">{matchDurationText}</div>
                        <div className="text-sm text-green-600">{t('duration')}</div>
                        </div>
                        {match.startTime && (
                          <div className="text-xs text-green-500">
                            {t('started')}: {formatTime(match.startTime)}
                          </div>
                        )}
                        {match.endTime && match.status === "Completed" && (
                          <div className="text-xs text-green-500">
{t('ended')}: {formatTime(match.endTime)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                    <CardContent className="p-6 text-center">
                      <div className="space-y-3">
                        <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                          <Target className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-purple-900">{stats.acesByPlayer[0] + stats.acesByPlayer[1]}</div>
                          <div className="text-sm text-purple-600">{t('totalAces')}</div>
                        </div>
                        <div className="text-xs text-purple-500">
                          {stats.acesByPlayer[0]} - {stats.acesByPlayer[1]}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                        {match.retirementReason && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Reason</span>
                            <span className="text-sm font-medium text-orange-600 capitalize">{match.retirementReason}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Format</span>
                          <span className="text-sm font-medium">
                            {(() => {
                              try {
                                const format = JSON.parse(match.matchFormat)
                                return `Best of ${format.sets} ${format.noAd ? '(No-Ad)' : ''}`
                              } catch {
                                return "Standard"
                              }
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Type</span>
                          <span className="text-sm font-medium">{isDoubles ? "Doubles" : "Singles"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Players/Teams */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {isDoubles ? "Teams" : "Players"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          {match.playerOne && (
                            <PlayerAvatar
                              player={match.playerOne}
                              className="h-10 w-10"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">
                              {getTeamName("team1")}
                            </div>
                            {match.playerOne && (
                              <PlayerDetailsLine
                                yearOfBirth={match.playerOne.yearOfBirth}
                                rating={match.playerOne.rating}
                                club={match.playerOne.club}
                              />
                            )}
                            {/* For doubles, show partner details */}
                            {isDoubles && match.playerThree && (
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">/</span>
                                <PlayerDetailsLine
                                  yearOfBirth={match.playerThree.yearOfBirth}
                                  rating={match.playerThree.rating}
                                  club={match.playerThree.club}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          {match.playerTwo && (
                            <PlayerAvatar
                              player={match.playerTwo}
                              className="h-10 w-10"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold">
                              {getTeamName("team2")}
                            </div>
                            {match.playerTwo && (
                              <PlayerDetailsLine
                                yearOfBirth={match.playerTwo.yearOfBirth}
                                rating={match.playerTwo.rating}
                                club={match.playerTwo.club}
                              />
                            )}
                            {/* For doubles, show partner details */}
                            {isDoubles && match.playerFour && (
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">/</span>
                                <PlayerDetailsLine
                                  yearOfBirth={match.playerFour.yearOfBirth}
                                  rating={match.playerFour.rating}
                                  club={match.playerFour.club}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Set by Set Breakdown */}
                {score.sets && score.sets.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Set by Set Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {score.sets.map((set: number[] | { p1?: number; p2?: number; [key: number]: number }, index: number) => {
                          const p1Score = Array.isArray(set) ? set[0] : set.p1 || set[0] || 0
                          const p2Score = Array.isArray(set) ? set[1] : set.p2 || set[1] || 0
                          const setWinner = p1Score > p2Score ? "p1" : p2Score > p1Score ? "p2" : null
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">Set {index + 1}</span>
                                {setWinner && (
                                  <div className={`w-2 h-2 rounded-full ${setWinner === 'p1' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                                )}
                              </div>
                              <div className="font-mono font-bold text-lg">
                                {p1Score} - {p2Score}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )
          })()}
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
                    <p className="text-muted-foreground mb-2">No detailed point log available for this match.</p>
                    <p className="text-sm text-muted-foreground">Enable detailed logging during live scoring to see point-by-point analysis.</p>
                  </CardContent>
                </Card>
              )
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Point-by-Point Analysis ({pointDetails.length} points)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PointByPointView pointLog={pointDetails} />
                </CardContent>
              </Card>
            )
          })()}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <MatchStatsComponentSimpleFixed 
            stats={calculateMatchStats(match.pointLog.map(pointStr => {
              try {
                return JSON.parse(pointStr) as PointDetail
              } catch {
                return null
              }
            }).filter((point): point is PointDetail => point !== null))}
            playerNames={{
              p1: getTeamName("team1"),
              p2: getTeamName("team2")
            }}
            detailLevel={(() => {
              try {
                const format = JSON.parse(match.matchFormat)
                return format.detailLevel || "simple"
              } catch {
                return "simple"
              }
            })()}
            pointLog={match.pointLog.map(pointStr => {
              try {
                return JSON.parse(pointStr) as PointDetail
              } catch {
                return null
              }
            }).filter((point): point is PointDetail => point !== null)}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {(() => {
            // Parse point details for deep analysis
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
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-2">No detailed analysis available for this match.</p>
                    <p className="text-sm text-muted-foreground">Enable detailed logging during live scoring to see AI-powered match insights.</p>
                  </CardContent>
                </Card>
              )
            }

            const stats = calculateMatchStats(pointDetails)
            const totalPoints = pointDetails.length

            // Key momentum analysis
            const lastTenPoints = pointDetails.slice(-10)
            const momentumP1 = lastTenPoints.filter(p => p.winner === 'p1').length
            const momentumP2 = lastTenPoints.filter(p => p.winner === 'p2').length

            // Break point analysis
            const breakPointsCreated = pointDetails.filter(p => p.isBreakPoint).length
            const breakPointsConverted = pointDetails.filter(p => p.isBreakPoint && p.isGameWinning).length
            const breakPointConversion = breakPointsCreated > 0 ? (breakPointsConverted / breakPointsCreated * 100) : 0

            // Service game analysis
            const serviceGames = pointDetails.filter(p => p.isGameWinning).length
            const breaksOfServe = pointDetails.filter(p => p.isGameWinning && p.server !== p.winner).length

            // Set analysis
            let score: { sets?: Array<number[] | { p1?: number; p2?: number; [key: number]: number }> } = {}
            try {
              score = JSON.parse(match.score || "{}")
            } catch {}

            const setsPlayed = score.sets?.length || 0

            return (
              <div className="space-y-6">
                {/* Performance Summary */}
                <Card className="border-gradient-to-r from-blue-200 to-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Match Analysis & Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-blue-900">MATCH SUMMARY</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('totalPointsPlayed')}</span>
                              <span className="font-semibold">{totalPoints}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Sets Completed</span>
                              <span className="font-semibold">{setsPlayed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service Games</span>
                              <span className="font-semibold">{serviceGames}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Breaks of Serve</span>
                              <span className="font-semibold text-red-600">{breaksOfServe}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 text-purple-900">MOMENTUM TRACKER</h4>
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground mb-1">Last 10 Points</div>
                            <div className="flex gap-1 mb-2">
                              {lastTenPoints.map((point, index) => (
                                <div
                                  key={index}
                                  className={`w-3 h-3 rounded-full ${
                                    point.winner === 'p1' ? 'bg-blue-500' : 'bg-red-500'
                                  }`}
                                  title={`Point ${pointDetails.length - 9 + index}: ${point.winner === 'p1' ? getTeamName("team1") : getTeamName("team2")}`}
                                />
                              ))}
                            </div>
                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-600">{getTeamName("team1")}</span>
                                <span className="font-bold text-blue-600">{momentumP1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-red-600">{getTeamName("team2")}</span>
                                <span className="font-bold text-red-600">{momentumP2}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Break Point Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-orange-900 text-lg">Break Point Pressure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-900">{breakPointConversion.toFixed(0)}%</div>
                          <div className="text-sm text-orange-600">Conversion Rate</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('breakPointsCreated')}</span>
                            <span className="font-semibold">{breakPointsCreated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('breakPointsConverted')}</span>
                            <span className="font-semibold text-orange-600">{breakPointsConverted}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {breakPointConversion > 40 
                            ? "Excellent conversion rate - efficient in big moments"
                            : breakPointConversion > 25
                            ? "Good conversion rate - capitalizing on opportunities"
                            : "Room for improvement on big points"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader>
                      <CardTitle className="text-green-900 text-lg">Service Dominance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-900">
                            {serviceGames > 0 ? ((serviceGames - breaksOfServe) / serviceGames * 100).toFixed(0) : 0}%
                          </div>
                          <div className="text-sm text-green-600">Service Games Held</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Service Games</span>
                            <span className="font-semibold">{serviceGames}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Games Lost on Serve</span>
                            <span className="font-semibold text-red-600">{breaksOfServe}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {breaksOfServe === 0
                            ? "Perfect service record - no breaks of serve"
                            : breaksOfServe < serviceGames * 0.2
                            ? "Strong service games - rarely broken"
                            : "Service games under pressure"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Point Distribution Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Point Distribution Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-900">{stats.acesByPlayer[0]}</div>
                                                    <div className="text-xs text-blue-600">{t('aces')} - {getTeamName("team1")}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50">
                        <div className="text-2xl font-bold text-red-900">{stats.acesByPlayer[1]}</div>
                                                    <div className="text-xs text-red-600">{t('aces')} - {getTeamName("team2")}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-900">{stats.doubleFaultsByPlayer[0]}</div>
                        <div className="text-xs text-yellow-600">DFs - {getTeamName("team1")}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-orange-50">
                        <div className="text-2xl font-bold text-orange-900">{stats.doubleFaultsByPlayer[1]}</div>
                        <div className="text-xs text-orange-600">DFs - {getTeamName("team2")}</div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2"><strong>Performance Insights:</strong></p>
                      <ul className="space-y-1 text-xs">
                        <li>• Service power: {stats.acesByPlayer[0] + stats.acesByPlayer[1]} aces served total</li>
                        <li>• Pressure points: {breakPointsCreated} break point opportunities created</li>
                        <li>• Match rhythm: {totalPoints} points over {setsPlayed} sets ({(totalPoints / Math.max(setsPlayed, 1)).toFixed(1)} points per set)</li>
                        {match.startTime && match.endTime && (
                          <li>• Playing pace: {(() => {
                            const durationMs = Date.parse(match.endTime) - Date.parse(match.startTime)
                            const durationMinutes = durationMs / (1000 * 60)
                            return (totalPoints / durationMinutes).toFixed(1)
                          })()} points per minute</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
} 