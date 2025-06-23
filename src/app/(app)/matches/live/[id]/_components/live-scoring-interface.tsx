"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Undo,
  Trophy,
  Share2,
  MessageCircle,
  MessageSquare,
  Copy,
  Mail
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { Player, PointDetail as LibPointDetail, Score, MatchFormat } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointByPointView } from "../../../[id]/_components/point-by-point-view"
import { PointDetailSheet } from "./point-detail-sheet"
import { SimpleStatsPopup, SimplePointOutcome } from "./simple-stats-popup"
import { LiveScoreboard as SharedLiveScoreboard } from "@/components/shared/live-scoreboard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { MatchStatsComponentSimple } from "@/app/(app)/matches/[id]/_components/match-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { useMatchStore, PointDetail as StorePointDetail } from "@/stores/matchStore"

interface LiveScoringInterfaceProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    playerThree?: Player
    playerFour?: Player
    matchFormat: string
    score: string
    pointLog?: string[]
    status: string
    scoreParsed: Score
    matchFormatParsed?: MatchFormat
    startTime?: string
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
  isTiebreak
}: { 
  onPointWin: (winner: "p1" | "p2") => void,
  score: Score,
  isTiebreak: boolean
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

  return (
    <div className="grid grid-cols-2 gap-3 my-6">
      <motion.div 
        onClick={() => onPointWin("p1")}
        className="h-32 sm:h-40 bg-card border rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-4xl sm:text-6xl font-black font-mono text-center text-card-foreground">
          {getPointDisplay(0)}
        </span>
      </motion.div>
      <motion.div 
        onClick={() => onPointWin("p2")}
        className="h-32 sm:h-40 bg-card border rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-4xl sm:text-6xl font-black font-mono text-center text-card-foreground">
          {getPointDisplay(1)}
        </span>
      </motion.div>
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  
  // Use match store
  const { 
    score, 
    pointLog, 
    currentServer,
    initializeMatch, 
    awardPoint, 
    undoLastPoint, 
    setServer
  } = useMatchStore()
  
  // Local state for UI
  const [showServeSwapConfirm, setShowServeSwapConfirm] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPointDetail, setShowPointDetail] = useState(false)
  const [showSimpleStats, setShowSimpleStats] = useState(false)
  const [showRetireDialog, setShowRetireDialog] = useState(false)
  const [retireReason, setRetireReason] = useState<'completed' | 'retired' | 'weather' | 'injury' | ''>('')
  const [pendingPointWinner, setPendingPointWinner] = useState<'p1' | 'p2' | null>(null)
  const [serveType, setServeType] = useState<'first' | 'second'>('first')
  const [isInGame, setIsInGame] = useState(false)
  const [isMatchInitialized, setIsMatchInitialized] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`,
    p3: match.playerThree ? `${match.playerThree.firstName} ${match.playerThree.lastName}` : undefined,
    p4: match.playerFour ? `${match.playerFour.firstName} ${match.playerFour.lastName}` : undefined,
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
        finalSetTiebreak: parsed.finalSetTiebreak || false,
        finalSetTiebreakAt: parsed.finalSetTiebreakAt || 10,
        detailLevel: parsed.detailLevel || "simple"
      }
    } catch (error) {
      console.error("Failed to parse match format:", error)
      return {
        sets: 3,
        noAd: false,
        tiebreak: true,
        finalSetTiebreak: false,
        finalSetTiebreakAt: 10,
        detailLevel: "simple"
      }
    }
  }, [match.matchFormat])
  
  const detailLevel = parsedMatchFormat.detailLevel || "simple"
  const isTiebreak = score.isTiebreak || false
  
  // Memoized serve type handler
  const handleServeTypeChange = useCallback((checked: boolean) => {
    setServeType(checked ? 'second' : 'first')
  }, [])
  
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
    
    let parsedScore: Score
    try {
      parsedScore = JSON.parse(match.score)
    } catch (error) {
      console.error("Failed to parse match score:", error)
      parsedScore = { sets: [], games: [0, 0], points: [0, 0] }
    }

    const matchData = {
      $id: match.$id,
      playerOneId: match.playerOne.$id,
      playerTwoId: match.playerTwo.$id,
      matchDate: new Date().toISOString(),
      matchFormat: parsedMatchFormat,
      status: match.status as 'In Progress' | 'Completed',
      winnerId: match.status === 'Completed' ? undefined : undefined,
      score: parsedScore,
      pointLog: existingPointLog,
      events: [],
      userId: match.playerOne.userId || ''
    }
    
    try {
      initializeMatch(matchData)
      setIsInGame(existingPointLog.length > 0)
      setIsMatchInitialized(true)
      setStartTime(match.startTime || null)
    } catch (error) {
      console.error("Failed to initialize match:", error)
    }
  }, [match, parsedMatchFormat, initializeMatch])

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

  const handleServeSwap = () => {
    if (isInGame) {
      toast.error("Cannot change server after the match has started.")
      setShowServeSwapConfirm(false)
      return
    }
    
    if (currentServer) {
      const newServer = currentServer === 'p1' ? 'p2' : 'p1'
      setServer(newServer)
      const newServerName = newServer === 'p1' ? playerNames.p1 : playerNames.p2
      toast.success(`Server changed to ${newServerName}`)
    }
    setShowServeSwapConfirm(false)
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

    // For "Points Only", create a minimal point object and save it immediately
    if (detailLevel === 'points') {
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
      setPendingPointWinner(winner)
      setShowSimpleStats(true)
      return
    }

    // For complex mode, use the detailed sheet
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

      // Reset serve type back to first serve for next point
      setServeType('first')

      // Prepare update data with match completion if necessary
      const updateData: {
        score: Score
        pointLog: StorePointDetail[]
        status?: "In Progress" | "Completed"
        winnerId?: string
        startTime?: string
        endTime?: string
        duration?: number
      } = {
        score: result.newScore,
        pointLog: [...pointLog, result.pointDetail]
      }
      
      if (result.isMatchComplete && result.winnerId) {
        updateData.status = "Completed"
        updateData.winnerId = result.winnerId
      }

      // Add timing data if available
      if (result.startTime) {
        updateData.startTime = result.startTime
      }
      if (result.endTime) {
        updateData.endTime = result.endTime
      }
      if (result.duration !== undefined) {
        updateData.duration = result.duration
      }

      console.log("About to save to database:", {
        matchId: match.$id,
        updateData,
        pointLogLength: updateData.pointLog.length,
        isMatchComplete: result.isMatchComplete,
        newScore: result.newScore
      })

      await updateMatchScore(match.$id, updateData)

      console.log("Successfully saved to database")

      if (result.isMatchComplete) {
        const winnerName = result.winnerId === match.playerOne.$id ? playerNames.p1 : playerNames.p2
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
      
      setIsInGame(result.newPointLog.length > 0)
      toast.success("Point undone")
    } catch (error) {
      console.error("Failed to undo point:", error)
      toast.error("Failed to undo point")
    }
  }

  const handleRetireMatch = async (reason: 'retired' | 'weather' | 'injury') => {
    try {
      // Update match as completed with retirement reason
      const updateData: {
        status: "Completed"
        winnerId?: string
        retirementReason?: string
        endTime?: string
        duration?: number
      } = {
        status: "Completed",
        retirementReason: reason,
        endTime: new Date().toISOString()
      }
      
      // If match has started, determine winner based on current score
      if (pointLog.length > 0) {
        // Simple logic: player with more sets/games wins, or player 1 if tied
        const p1SetsWon = score.sets.filter(set => set[0] > set[1]).length
        const p2SetsWon = score.sets.filter(set => set[1] > set[0]).length
        
        if (p1SetsWon > p2SetsWon) {
          updateData.winnerId = match.playerOne.$id
        } else if (p2SetsWon > p1SetsWon) {
          updateData.winnerId = match.playerTwo.$id
        } else {
          // If tied on sets, check games in the current set
          const p1Games = score.games[0]
          const p2Games = score.games[1]
          updateData.winnerId = p1Games >= p2Games ? match.playerOne.$id : match.playerTwo.$id
        }
      } else {
        // No points played, default to player 1 as winner
        updateData.winnerId = match.playerOne.$id
      }

      // Calculate duration if we have a start time
      if (startTime) {
        updateData.duration = Math.round((new Date().getTime() - new Date(startTime).getTime()) / 60000)
      }

      await updateMatchScore(match.$id, {
        score,
        pointLog,
        ...updateData
      })
      
      const reasonText = reason === 'retired' ? 'retirement' : 
                        reason === 'weather' ? 'weather conditions' : 'injury'
      
      toast.success(`Match ended due to ${reasonText}`)
      setShowRetireDialog(false)
      
      // Navigate to match details after a short delay
      setTimeout(() => {
        router.push(`/matches/${match.$id}`)
      }, 2000)
    } catch (error) {
      console.error("Failed to retire match:", error)
      toast.error("Failed to end match")
    }
  }

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Live Match</h1>
            <p className="text-sm text-muted-foreground">
              {playerNames.p3 && playerNames.p4 
                ? `${playerNames.p1} / ${playerNames.p3} vs ${playerNames.p2} / ${playerNames.p4}`
                : `${playerNames.p1} vs ${playerNames.p2}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Live
          </Badge>
        </div>
      </div>

      {/* Main Content with Container */}
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        {/* Scoreboard */}
        <LiveScoreboard
          playerOneName={playerNames.p1}
          playerTwoName={playerNames.p2}
          playerThreeName={playerNames.p3}
          playerFourName={playerNames.p4}
          playerOneYearOfBirth={match.playerOne.yearOfBirth}
          playerTwoYearOfBirth={match.playerTwo.yearOfBirth}
          playerThreeYearOfBirth={match.playerThree?.yearOfBirth}
          playerFourYearOfBirth={match.playerFour?.yearOfBirth}
          playerOneRating={match.playerOne.rating}
          playerTwoRating={match.playerTwo.rating}
          playerThreeRating={match.playerThree?.rating}
          playerFourRating={match.playerFour?.rating}
          score={{ ...score, isTiebreak }}
          currentServer={currentServer}
          isInGame={isInGame}
          onServerClick={() => setShowServeSwapConfirm(true)}
        />

        {/* Point Entry */}
        <PointEntry 
          onPointWin={handlePointWin}
          score={score}
          isTiebreak={isTiebreak}
        />

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={pointLog.length === 0}
            className="flex items-center gap-2"
          >
            <Undo className="h-4 w-4" />
            Undo
          </Button>

          <div className="flex items-center gap-2">
            <Switch
              id="serve-type"
              checked={serveType === 'second'}
              onCheckedChange={handleServeTypeChange}
            />
            <Label htmlFor="serve-type" className="text-sm">
              {serveType === 'first' ? '1st' : '2nd'} Serve
            </Label>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="commentary">Commentary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="mt-4">
            <MatchStatsComponentSimple 
              stats={calculateMatchStats(convertedPointLog)}
              playerNames={{
                p1: playerNames.p1,
                p2: playerNames.p2
              }}
              detailLevel={detailLevel}
            />
          </TabsContent>
          
          <TabsContent value="points" className="mt-4">
            <PointByPointView 
              pointLog={convertedPointLog} 
              playerNames={playerNames}
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
            End Match
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showServeSwapConfirm} onOpenChange={setShowServeSwapConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Server</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {isInGame 
              ? "Cannot change server after match has started." 
              : `Switch server from ${currentServer === 'p1' ? playerNames.p1 : playerNames.p2} to ${currentServer === 'p1' ? playerNames.p2 : playerNames.p1}?`
            }
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowServeSwapConfirm(false)}>
              Cancel
            </Button>
            {!isInGame && (
              <Button onClick={handleServeSwap}>
                Change Server
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
          isBreakPoint: false,
          isSetPoint: false,
          isMatchPoint: false,
          playerNames
        }}
      />

      <Dialog open={showRetireDialog} onOpenChange={setShowRetireDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Match</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Why are you ending the match?
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
                <span>Match completed normally</span>
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
                <span>Player retired</span>
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
                <span>Weather conditions</span>
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
                <span>Injury</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => {
              setShowRetireDialog(false)
              setRetireReason('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (retireReason === 'completed') {
                  router.push(`/matches/${match.$id}`)
                } else if (retireReason) {
                  handleRetireMatch(retireReason as 'retired' | 'weather' | 'injury')
                }
                setShowRetireDialog(false)
                setRetireReason('')
              }}
              disabled={!retireReason}
            >
              End Match
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 