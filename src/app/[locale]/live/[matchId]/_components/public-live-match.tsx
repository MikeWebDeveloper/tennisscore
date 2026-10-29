"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { Trophy } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { Wifi } from "lucide-react"
import { WifiOff } from "lucide-react"
import { Player, MatchFormat, PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { toast } from "sonner"
import { useRealtimeMatch } from "@/hooks/use-realtime-match"
import { MatchStatsComponentSimpleFixed } from "@/app/[locale]/(app)/matches/[id]/_components/match-stats"
import { PointByPointView } from "@/app/[locale]/(app)/matches/[id]/_components/point-by-point-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LiveScoreboard } from "@/components/shared/live-scoreboard"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { MatchTimerDisplay } from "@/app/[locale]/(app)/matches/live/[id]/_components/MatchTimerDisplay"
import { MomentumBar } from "@/components/ui/momentum-bar"
import { formatPlayerFromObject, formatDate } from "@/lib/utils"
import { formatPlayerRating } from "@/components/shared/player-rating-display"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { deriveCurrentServer } from "@/lib/utils/current-server"
import { getNextDoublesServer, startsNewServeTurn } from "@/lib/utils/doubles-serving"
import { normalizeMatchFormat } from "@/lib/utils/match-format"
import { parseDbScore } from "@/lib/utils/db-score"
import { useTranslations, useLocale } from "@/i18n"

type Score = import("@/stores/matchStore").Score

interface PublicLiveMatchProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    playerThree?: Player
    playerFour?: Player
    score: string
    matchFormatParsed: MatchFormat
    detailLevel?: "points" | "simple" | "complex"
    status: "In Progress" | "Completed"
    pointLog?: string[]
    winnerId?: string
    matchDate: string
    startTime?: string | null
    endTime?: string | null
    setDurations?: number[]
    tournamentName?: string
    tournamentDescription?: string
  }
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function PublicLiveMatch({ match: initialMatch }: PublicLiveMatchProps) {
  const t = useTranslations('match')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [match, setMatch] = useState(initialMatch)
  const [score, setScore] = useState<Score>(() => parseDbScore(initialMatch.score))
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Only start real-time connection after component mounts to prevent hydration issues
  const { connected, lastUpdate, error, retryCount } = useRealtimeMatch(mounted ? match.$id : "")

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse point log
  useEffect(() => {
    if (!match.pointLog || match.pointLog.length === 0) {
      setPointLog([])
      return
    }
    if (match.pointLog && match.pointLog.length > 0) {
      try {
        const parsedPointLog: PointDetail[] = match.pointLog.map(pointStr => JSON.parse(pointStr))
        setPointLog(parsedPointLog)
      } catch (error) {
        console.error("Failed to parse point log:", error)
      }
    }
  }, [match.pointLog])

  // Update match when real-time data changes
  useEffect(() => {
    if (lastUpdate && mounted) {
      console.log("🔄 Real-time update received:", lastUpdate)
      if (typeof lastUpdate.score === 'string') setScore(parseDbScore(lastUpdate.score))

      setMatch(prev => ({
        ...prev,
        status: lastUpdate.status || prev.status,
        pointLog: lastUpdate.pointLog || prev.pointLog,
        winnerId: lastUpdate.winnerId || prev.winnerId,
      }))
    }
  }, [lastUpdate, mounted])

  const shareMatch = async () => {
    const url = window.location.href
    const title = `${formatPlayerFromObject(match.playerOne)} ${t('vs')} ${formatPlayerFromObject(match.playerTwo)} - ${t('liveTennisMatch')}`
    const text = t('watchLiveMatchText')
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Try native share first if available and on mobile
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title,
          text,
          url
        })
        toast.success(t('matchLinkCopied'))
        return
      } catch (err) {
        // User canceled or error occurred, fall through to clipboard
        console.log("Native share failed or canceled:", err)
      }
    }
    
    // Fallback to clipboard copy for desktop or when native share fails
    fallbackShare(url)
  }

  const fallbackShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t('matchLinkCopied'))
    } catch {
      // If clipboard fails, show the URL in an alert
      toast.error(`Copy this link manually: ${url}`)
    }
  }

  // Calculate match stats
  const matchStats = calculateMatchStats(pointLog)

  // Manual refresh function for Safari mobile users
  const refreshMatch = useCallback(() => {
    console.log("🔄 Manual refresh triggered")
    if (mounted) {
      // Force fetch new data
      window.location.reload()
    }
  }, [mounted])

  // Detect Safari mobile for UI adjustments
  const isSafariMobile = typeof navigator !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent)

  // Detect Vercel preview URL
  const isVercelPreview = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('-git-'))

  // Enhanced connection status for Safari mobile
  const getConnectionStatus = () => {
    if (!mounted) return { status: "connecting", message: t('loading') }
    
    if (isVercelPreview) {
      return { 
        status: "preview", 
        message: t('previewModeStatus')
      }
    }
    
    if (error) return { status: "error", message: `Connection Error: ${error}` }
    if (!connected && retryCount > 0) return { status: "reconnecting", message: `Reconnecting... (${retryCount}/3)` }
    if (!connected) return { status: "disconnected", message: isSafariMobile ? t('tapRefreshIfScoresNoUpdate') : tCommon('connecting') }
    return { status: "connected", message: t('liveUpdatesActive') }
  }

  const connectionStatus = getConnectionStatus()

  const hasPointData = pointLog.length > 0
  const playerNames = {
    p1: formatPlayerFromObject(match.playerOne),
    p2: formatPlayerFromObject(match.playerTwo),
    p3: match.playerThree ? formatPlayerFromObject(match.playerThree) : undefined,
    p4: match.playerFour ? formatPlayerFromObject(match.playerFour) : undefined,
  }

  // Current server from the point log and score
  const currentServer = deriveCurrentServer(pointLog, score)

  // Doubles: which partner serves the next point (derived from the point log)
  const servingPlayer =
    match.playerThree && match.playerFour && currentServer
      ? getNextDoublesServer(pointLog, currentServer, startsNewServeTurn(score), normalizeMatchFormat(match.matchFormatParsed).doublesServeOrder)
      : null

  const generateMetaTags = useCallback(() => {
    const title = `${formatPlayerFromObject(match.playerOne)} ${t('vs')} ${formatPlayerFromObject(match.playerTwo)} - ${t('liveTennisMatch')}`
    const description = `Follow the live tennis match between ${formatPlayerFromObject(match.playerOne)} and ${formatPlayerFromObject(match.playerTwo)}`
    
    return { title, description }
  }, [match.playerOne, match.playerTwo, t])

  useEffect(() => {
    const { title, description } = generateMetaTags()
    
    // Update document title and description
    document.title = title
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    }
  }, [generateMetaTags])

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative z-10 p-3 sm:p-4 max-w-6xl mx-auto w-full space-y-3 sm:space-y-4">
          <div className="text-center pt-6 sm:pt-8">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">{t('liveTennisMatch')}</h1>
            </div>
            <div className="animate-pulse text-sm sm:text-base text-muted-foreground">{t('loading')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 p-3 sm:p-4 max-w-6xl mx-auto w-full space-y-3 sm:space-y-4"
      >
        {/* Header: Match internal live match style */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between pt-2 sm:pt-4 w-full gap-2 flex-wrap"
        >
          {/* Left: Tournament badge (if any) + Live Tennis */}
          <div className="flex items-center gap-2 min-w-0">
            {match.tournamentName && (
              <span className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mr-2 truncate max-w-xs" title={match.tournamentName}>
                {match.tournamentName}
              </span>
            )}
            <h1 className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap">{t('liveTennis')}</h1>
          </div>
          {/* Right: Language Toggle, Share & Reload Buttons */}
          <div className="flex gap-2 ml-auto items-center">
            <LanguageToggle />
            <a
              href={`/${locale}/watch/${match.$id}`}
              className="shrink-0 text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              {t('watchLiteView')}
            </a>
            <Button variant="outline" size="icon" onClick={shareMatch} className="shrink-0" title={t('share')} aria-label={t('share')}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={refreshMatch} className="shrink-0" title={tCommon('refresh')} aria-label={tCommon('refresh')}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Status badges and connection info (unchanged) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white text-xs sm:text-sm">
            {match.status === "In Progress" ? t('live') : t('completed')}
          </Badge>
          {/* Connection Status - only show if match is in progress */}
          {match.status === "In Progress" && (
            <Badge variant={connectionStatus.status === "connected" ? "outline" : connectionStatus.status === "reconnecting" ? "outline" : "destructive"} className={`border text-xs sm:text-sm ${connectionStatus.status === "connected" ? 'border-green-500 text-green-500' : connectionStatus.status === "reconnecting" ? 'border-yellow-500 text-yellow-500' : 'border-red-500 text-red-500'}`}>
              {connectionStatus.status === "connected" ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{connectionStatus.message}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{connectionStatus.message}</span>
                </>
              )}
            </Badge>
          )}
        </div>
        
        {error && match.status === "In Progress" && (
          <div className="text-xs sm:text-sm text-red-500 mt-2 sm:mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-950/20 rounded border mx-auto">
            Connection error: {error}
          </div>
        )}

        {/* Live Scoreboard - Remove wrapper motion and extra classes that might interfere */}
        <motion.div variants={itemVariants}>
          <LiveScoreboard
            playerOneName={playerNames.p1}
            playerTwoName={playerNames.p2}
            playerThreeName={playerNames.p3}
            playerFourName={playerNames.p4}
            playerOneAvatar={
              <PlayerAvatar player={match.playerOne} className="h-7 w-7 text-[10px]" />
            }
            playerTwoAvatar={
              <PlayerAvatar player={match.playerTwo} className="h-7 w-7 text-[10px]" />
            }
            playerOneYearOfBirth={match.playerOne.yearOfBirth}
            playerTwoYearOfBirth={match.playerTwo.yearOfBirth}
            playerThreeYearOfBirth={match.playerThree?.yearOfBirth}
            playerFourYearOfBirth={match.playerFour?.yearOfBirth}
            playerOneRating={formatPlayerRating(match.playerOne)}
            playerTwoRating={formatPlayerRating(match.playerTwo)}
            playerThreeRating={match.playerThree ? formatPlayerRating(match.playerThree) : ''}
            playerFourRating={match.playerFour ? formatPlayerRating(match.playerFour) : ''}
            playerOneClub={match.playerOne.club}
            playerTwoClub={match.playerTwo.club}
            playerThreeClub={match.playerThree?.club}
            playerFourClub={match.playerFour?.club}
            score={score}
            status={match.status}
            winnerId={match.winnerId}
            playerOneId={match.playerOne.$id}
            playerTwoId={match.playerTwo.$id}
            currentServer={currentServer}
            servingPlayer={servingPlayer}
            matchFormat={{
              ...normalizeMatchFormat(match.matchFormatParsed),
              tiebreak: match.matchFormatParsed.finalSetTiebreak !== "none",
            }}
          />
        </motion.div>

        {/* Match Timer */}
        <motion.div variants={itemVariants}>
          <MatchTimerDisplay 
            className="justify-center"
            startTime={match.startTime}
            endTime={match.endTime}
            setDurations={match.setDurations}
            isMatchComplete={match.status === "Completed"}
          />
        </motion.div>

        {/* Match Momentum Bar - Compact version for public view */}
        {pointLog.length > 0 && (
          <motion.div variants={itemVariants}>
            <MomentumBar
              pointLog={pointLog.map((point, index) => ({
                winner: point.winner,
                pointNumber: index + 1,
                timestamp: point.timestamp || new Date().toISOString()
              }))}
              playerNames={playerNames}
              className="mx-auto max-w-md"
              compact={true}
              maxPoints={10}
            />
          </motion.div>
        )}

        {/* Match Details Tabs - Stats and Points */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10 max-w-xs sm:max-w-lg mx-auto">
              <TabsTrigger value="stats" className="text-xs sm:text-sm">{t('statistics')}</TabsTrigger>
              <TabsTrigger value="points" className="text-xs sm:text-sm">
                {t('points')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-3 sm:mt-4">
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <MatchStatsComponentSimpleFixed 
                    stats={matchStats}
                    playerNames={playerNames}
                    detailLevel={match.detailLevel || "simple"}
                    pointLog={pointLog}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points" className="mt-3 sm:mt-4">
              <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                  {hasPointData ? (
                    <PointByPointView
                      pointLog={pointLog}
                      playerNames={playerNames}
                      playerObjects={{
                        p1: match.playerOne,
                        p2: match.playerTwo,
                        ...(match.playerThree ? { p3: match.playerThree } : {}),
                        ...(match.playerFour ? { p4: match.playerFour } : {})
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>{t('noPointsYet')}</p>
                      <p className="text-sm mt-2">{t('pointsWillAppearHere')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Match Info Footer */}
        <motion.div variants={itemVariants} className="text-center py-3 sm:py-4 border-t">
          <div className="text-center space-y-1 sm:space-y-2 px-2">
            <h1 className="text-sm sm:text-base md:text-lg font-bold break-words">
              {playerNames.p3 && playerNames.p4 
                ? `${playerNames.p1} / ${playerNames.p3}`
                : playerNames.p1
              }
            </h1>
            <div className="text-xs sm:text-sm text-muted-foreground">{t('vs')}</div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold break-words">
              {playerNames.p3 && playerNames.p4 
                ? `${playerNames.p2} / ${playerNames.p4}`
                : playerNames.p2
              }
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3">
              {formatDate(match.matchDate, locale)}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
