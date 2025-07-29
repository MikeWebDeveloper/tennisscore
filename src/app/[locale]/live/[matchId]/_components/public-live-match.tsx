"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Share2, Trophy, RefreshCw, Wifi, WifiOff } from "lucide-react"
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
import { formatPlayerFromObject } from "@/lib/utils"
import { LanguageToggle } from "@/components/ui/language-toggle"
import { useLiveViewers } from "@/hooks/use-live-viewers"
import { getTiebreakServer } from "@/lib/utils/tennis-scoring"
import { useTranslations } from "@/i18n"

type Score = import("@/stores/matchStore").Score

const defaultScore: Score = {
  sets: [],
  games: [0, 0],
  points: [0, 0],
  isTiebreak: false,
  tiebreakPoints: [0, 0],
}

// Utility to parse and convert score from DB format to store format
function parseAndConvertScore(scoreString: string | undefined): Score {
  if (!scoreString) return defaultScore
  try {
    const dbScore = JSON.parse(scoreString)
    console.log("📊 Parsing score from DB:", dbScore)
    
    // Handle both modern format (arrays) and legacy format (objects with player1/player2)
    let sets: [number, number][] = []
    let games: [number, number] = [0, 0]
    let points: [number, number] = [0, 0]
    let tiebreakPoints: [number, number] = [0, 0]
    
    // Parse sets - handle both formats
    if (dbScore.sets && Array.isArray(dbScore.sets)) {
      sets = dbScore.sets.map((s: unknown) => {
        if (Array.isArray(s)) {
          // Modern format: [6, 4]
          return [s[0] || 0, s[1] || 0] as [number, number]
        } else if (s && typeof s === 'object' && s !== null) {
          // Legacy format: {player1: 6, player2: 4}
          const legacySet = s as { player1?: number; player2?: number; [key: number]: number }
          return [legacySet.player1 || legacySet[0] || 0, legacySet.player2 || legacySet[1] || 0] as [number, number]
        }
        return [0, 0] as [number, number]
      })
    }
    
    // Parse games - handle both formats
    if (dbScore.games) {
      if (Array.isArray(dbScore.games)) {
        if (dbScore.games.length === 2 && typeof dbScore.games[0] === 'number') {
          // Modern simple format: [2, 0]
          games = [dbScore.games[0] || 0, dbScore.games[1] || 0]
        } else if (dbScore.games.length > 0) {
          // Complex format: array of game objects or arrays
          const lastGame = dbScore.games[dbScore.games.length - 1]
          if (Array.isArray(lastGame)) {
            // Format: [[0,0], [1,1]] -> use last element
            games = [lastGame[0] || 0, lastGame[1] || 0]
          } else if (typeof lastGame === 'object') {
            // Format: [{player1: 0, player2: 0}] -> use last element
            games = [lastGame.player1 || 0, lastGame.player2 || 0]
          }
        }
      } else if (typeof dbScore.games === 'object') {
        // Legacy single object format: {player1: 0, player2: 0}
        games = [dbScore.games.player1 || 0, dbScore.games.player2 || 0]
      }
    }
    
    // Parse points - handle both formats
    if (dbScore.points) {
      if (Array.isArray(dbScore.points)) {
        // Modern format: [1, 1]
        points = [dbScore.points[0] || 0, dbScore.points[1] || 0]
      } else if (typeof dbScore.points === 'object') {
        // Legacy format: {player1: "1", player2: "1"}
        points = [
          parseInt(dbScore.points.player1, 10) || 0,
          parseInt(dbScore.points.player2, 10) || 0
        ]
      }
    }
    
    // Parse tiebreak points - handle both formats
    if (dbScore.tiebreakPoints) {
      if (Array.isArray(dbScore.tiebreakPoints)) {
        // Modern format: [0, 0]
        tiebreakPoints = [dbScore.tiebreakPoints[0] || 0, dbScore.tiebreakPoints[1] || 0]
      } else if (typeof dbScore.tiebreakPoints === 'object') {
        // Legacy format: {player1: 0, player2: 0}
        tiebreakPoints = [dbScore.tiebreakPoints.player1 || 0, dbScore.tiebreakPoints.player2 || 0]
      }
    }
    
    const convertedScore: Score = {
      sets,
      games,
      points,
      isTiebreak: dbScore.isTiebreak || false,
      tiebreakPoints,
    }
    
    console.log("✅ Converted score:", convertedScore)
    return convertedScore
  } catch (e) {
    console.error("Failed to parse score:", e)
    return defaultScore
  }
}

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
  const [match, setMatch] = useState(initialMatch)
  const [score, setScore] = useState<Score>(() => parseAndConvertScore(initialMatch.score))
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Only start real-time connection after component mounts to prevent hydration issues
  const { connected, lastUpdate, error, retryCount } = useRealtimeMatch(mounted ? match.$id : "")
  const { count: viewerCount, loading: viewerLoading } = useLiveViewers(match.$id, true)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse point log
  useEffect(() => {
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
      const newScore = parseAndConvertScore(lastUpdate.score)
      setScore(newScore)

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

  // Extract current server from the latest point or score
  let currentServer: "p1" | "p2" | undefined = undefined
  if (pointLog.length > 0 && score) {
    const totalGames =
      score.sets.reduce((sum, set) => sum + (set[0] || 0) + (set[1] || 0), 0) +
      (score.games[0] || 0) +
      (score.games[1] || 0)
    const firstServer = pointLog[0]?.server || "p1"
    if (score.isTiebreak) {
      const totalTiebreakPoints = (score.tiebreakPoints?.[0] || 0) + (score.tiebreakPoints?.[1] || 0)
      // Find the initial tiebreak server: the player who would normally serve this game
      const tiebreakStartServer = totalGames % 2 === 0 ? firstServer : (firstServer === 'p1' ? 'p2' : 'p1')
      currentServer = getTiebreakServer(totalTiebreakPoints, tiebreakStartServer)
    } else {
      currentServer = totalGames % 2 === 0 ? firstServer : (firstServer === 'p1' ? 'p2' : 'p1')
    }
  }

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
            <h1 className="text-lg font-bold text-white whitespace-nowrap">{t('liveTennis')}</h1>
          </div>
          {/* Right: Language Toggle, Share & Reload Buttons */}
          <div className="flex gap-2 ml-auto items-center">
            <LanguageToggle />
            <Button variant="outline" size="sm" onClick={shareMatch} className="shrink-0 hover:bg-white/10">
              <Share2 className="w-4 h-4 mr-2" />
              {t('share')}
            </Button>
            <Button variant="outline" size="sm" onClick={refreshMatch} className="shrink-0 hover:bg-white/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              {isSafariMobile ? "Refresh" : "Reload"}
            </Button>
          </div>
        </motion.div>

        {/* Status badges and connection info (unchanged) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white text-xs sm:text-sm">
            {match.status === "In Progress" ? t('live') : t('completed')}
          </Badge>
          {/* Viewer count live */}
          <div className="flex items-center gap-1 px-2 text-xs sm:text-sm text-blue-500 font-semibold min-w-[32px]">
            <svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4 inline-block' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
            {viewerLoading ? <span className="w-3 h-3 animate-spin border-2 border-blue-400 border-t-transparent rounded-full inline-block"></span> : <span>{viewerCount}</span>}
          </div>
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
              <PlayerAvatar player={match.playerOne} className="h-4 w-4 sm:h-6 sm:w-6" />
            }
            playerTwoAvatar={
              <PlayerAvatar player={match.playerTwo} className="h-4 w-4 sm:h-6 sm:w-6" />
            }
            playerOneYearOfBirth={match.playerOne.yearOfBirth}
            playerTwoYearOfBirth={match.playerTwo.yearOfBirth}
            playerThreeYearOfBirth={match.playerThree?.yearOfBirth}
            playerFourYearOfBirth={match.playerFour?.yearOfBirth}
            playerOneRating={match.playerOne.rating}
            playerTwoRating={match.playerTwo.rating}
            playerThreeRating={match.playerThree?.rating}
            playerFourRating={match.playerFour?.rating}
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
            matchFormat={{
              noAd: match.matchFormatParsed.noAd,
              sets: match.matchFormatParsed.sets as 1 | 3 | 5,
              tiebreak: match.matchFormatParsed.finalSetTiebreak !== "none",
              finalSetTiebreak: match.matchFormatParsed.finalSetTiebreak || "standard"
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
              {new Date(match.matchDate).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 