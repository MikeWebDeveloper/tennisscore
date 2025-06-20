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
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MatchStatsComponentSimple } from "../../../[id]/_components/match-stats"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { useMatchStore, PointDetail as StorePointDetail } from "@/stores/matchStore"

interface LiveScoringInterfaceProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    matchFormat: string
    score: string
    pointLog?: string[]
    status: string
    scoreParsed: Score
    matchFormatParsed?: MatchFormat
  }
}

// Share Dialog Component
function ShareDialog({ open, onOpenChange, matchId, playerNames }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  playerNames: { p1: string; p2: string }
}) {
  const shareUrl = `${window.location.origin}/live/${matchId}`
  const shareText = `🎾 Live Tennis Match: ${playerNames.p1} vs ${playerNames.p2}`

  const shareOptions = [
    { name: "Messenger", icon: MessageCircle, url: `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`, color: "bg-blue-500" },
    { name: "WhatsApp", icon: MessageSquare, url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, color: "bg-green-500" },
    { name: "SMS", icon: Mail, url: `sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, color: "bg-gray-500" },
    { name: "Copy Link", icon: Copy, action: () => {
        navigator.clipboard.writeText(shareUrl)
        toast.success("Link copied to clipboard!")
        onOpenChange(false)
      },
      color: "bg-primary"
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Live Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={`h-16 flex flex-col gap-1 text-white border-0 hover:opacity-90 ${option.color}`}
                onClick={() => {
                  if (option.action) option.action()
                  else if (option.url) window.open(option.url, '_blank', 'noopener,noreferrer')
                }}
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

// Redesigned Scoreboard Component - More Fluid and Responsive
function LiveScoreboard({
  playerOneName,
  playerTwoName,
  score,
  currentServer,
  isInGame,
  onServerClick,
  isTiebreak,
}: {
  playerOneName: string
  playerTwoName: string
  score: Score
  currentServer: 'p1' | 'p2' | null
  isInGame: boolean
  onServerClick: () => void
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

  // Helper to render set score
  const renderSetScore = (playerIndex: number) => {
    return score.sets.map((set, setIndex) => {
      const isWinner = set[playerIndex] > set[1 - playerIndex]
      return (
        <div 
          key={setIndex} 
          className={cn(
            "text-center font-mono text-sm sm:text-base",
            isWinner && "font-bold"
          )}
        >
          {set[playerIndex]}
        </div>
      )
    })
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      {/* Player 1 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentServer === "p1" && (
              <motion.button 
                layoutId="tennis-ball" 
                onClick={onServerClick} 
                className="flex-shrink-0 hover:bg-muted rounded-full p-1 transition-colors" 
                disabled={isInGame} 
                whileTap={!isInGame ? { scale: 0.95 } : {}}
                title={isInGame ? "Cannot change server after match started" : "Click to change server"}
              >
                <TennisBallIcon className="w-4 h-4" />
              </motion.button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg sm:text-xl md:text-2xl truncate">
                {playerOneName}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Set scores */}
            <div className="flex gap-2">
              {renderSetScore(0)}
            </div>
            
            {/* Games */}
            <div className="text-xl sm:text-2xl font-mono font-bold min-w-[2rem] text-center">
              {score.games[0]}
            </div>
            
            {/* Points */}
            <div className="text-2xl sm:text-3xl font-mono font-bold text-primary min-w-[3rem] text-center">
              {getPointDisplay(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Player 2 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {currentServer === "p2" && (
              <motion.button 
                layoutId="tennis-ball" 
                onClick={onServerClick} 
                className="flex-shrink-0 hover:bg-muted rounded-full p-1 transition-colors" 
                disabled={isInGame} 
                whileTap={!isInGame ? { scale: 0.95 } : {}}
                title={isInGame ? "Cannot change server after match started" : "Click to change server"}
              >
                <TennisBallIcon className="w-4 h-4" />
              </motion.button>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg sm:text-xl md:text-2xl truncate">
                {playerTwoName}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Set scores */}
            <div className="flex gap-2">
              {renderSetScore(1)}
            </div>
            
            {/* Games */}
            <div className="text-xl sm:text-2xl font-mono font-bold min-w-[2rem] text-center">
              {score.games[1]}
            </div>
            
            {/* Points */}
            <div className="text-2xl sm:text-3xl font-mono font-bold text-primary min-w-[3rem] text-center">
              {getPointDisplay(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  const [pendingPointWinner, setPendingPointWinner] = useState<'p1' | 'p2' | null>(null)
  const [serveType, setServeType] = useState<'first' | 'second'>('first')
  const [isInGame, setIsInGame] = useState(false)
  const [isMatchInitialized, setIsMatchInitialized] = useState(false)
  
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`,
  }

  // Convert store point details to lib point details for stats calculation
  const convertedPointLog: LibPointDetail[] = pointLog.map(point => ({
    ...point,
    lastShotType: point.lastShotType === 'other' ? 'serve' : (point.lastShotType as LibPointDetail['lastShotType'])
  }))
  
  const matchStats = calculateMatchStats(convertedPointLog)
  
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

      await updateMatchScore(match.$id, {
        score: result.newScore,
        pointLog: [...pointLog, result.pointDetail]
      })

      if (result.isMatchComplete) {
        toast.success(`Match completed! ${result.winnerId === match.playerOne.$id ? playerNames.p1 : playerNames.p2} wins!`)
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

  const handleEndMatch = () => {
    router.push(`/matches/${match.$id}`)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Live Tennis Match',
        text: `🎾 ${playerNames.p1} vs ${playerNames.p2}`,
        url: `${window.location.origin}/live/${match.$id}`
      }).catch(console.error)
    } else {
      setShowShareDialog(true)
    }
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
              {playerNames.p1} vs {playerNames.p2}
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
          score={score}
          currentServer={currentServer}
          isInGame={isInGame}
          onServerClick={() => setShowServeSwapConfirm(true)}
          isTiebreak={isTiebreak}
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
              stats={matchStats} 
              playerNames={playerNames}
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
            onClick={handleEndMatch}
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
    </div>
  )
} 