"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Undo,
  Trophy,
  Share2,
  MessageCircle,
  MessageSquare,
  Copy,
  Mail,
  Activity
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { Player, PointDetail as LibPointDetail } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointByPointView } from "../../../[id]/_components/point-by-point-view"
import { PointDetailSheet } from "./point-detail-sheet"
import { SimpleStatsPopup, SimplePointOutcome } from "./simple-stats-popup"
import { LiveScoreboard as SharedLiveScoreboard } from "@/components/shared/live-scoreboard"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslations } from "@/hooks/use-translations"
import { cn, formatPlayerFromObject } from "@/lib/utils"

import { MatchStatsComponentSimpleFixed } from "@/app/(app)/matches/[id]/_components/match-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { useMatchStore, PointDetail as StorePointDetail, Score } from "@/stores/matchStore"
import { isBreakPoint } from "@/lib/utils/tennis-scoring"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { MatchTimerDisplay } from "./MatchTimerDisplay"
import { FlameIcon } from "@/components/ui/flame-icon"
import { MomentumBar } from "@/components/ui/momentum-bar"
import { playSound } from "@/lib/sounds"

// Confetti celebration function
const triggerMatchWinConfetti = () => {
  // Main burst from the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })
  
  // Side bursts for more dramatic effect
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    })
  }, 250)
  
  // Final burst with gold colors
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#39FF14']
    })
  }, 500)
}

// This is the format of the score object as stored in the Appwrite database
interface DbScore {
  sets: Array<{ player1: number; player2: number }>
  games: Array<{ player1: number; player2: number }>
  points: { player1: string; player2: string }
  isTiebreak: boolean
  tiebreakPoints?: { player1: number; player2: number }
  server: 'p1' | 'p2'
}

interface LiveScoringInterfaceProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    playerThree?: Player
    playerFour?: Player
    matchFormat: string
    detailLevel?: "points" | "simple" | "complex"
    score: string
    pointLog?: string[]
    status: string
    startTime?: string
    endTime?: string
    setDurations?: number[]
    tournamentName?: string
  }
}

// Share Dialog Component
function ShareDialog({ open, onOpenChange, matchId, playerNames }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  playerNames: { p1: string; p2: string }
}) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${matchId}` : ''
  const shareText = `🎾 Live Tennis Match: ${playerNames.p1} vs ${playerNames.p2}`
  const fullMessage = `${shareText}\n${shareUrl}`

  const shareOptions = [
    { 
      name: "Copy Link", 
      icon: Copy, 
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl)
          toast.success("Link copied to clipboard!")
          onOpenChange(false)
        } catch {
          toast.error("Failed to copy link")
        }
      },
      color: "bg-gray-900 dark:bg-gray-700"
    },
    { 
      name: "WhatsApp", 
      icon: MessageSquare, 
      action: () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)
        const whatsappUrl = isMobile 
          ? `whatsapp://send?text=${encodeURIComponent(fullMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(fullMessage)}`
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        onOpenChange(false)
      },
      color: "bg-green-500"
    },
    { 
      name: "SMS", 
      icon: Mail, 
      action: () => {
        // SMS works differently on iOS vs Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        const smsUrl = isIOS 
          ? `sms:&body=${encodeURIComponent(fullMessage)}`
          : `sms:?body=${encodeURIComponent(fullMessage)}`
        window.location.href = smsUrl
        onOpenChange(false)
      },
      color: "bg-blue-500"
    },
    { 
      name: "Facebook", 
      icon: MessageCircle, 
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        window.open(fbUrl, '_blank', 'noopener,noreferrer')
        onOpenChange(false)
      },
      color: "bg-blue-600"
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Live Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-foreground bg-muted dark:bg-gray-800 dark:text-gray-300 text-center p-3 rounded-lg break-all">
            {shareUrl}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={`h-16 flex flex-col gap-1 text-white border-0 hover:opacity-90 ${option.color}`}
                onClick={option.action}
              >
                <option.icon className="h-5 w-5" />
                <span className="text-xs">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Use shared scoreboard component
const LiveScoreboard = SharedLiveScoreboard

// Point Entry Component
function PointEntry({ 
  onPointWin,
  score,
  isTiebreak,
  pointSituation,
  playerNames,
  players,
  p1Streak,
  p2Streak,
}: { 
  onPointWin: (winner: "p1" | "p2") => void,
  score: Score,
  isTiebreak: boolean,
  pointSituation: { type: 'matchPoint' | 'setPoint' | 'breakPoint'; player: 'p1' | 'p2' | null; badge: string; color: string; textColor: string; borderColor: string; bgColor: string } | null,
  playerNames: { p1: string, p2: string },
  players: { p1: Player; p2: Player },
  p1Streak: number,
  p2Streak: number,
}) {
  const getPointDisplay = (playerIndex: number) => {
    if (isTiebreak) {
      return score.tiebreakPoints?.[playerIndex] || 0
    }
    
    const p1 = score.points[0]
    const p2 = score.points[1]
    
    if (p1 >= 3 && p2 >= 3) {
      if (p1 === p2) return "40"
      if (p1 > p2 && playerIndex === 0) return "AD"
      if (p2 > p1 && playerIndex === 1) return "AD"
    }
    
    const pointMap = ["0", "15", "30", "40"]
    return pointMap[score.points[playerIndex]] || "40"
  }

  const getPlayerDisplayName = (playerKey: 'p1' | 'p2') => {
    const fullName = playerNames[playerKey]
    return fullName.split(' ')[0] // First name only for buttons
  }

  const getSituationText = () => {
    if (!pointSituation) return null
    
    const playerName = getPlayerDisplayName(pointSituation.player as 'p1' | 'p2')
    
    switch (pointSituation.type) {
      case 'matchPoint':
        return `${playerName} has match point`
      case 'setPoint':
        return `${playerName} has set point`
      case 'breakPoint':
        return `${playerName} has break point`
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Critical point context header */}
      {pointSituation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
            pointSituation.bgColor,
            pointSituation.borderColor
          )}>
            <Badge variant="destructive" className={cn("text-white hover:opacity-90", pointSituation.color)}>
              {pointSituation.badge}
            </Badge>
            <span className={cn("text-sm font-medium", pointSituation.textColor)}>
              {getSituationText()}
            </span>
          </div>
        </motion.div>
      )}

      {/* Player buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          onClick={() => onPointWin("p1")}
          className={cn(
            "h-32 sm:h-40 bg-card border rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors relative overflow-hidden",
            pointSituation && pointSituation.player === 'p1' && pointSituation.borderColor,
            pointSituation && pointSituation.player === 'p1' && pointSituation.bgColor
          )}
          whileTap={{ scale: 0.98 }}
        >
          {/* Critical point indicator */}
          {pointSituation && pointSituation.player === 'p1' && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className={cn("text-xs text-white", pointSituation.color)}>
                {pointSituation.badge}
              </Badge>
            </div>
          )}
          
          {/* Player info */}
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar player={players.p1} className="h-12 w-12" />
            <div className="text-xs font-medium text-muted-foreground text-center px-2 flex items-center gap-1">
              {getPlayerDisplayName('p1')}
              {p1Streak >= 5 && (
                <FlameIcon size={14} streak={p1Streak} className="ml-1" />
              )}
            </div>
          </div>
          
          {/* Score display */}
          <span className={cn(
            "text-4xl sm:text-6xl font-black font-mono text-center",
            pointSituation && pointSituation.player === 'p1' 
              ? pointSituation.textColor
              : "text-card-foreground"
          )}>
            {getPointDisplay(0)}
          </span>
        </motion.div>
        
        <motion.div 
          onClick={() => onPointWin("p2")}
          className={cn(
            "h-32 sm:h-40 bg-card border rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors relative overflow-hidden",
            pointSituation && pointSituation.player === 'p2' && pointSituation.borderColor,
            pointSituation && pointSituation.player === 'p2' && pointSituation.bgColor
          )}
          whileTap={{ scale: 0.98 }}
        >
          {/* Critical point indicator */}
          {pointSituation && pointSituation.player === 'p2' && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className={cn("text-xs text-white", pointSituation.color)}>
                {pointSituation.badge}
              </Badge>
            </div>
          )}
          
          {/* Player info */}
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar player={players.p2} className="h-12 w-12" />
            <div className="text-xs font-medium text-muted-foreground text-center px-2 flex items-center gap-1">
              {getPlayerDisplayName('p2')}
              {p2Streak >= 5 && (
                <FlameIcon size={14} streak={p2Streak} className="ml-1" />
              )}
            </div>
          </div>
          
          {/* Score display */}
          <span className={cn(
            "text-4xl sm:text-6xl font-black font-mono text-center",
            pointSituation && pointSituation.player === 'p2' 
              ? pointSituation.textColor
              : "text-card-foreground"
          )}>
            {getPointDisplay(1)}
          </span>
        </motion.div>
      </div>
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const t = useTranslations()
  
  // Use match store
  const { 
    score, 
    pointLog, 
    currentServer,
    p1Streak,
    p2Streak,
    initializeMatch, 
    awardPoint, 
    undoLastPoint, 
    setServer
  } = useMatchStore()
  
  // Local state for UI
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPointDetail, setShowPointDetail] = useState(false)
  const [showSimpleStats, setShowSimpleStats] = useState(false)
  const [showRetireDialog, setShowRetireDialog] = useState(false)
  const [retireReason, setRetireReason] = useState<'completed' | 'retired' | 'weather' | 'injury' | ''>('')
  const [selectedWinner, setSelectedWinner] = useState<'p1' | 'p2' | ''>('')
  const [pendingPointWinner, setPendingPointWinner] = useState<'p1' | 'p2' | null>(null)
  const [serveType, setServeType] = useState<'first' | 'second'>('first')
  const [isInGame, setIsInGame] = useState(false)
  const [isMatchInitialized, setIsMatchInitialized] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  
  const playerNames = {
    p1: formatPlayerFromObject(match.playerOne),
    p2: formatPlayerFromObject(match.playerTwo),
    p3: match.playerThree ? formatPlayerFromObject(match.playerThree) : undefined,
    p4: match.playerFour ? formatPlayerFromObject(match.playerFour) : undefined,
  }

  const players = {
    p1: match.playerOne,
    p2: match.playerTwo,
  }

  // Convert store point details to lib point details for stats calculation
  const convertedPointLog: LibPointDetail[] = pointLog.map(point => ({
    ...point,
    lastShotType: point.lastShotType === 'other' ? 'serve' : (point.lastShotType as LibPointDetail['lastShotType'])
  }))
  
  // Parse match format properly
  const parsedMatchFormat = useMemo(() => {
    try {
      const parsed = JSON.parse(match.matchFormat)
      return {
        sets: parsed.sets || 3,
        noAd: parsed.noAd || false,
        tiebreak: parsed.tiebreak !== false,
        finalSetTiebreak: parsed.finalSetTiebreak || "standard",
        finalSetTiebreakAt: parsed.finalSetTiebreakAt || 10,
      }
    } catch (error) {
      console.error("Failed to parse match format:", error)
      return {
        sets: 3,
        noAd: false,
        tiebreak: true,
        finalSetTiebreak: "standard" as const,
        finalSetTiebreakAt: 10,
      }
    }
  }, [match.matchFormat])
  
  // Get detailLevel directly from match object (not from parsed format)
  const detailLevel = match.detailLevel || "simple"
  const isTiebreak = score.isTiebreak || false
  
  // Calculate current breakpoint status
  const getBreakPointStatus = () => {
    if (!currentServer || isTiebreak) return { isBreakPoint: false, facingBreakPoint: null }
    
    const serverPoints = currentServer === 'p1' ? score.points[0] : score.points[1]
    const returnerPoints = currentServer === 'p1' ? score.points[1] : score.points[0]
    
    const isCurrentlyBreakPoint = isBreakPoint(serverPoints, returnerPoints, parsedMatchFormat.noAd)
    
    // The RETURNER has the breakpoint opportunity (should get the BP badge)
    const returner: 'p1' | 'p2' = currentServer === 'p1' ? 'p2' : 'p1'
    
    return {
      isBreakPoint: isCurrentlyBreakPoint,
      facingBreakPoint: isCurrentlyBreakPoint ? returner : null  // RETURNER gets the BP badge
    }
  }
  
  // Calculate current set point and match point status
  const getSetAndMatchPointStatus = () => {
    if (!score) return { isSetPoint: false, isMatchPoint: false, facingSetPoint: null, facingMatchPoint: null }
    
    const setsNeededToWin = Math.ceil(parsedMatchFormat.sets / 2)
    const currentP1SetsWon = score.sets.filter((s: [number, number]) => s[0] > s[1]).length
    const currentP2SetsWon = score.sets.filter((s: [number, number]) => s[1] > s[0]).length
    
    // Check if either player could win the set by winning the current game
    const currentGames = score.games as [number, number]
    const p1CouldWinSetNextGame = currentGames[0] + 1 >= 6 && (currentGames[0] + 1 - currentGames[1] >= 2 || (currentGames[0] + 1 === 7 && currentGames[1] === 6))
    const p2CouldWinSetNextGame = currentGames[1] + 1 >= 6 && (currentGames[1] + 1 - currentGames[0] >= 2 || (currentGames[1] + 1 === 7 && currentGames[0] === 6))
    
    let isSetPoint = false
    let facingSetPoint: 'p1' | 'p2' | null = null
    
    if (isTiebreak) {
      // In tiebreak, check if either player is close to winning
      const p1TbPoints = score.tiebreakPoints?.[0] || 0
      const p2TbPoints = score.tiebreakPoints?.[1] || 0
      // Determine tiebreak target based on whether it's a deciding set and format
      const isDecidingSet = currentP1SetsWon === setsNeededToWin - 1 && currentP2SetsWon === setsNeededToWin - 1
      const tiebreakTarget = (isDecidingSet && parsedMatchFormat.finalSetTiebreak === "super") ? 
        (parsedMatchFormat.finalSetTiebreakAt || 10) : 7
      
      if ((p1TbPoints >= tiebreakTarget - 1 && p1TbPoints >= p2TbPoints) && p1CouldWinSetNextGame) {
        isSetPoint = true
        facingSetPoint = 'p1'
      } else if ((p2TbPoints >= tiebreakTarget - 1 && p2TbPoints >= p1TbPoints) && p2CouldWinSetNextGame) {
        isSetPoint = true
        facingSetPoint = 'p2'
      }
    } else {
      // Regular game scoring
      const [p1Score, p2Score] = score.points as [number, number]
      
      // Check if either player is at game point AND could win the set
      const p1AtGamePoint = (p1Score >= 3 && (p1Score > p2Score || (p1Score === 3 && p2Score < 3)))
      const p2AtGamePoint = (p2Score >= 3 && (p2Score > p1Score || (p2Score === 3 && p1Score < 3)))
      
      // Deuce set point: At deuce, if either player could win the set
      const isDeuceSetPoint = (p1Score === 3 && p2Score === 3)
      
      if ((p1AtGamePoint && p1CouldWinSetNextGame) || (isDeuceSetPoint && p1CouldWinSetNextGame)) {
        isSetPoint = true
        facingSetPoint = 'p1'
      } else if ((p2AtGamePoint && p2CouldWinSetNextGame) || (isDeuceSetPoint && p2CouldWinSetNextGame)) {
        isSetPoint = true
        facingSetPoint = 'p2'
      }
    }
    
    // Check for match point
    let isMatchPoint = false
    let facingMatchPoint: 'p1' | 'p2' | null = null
    
    if (isSetPoint && facingSetPoint) {
      // If this is a set point, check if winning this set would win the match
      const newP1Sets = currentP1SetsWon + (facingSetPoint === 'p1' ? 1 : 0)
      const newP2Sets = currentP2SetsWon + (facingSetPoint === 'p2' ? 1 : 0)
      
      if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
        isMatchPoint = true
        facingMatchPoint = facingSetPoint
      }
    }
    
    return {
      isSetPoint,
      isMatchPoint,
      facingSetPoint,
      facingMatchPoint
    }
  }
  
  const breakPointStatus = getBreakPointStatus()
  const setMatchPointStatus = getSetAndMatchPointStatus()
  
  // Determine the highest priority situation for display
  const getPointSituation = () => {
    if (setMatchPointStatus.isMatchPoint) {
      return {
        type: 'matchPoint' as const,
        player: setMatchPointStatus.facingMatchPoint,
        badge: 'MP',
        color: 'bg-red-600',
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-700',
        bgColor: 'bg-red-50/50 dark:bg-red-950/10'
      }
    } else if (setMatchPointStatus.isSetPoint) {
      return {
        type: 'setPoint' as const,
        player: setMatchPointStatus.facingSetPoint,
        badge: 'SP',
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-300 dark:border-blue-700',
        bgColor: 'bg-blue-50/50 dark:bg-blue-950/10'
      }
    } else if (breakPointStatus.isBreakPoint) {
      return {
        type: 'breakPoint' as const,
        player: breakPointStatus.facingBreakPoint,
        badge: 'BP',
        color: 'bg-orange-500',
        textColor: 'text-orange-600 dark:text-orange-400',
        borderColor: 'border-orange-300 dark:border-orange-700',
        bgColor: 'bg-orange-50/50 dark:bg-orange-950/10'
      }
    }
    return null
  }
  
  const pointSituation = getPointSituation()
  

  
  // Initialize match data
  useEffect(() => {
    if (!match || !match.$id) {
      return
    }

    const existingPointLog: StorePointDetail[] = match.pointLog 
      ? match.pointLog.map(pointStr => {
          try {
            return JSON.parse(pointStr)
          } catch (error) {
            console.error("Failed to parse point:", error)
            return null
          }
        }).filter(Boolean)
      : []
    
    let dbScore: DbScore
    try {
      dbScore = JSON.parse(match.score)
    } catch (error) {
      console.error("Failed to parse match score:", error)
      dbScore = { 
        sets: [], 
        games: [{player1: 0, player2: 0}], 
        points: {player1: '0', player2: '0'}, 
        isTiebreak: false,
        server: 'p1'
      }
    }

    // Convert the database score object to the format used by the store
    const storeScore: Score = {
      sets: (dbScore.sets || []).map(s => [s.player1, s.player2]),
      games: dbScore.games && dbScore.games.length > 0 ? [dbScore.games[dbScore.games.length - 1].player1, dbScore.games[dbScore.games.length - 1].player2] : [0,0],
      points: [parseInt(dbScore.points?.player1, 10) || 0, parseInt(dbScore.points?.player2, 10) || 0],
      isTiebreak: dbScore.isTiebreak || false,
      tiebreakPoints: dbScore.tiebreakPoints ? [dbScore.tiebreakPoints.player1, dbScore.tiebreakPoints.player2] : [0, 0]
    }

    const matchData = {
      $id: match.$id,
      playerOneId: match.playerOne.$id,
      playerTwoId: match.playerTwo.$id,
      matchDate: new Date().toISOString(),
      matchFormat: parsedMatchFormat,
      status: match.status as 'In Progress' | 'Completed',
      winnerId: match.status === 'Completed' ? undefined : undefined,
      score: storeScore,
      pointLog: existingPointLog,
      events: [],
      userId: match.playerOne.userId || ''
    }
    
    try {
      initializeMatch(matchData)
      if (existingPointLog.length === 0) {
        setServer(dbScore.server || 'p1')
      }
      setIsInGame(existingPointLog.length > 0)
      setIsMatchInitialized(true)
      setStartTime(match.startTime || null)
    } catch (error) {
      console.error("Failed to initialize match:", error)
    }
  }, [match, parsedMatchFormat, initializeMatch, setServer])

  // Show loading state until match is initialized
  if (!isMatchInitialized || !currentServer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing match...</p>
        </div>
      </div>
    )
  }

  const getGameScore = () => {
    if (isTiebreak) {
      const p1 = score.tiebreakPoints?.[0] || 0
      const p2 = score.tiebreakPoints?.[1] || 0
      return `${p1} - ${p2}`
    }
    
    const p1Points = score.points[0]
    const p2Points = score.points[1]
    
    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) return "DEUCE"
      if (p1Points > p2Points) return `AD-${playerNames.p1.split(' ')[0].toUpperCase()}`
      return `AD-${playerNames.p2.split(' ')[0].toUpperCase()}`
    }
    
    const pointMap = ["0", "15", "30", "40"]
    const p1Display = pointMap[Math.min(p1Points, 3)]
    const p2Display = pointMap[Math.min(p2Points, 3)]
    
    return `${p1Display} - ${p2Display}`
  }

  const handlePointWin = async (winner: "p1" | "p2") => {
    if (!currentServer || !score) {
      console.error("Match not properly initialized - missing server or score")
      toast.error("Match not ready. Please refresh the page.")
      return
    }
    
    if (match.status === 'Completed') {
      toast.error("Match is already complete and cannot be modified.")
      return
    }

    // Debug logging to understand detailLevel issues
    console.log('Detail level check:', { 
      detailLevel, 
      parsedMatchFormat, 
      matchFormatString: match.matchFormat 
    })

    // For "Points Only", create a minimal point object and save it immediately
    if (detailLevel === 'points') {
      console.log('Points only mode - awarding point directly')
      const minimalPointDetail: Partial<StorePointDetail> = {
        serveType: serveType,
        pointOutcome: 'winner',
        serveOutcome: 'winner',
        rallyLength: 1,
        lastShotType: 'serve',
      }
      await handleAwardPoint(winner, minimalPointDetail)
      return
    }

    // For 'simple' mode, open the simple stats popup
    if (detailLevel === 'simple') {
      console.log('Simple mode - opening stats popup')
      setPendingPointWinner(winner)
      setShowSimpleStats(true)
      return
    }

    // For complex mode, use the detailed sheet
    console.log('Complex mode - opening detailed sheet')
    setPendingPointWinner(winner)
    setShowPointDetail(true)
  }

  const handleAwardPoint = async (
    winner: "p1" | "p2",
    pointDetails?: Partial<StorePointDetail>
  ) => {
    try {
      const result = awardPoint(winner, pointDetails || {})
      setIsInGame(true)

      // Play appropriate sound effects
      if (pointDetails?.pointOutcome === 'ace') {
        playSound('ace')
      } else if (pointDetails?.pointOutcome === 'double_fault') {
        playSound('double-fault')
      } else if (result.isMatchComplete) {
        playSound('match-won')
      } else if (result.newScore.sets.length > score.sets.length) {
        playSound('set-won')
      } else if ((result.newScore.games[0] + result.newScore.games[1]) > (score.games[0] + score.games[1])) {
        playSound('game-won')
      } else {
        // Check for critical point situations before playing point sound
        if (pointSituation?.type === 'matchPoint') {
          playSound('match-point')
        } else if (pointSituation?.type === 'setPoint') {
          playSound('set-point')
        } else if (pointSituation?.type === 'breakPoint') {
          playSound('break-point')
        } else {
          playSound('point-won')
        }
      }

      // Reset serve type back to first serve for next point
      setServeType('first')

      // Include timing data in the update payload
      const updatePayload: {
        score: Score;
        pointLog: object[];
        status?: 'Completed';
        winnerId?: string;
        startTime?: string;
        endTime?: string;
        setDurations?: number[];
      } = {
        score: result.newScore,
        pointLog: [...pointLog, result.pointDetail],
      }

      // Include timing data from the store result
      if (result.startTime) {
        updatePayload.startTime = result.startTime
      }
      if (result.endTime) {
        updatePayload.endTime = result.endTime
      }
      if (result.setDurations) {
        updatePayload.setDurations = result.setDurations
      }

      if (result.isMatchComplete) {
        updatePayload.status = 'Completed'
        if (result.winnerId) {
          updatePayload.winnerId = result.winnerId
        }
      }

      await updateMatchScore(match.$id, updatePayload)

      if (result.isMatchComplete && result.winnerId) {
        const winnerName = result.winnerId === match.playerOne.$id ? playerNames.p1 : playerNames.p2
        
        // Trigger celebratory confetti
        triggerMatchWinConfetti()
        
        toast.success(`Match completed! ${winnerName} wins!`)
        
        // Navigate to match details after a short delay
        setTimeout(() => {
          router.push(`/matches/${match.$id}`)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to award point:", error)
      toast.error("Failed to save point")
    }
  }

  const handleSimpleStatsOutcome = (outcome: SimplePointOutcome) => {
    if (pendingPointWinner) {
      const storePointDetail: Partial<StorePointDetail> = {
        serveType: serveType,
        pointOutcome: outcome === 'winner' ? 'winner' : 
                     outcome === 'ace' ? 'ace' :
                     outcome === 'forced_error' ? 'forced_error' :
                     outcome === 'unforced_error' ? 'unforced_error' :
                     'double_fault',
        serveOutcome: outcome === 'ace' ? 'ace' : 
                     outcome === 'double_fault' ? 'double_fault' : 'winner',
        rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 2,
        lastShotType: 'serve',
      }
      
      handleAwardPoint(pendingPointWinner, storePointDetail)
      setPendingPointWinner(null)
      setShowSimpleStats(false)
    }
  }

  const handlePointDetailSave = (pointDetail: Partial<LibPointDetail>) => {
    if (pendingPointWinner) {
      const storePointDetail: Partial<StorePointDetail> = {
        ...pointDetail,
        serveType: serveType,
        lastShotType: pointDetail.lastShotType === 'drop_shot' ? 'other' : (pointDetail.lastShotType as StorePointDetail['lastShotType'])
      }
      handleAwardPoint(pendingPointWinner, storePointDetail)
      setPendingPointWinner(null)
      setShowPointDetail(false)
    }
  }

  const handleUndo = async () => {
    if (pointLog.length === 0) return

    try {
      const result = undoLastPoint()
      
      await updateMatchScore(match.$id, {
        score: result.newScore,
        pointLog: result.newPointLog
      })
      
      // Play undo sound effect
      playSound('undo')
      
      setIsInGame(result.newPointLog.length > 0)
      toast.success("Point undone")
    } catch (error) {
      console.error("Failed to undo point:", error)
      playSound('error')
      toast.error("Failed to undo point")
    }
  }

  const handleRetireMatch = async (reason: 'retired' | 'weather' | 'injury') => {
    try {
      if (!selectedWinner) {
        toast.error("Please select which player won")
        return
      }

      // Determine winner ID based on selection
      const winnerId = selectedWinner === 'p1' ? match.playerOne.$id : match.playerTwo.$id

      // Create a new score showing 1-0 sets for the winner
      const retiredScore: Score = {
        sets: selectedWinner === 'p1' ? [[1, 0]] : [[0, 1]],
        games: [0, 0],
        points: [0, 0],
        isTiebreak: false,
        tiebreakPoints: [0, 0],
      }

      const updateData: {
        status: "Completed"
        winnerId: string
        retirementReason: string
        endTime: string
        duration?: number
      } = {
        status: "Completed",
        winnerId,
        retirementReason: reason,
        endTime: new Date().toISOString()
      }

      // Calculate duration if we have a start time
      if (startTime) {
        updateData.duration = Math.round((new Date().getTime() - new Date(startTime).getTime()) / 60000)
      }

      await updateMatchScore(match.$id, {
        score: retiredScore,
        pointLog,
        ...updateData
      })
      
      const reasonText = reason === 'retired' ? 'retirement' : 
                        reason === 'weather' ? 'weather conditions' : 'injury'
      const winnerName = selectedWinner === 'p1' ? playerNames.p1 : playerNames.p2
      
      // Trigger celebratory confetti for match completion
      triggerMatchWinConfetti()
      
      toast.success(`Match ended due to ${reasonText}. ${winnerName} wins 1-0.`)
      setShowRetireDialog(false)
      setRetireReason('')
      setSelectedWinner('')
      
      // Navigate to match details after a short delay
      setTimeout(() => {
        router.push(`/matches/${match.$id}`)
      }, 2000)
    } catch (error) {
      console.error("Failed to retire match:", error)
      toast.error("Failed to end match")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${match.$id}` : ''
    const shareTitle = `${playerNames.p1} vs ${playerNames.p2} - Live Tennis Match`
    const shareText = `Watch this live tennis match between ${playerNames.p1} and ${playerNames.p2}!`
    
    // Try native share first (works best on mobile)
    if (typeof navigator !== 'undefined' && navigator.share && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        })
        toast.success("Match shared successfully!")
        return
      } catch (err) {
        // User canceled or share failed
        console.log("Native share failed:", err)
        // Fall through to show dialog
      }
    }
    
    // Show custom share dialog as fallback
    setShowShareDialog(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Enhanced Header with More Space */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          {/* Top row: Back button, title, and action buttons */}
          <div className="flex items-center justify-between h-12 border-b border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {match.tournamentName && (
                <span className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mr-2">
                  {match.tournamentName}
                </span>
              )}
              <h1 className="text-lg font-bold">Live Match</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Breakpoint indicator in header */}
              {pointSituation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600">
                    {pointSituation.badge}
                  </Badge>
                </motion.div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('share')}</span>
              </Button>
            </div>
          </div>


        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-3 space-y-4">
        {/* Live Scoreboard */}
        <LiveScoreboard
          playerOneName={playerNames.p1}
          playerTwoName={playerNames.p2}
          playerThreeName={playerNames.p3}
          playerFourName={playerNames.p4}
          playerOneAvatar={<PlayerAvatar player={match.playerOne} className="h-5 w-5" />}
          playerTwoAvatar={<PlayerAvatar player={match.playerTwo} className="h-5 w-5" />}
          playerOneYearOfBirth={match.playerOne.yearOfBirth}
          playerTwoYearOfBirth={match.playerTwo.yearOfBirth}
          playerThreeYearOfBirth={match.playerThree?.yearOfBirth}
          playerFourYearOfBirth={match.playerFour?.yearOfBirth}
          playerOneRating={match.playerOne.rating}
          playerTwoRating={match.playerTwo.rating}
          playerThreeRating={match.playerThree?.rating}
          playerFourRating={match.playerFour?.rating}
          score={score}
          currentServer={currentServer}
          status={match.status}
          playerOneId={match.playerOne.$id}
          playerTwoId={match.playerTwo.$id}
          isInGame={isInGame}
          onSetServer={setServer}
          matchFormat={parsedMatchFormat}
        />

        {/* Point Entry Interface */}
        <PointEntry 
          onPointWin={handlePointWin} 
          score={score}
          isTiebreak={isTiebreak}
          pointSituation={pointSituation}
          playerNames={playerNames}
          players={players}
          p1Streak={p1Streak}
          p2Streak={p2Streak}
        />

        {/* Match Momentum Bar */}
        {pointLog.length > 0 && (
          <MomentumBar
            pointLog={pointLog}
            playerNames={playerNames}
            className="mx-auto max-w-md"
            compact={true}
            maxPoints={10}
          />
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={pointLog.length === 0}
            className="flex items-center gap-2"
          >
            <Undo className="h-4 w-4" />
            {t('undo')}
          </Button>

          {/* Match Timer */}
          <MatchTimerDisplay 
            startTime={match.startTime}
            endTime={match.endTime}
            setDurations={match.setDurations}
            isMatchComplete={match.status === "Completed"}
          />

          {/* Compact Serve Type Switcher */}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
            <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
              serveType === 'first' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground'
            }`}>
              <Activity className="h-3 w-3" />
              1st
            </span>
            <Switch
              id="serve-type"
              checked={serveType === 'second'}
              onCheckedChange={(checked) => setServeType(checked ? 'second' : 'first')}
              className="data-[state=checked]:bg-orange-500 scale-75"
            />
            <span className={`text-xs font-medium px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
              serveType === 'second' 
                ? 'bg-orange-500 text-white shadow-sm' 
                : 'text-muted-foreground'
            }`}>
              <Activity className="h-3 w-3" />
              2nd
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">{t('statsTab')}</TabsTrigger>
            <TabsTrigger value="points">{t('pointsTab')}</TabsTrigger>
            <TabsTrigger value="commentary">{t('commentaryTab')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="mt-4">
            <MatchStatsComponentSimpleFixed 
              stats={calculateMatchStats(convertedPointLog)}
              playerNames={{
                p1: playerNames.p1,
                p2: playerNames.p2
              }}
              detailLevel={detailLevel}
              pointLog={convertedPointLog}
            />
          </TabsContent>
          
          <TabsContent value="points" className="mt-4">
            <PointByPointView 
              pointLog={convertedPointLog} 
            />
          </TabsContent>
          
          <TabsContent value="commentary" className="mt-4">
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Commentary feature coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* End Match Button */}
        <div className="mt-8 pb-20">
          <Button 
            variant="outline" 
            className="w-full h-12"
            onClick={() => setShowRetireDialog(true)}
          >
            <Trophy className="h-4 w-4 mr-2" />
            {t('endMatch')}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ShareDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        matchId={match.$id}
        playerNames={playerNames}
      />

      <SimpleStatsPopup
        open={showSimpleStats}
        onOpenChange={setShowSimpleStats}
        onSave={handleSimpleStatsOutcome}
        pointContext={{
          pointNumber: pointLog.length + 1,
          setNumber: score.sets.length + 1,
          gameNumber: score.games[0] + score.games[1] + 1,
          gameScore: getGameScore(),
          winner: pendingPointWinner || 'p1',
          server: currentServer || 'p1',
          serveType: serveType,
          playerNames
        }}
      />

      <PointDetailSheet
        open={showPointDetail}
        onOpenChange={setShowPointDetail}
        onSave={handlePointDetailSave}
        pointContext={{
          pointNumber: pointLog.length + 1,
          setNumber: score.sets.length + 1,
          gameNumber: score.games[0] + score.games[1] + 1,
          gameScore: getGameScore(),
          winner: pendingPointWinner || 'p1',
          server: currentServer || 'p1',
          serveType: serveType,
                      isBreakPoint: Boolean(pointSituation && pointSituation.type === 'breakPoint'),
            isSetPoint: Boolean(pointSituation && pointSituation.type === 'setPoint'),
            isMatchPoint: Boolean(pointSituation && pointSituation.type === 'matchPoint'),
          playerNames
        }}
      />

      <Dialog open={showRetireDialog} onOpenChange={setShowRetireDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('endMatch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">
                {t('whyEndingMatch')}
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="completed"
                    checked={retireReason === 'completed'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | 'retired' | 'weather' | 'injury')}
                    className="text-primary"
                  />
                  <span>{t('matchCompletedNormally')}</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="retired"
                    checked={retireReason === 'retired'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | 'retired' | 'weather' | 'injury')}
                    className="text-primary"
                  />
                  <span>{t('playerRetired')}</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="weather"
                    checked={retireReason === 'weather'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | 'retired' | 'weather' | 'injury')}
                    className="text-primary"
                  />
                  <span>{t('weatherConditions')}</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="injury"
                    checked={retireReason === 'injury'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | 'retired' | 'weather' | 'injury')}
                    className="text-primary"
                  />
                  <span>{t('injury')}</span>
                </label>
              </div>
            </div>

            {/* Winner Selection - only show for early endings */}
            {retireReason && retireReason !== 'completed' && (
              <div>
                <p className="text-muted-foreground mb-4">
                  Which player should be declared the winner?
                </p>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="selectedWinner"
                      value="p1"
                      checked={selectedWinner === 'p1'}
                      onChange={(e) => setSelectedWinner(e.target.value as 'p1' | 'p2')}
                      className="text-primary"
                    />
                    <PlayerAvatar player={match.playerOne} className="h-6 w-6" />
                    <span className="font-medium">{playerNames.p1}</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="selectedWinner"
                      value="p2"
                      checked={selectedWinner === 'p2'}
                      onChange={(e) => setSelectedWinner(e.target.value as 'p1' | 'p2')}
                      className="text-primary"
                    />
                    <PlayerAvatar player={match.playerTwo} className="h-6 w-6" />
                    <span className="font-medium">{playerNames.p2}</span>
                  </label>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  The final score will be recorded as 1-0 sets for the selected winner.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => {
              setShowRetireDialog(false)
              setRetireReason('')
              setSelectedWinner('')
            }}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={() => {
                if (retireReason === 'completed') {
                  router.push(`/matches/${match.$id}`)
                } else if (retireReason && selectedWinner) {
                  handleRetireMatch(retireReason as 'retired' | 'weather' | 'injury')
                } else if (retireReason && !selectedWinner) {
                  toast.error("Please select which player won")
                }
                
                if (retireReason === 'completed') {
                  setShowRetireDialog(false)
                  setRetireReason('')
                  setSelectedWinner('')
                }
              }}
              disabled={!retireReason || (retireReason !== 'completed' && !selectedWinner)}
            >
              {t('endMatch')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 