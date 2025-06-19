"use client"

import { useState, useEffect } from "react"
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
import { Player, PointDetail, TennisScore, Score } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointByPointView } from "../../../[id]/_components/point-by-point-view"
import { PointDetailSheet } from "./point-detail-sheet"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"

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
    matchFormatParsed?: {
      sets: number
      noAd: boolean
      detailLevel?: "points" | "simple" | "complex"
    }
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

// New Scoreboard Component
function LiveScoreboard({
  playerOneName,
  playerTwoName,
  score,
  currentServer,
  isInGame,
  onServerClick,
}: {
  playerOneName: string
  playerTwoName: string
  score: TennisScore
  currentServer: 'p1' | 'p2' | null
  isInGame: boolean
  onServerClick: () => void
}) {
  const getPointDisplay = (points: number[], playerIndex: number) => {
    const p1 = points[0]
    const p2 = points[1]
    if (p1 >= 3 && p2 >= 3) {
      if (p1 === p2) return "40"
      if (p1 > p2 && playerIndex === 0) return "AD"
      if (p2 > p1 && playerIndex === 1) return "AD"
    }
    const pointMap = ["0", "15", "30", "40"]
    return pointMap[points[playerIndex]] || "40"
  }

  // Create dynamic columns based on completed sets plus current set
  const completedSets = score.sets.length
  const totalSetsToShow = Math.max(completedSets + 1, 3) // Show at least 3 set columns
  const setsWon = [
    score.sets.filter(set => set[0] > set[1]).length,
    score.sets.filter(set => set[1] > set[0]).length
  ]

  // Create grid template for dynamic columns
  const gridCols = `1fr repeat(${totalSetsToShow}, minmax(40px, 1fr)) minmax(50px, 1fr) minmax(60px, 1fr)`

  return (
    <div className="bg-card text-card-foreground rounded-lg border my-4 overflow-x-auto">
      {/* Header Row */}
      <div className="grid items-center p-2 border-b text-xs text-muted-foreground min-w-max" style={{ gridTemplateColumns: gridCols }}>
        <div className="font-semibold uppercase tracking-wider">Player</div>
        {Array.from({ length: totalSetsToShow }, (_, i) => (
          <div key={i} className="text-center">Set {i + 1}</div>
        ))}
        <div className="text-center">Games</div>
        <div className="text-center">Points</div>
      </div>
      
      {/* Player 1 Row */}
      <div className="grid items-center p-3 font-medium min-w-max" style={{ gridTemplateColumns: gridCols }}>
        <div className="flex items-center gap-3">
          {currentServer === "p1" && (
            <motion.button 
              layoutId="tennis-ball" 
              onClick={onServerClick} 
              className="flex-shrink-0"
              disabled={isInGame}
              whileTap={!isInGame ? { scale: 0.95 } : {}}
            >
              <TennisBallIcon className="w-4 h-4" />
            </motion.button>
          )}
          <span className="font-sans font-semibold tracking-wide">{playerOneName}</span>
          <Badge variant="secondary" className="text-xs">{setsWon[0]}</Badge>
        </div>
        {Array.from({ length: totalSetsToShow }, (_, i) => (
          <div key={i} className="text-center font-mono text-lg">
            {i < completedSets ? score.sets[i][0] : (i === completedSets ? score.games[0] : '-')}
          </div>
        ))}
        <div className="text-center font-mono text-xl">{score.games[0]}</div>
        <div className="text-center font-mono text-xl font-bold text-primary">
          {getPointDisplay(score.points, 0)}
        </div>
      </div>

      <div className="border-t"></div>

      {/* Player 2 Row */}
      <div className="grid items-center p-3 font-medium min-w-max" style={{ gridTemplateColumns: gridCols }}>
        <div className="flex items-center gap-3">
          {currentServer === "p2" && (
            <motion.button 
              layoutId="tennis-ball" 
              onClick={onServerClick} 
              className="flex-shrink-0"
              disabled={isInGame}
              whileTap={!isInGame ? { scale: 0.95 } : {}}
            >
              <TennisBallIcon className="w-4 h-4" />
            </motion.button>
          )}
          <span className="font-sans font-semibold tracking-wide">{playerTwoName}</span>
          <Badge variant="secondary" className="text-xs">{setsWon[1]}</Badge>
        </div>
        {Array.from({ length: totalSetsToShow }, (_, i) => (
          <div key={i} className="text-center font-mono text-lg">
            {i < completedSets ? score.sets[i][1] : (i === completedSets ? score.games[1] : '-')}
          </div>
        ))}
        <div className="text-center font-mono text-xl">{score.games[1]}</div>
        <div className="text-center font-mono text-xl font-bold text-primary">
          {getPointDisplay(score.points, 1)}
        </div>
      </div>
    </div>
  )
}

// New Interactive Point Entry Component
function PointEntry({ 
  onPointWin,
  score
}: { 
  onPointWin: (winner: "p1" | "p2") => void,
  score: TennisScore
}) {
  const getPointDisplay = (points: number) => {
    if (score.points[0] >= 3 && score.points[1] >= 3) {
      if (score.points[0] === score.points[1]) return "40"
      if (points > Math.min(score.points[0], score.points[1])) return "AD"
    }
    const pointMap = ["0", "15", "30", "40"]
    return pointMap[points] || "40"
  }
  return (
    <div className="grid grid-cols-2 items-center justify-around gap-2 my-6">
      <div 
        onClick={() => onPointWin("p1")}
        className="h-32 bg-card border rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors"
      >
        <span className="text-6xl font-black font-mono text-center text-card-foreground">
          {getPointDisplay(score.points[0])}
        </span>
      </div>
      <div 
        onClick={() => onPointWin("p2")}
        className="h-32 bg-card border rounded-lg flex items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors"
      >
        <span className="text-6xl font-black font-mono text-center text-card-foreground">
          {getPointDisplay(score.points[1])}
        </span>
      </div>
    </div>
  )
}

// Simple stats display for live match
function SimpleStatsDisplay({ points, playerNames }: { points: PointDetail[], playerNames: {p1: string, p2: string} }) {
  const p1Points = points.filter(p => p.winner === "p1").length
  const p2Points = points.filter(p => p.winner === "p2").length
  
  const p1ServePointsWon = points.filter(p => p.server === "p1" && p.winner === "p1").length
  const p1ServePointsTotal = points.filter(p => p.server === "p1").length
  
  const p2ServePointsWon = points.filter(p => p.server === "p2" && p.winner === "p2").length
  const p2ServePointsTotal = points.filter(p => p.server === "p2").length

  const p1BreakPointsWon = points.filter(p => p.winner === "p1" && p.server === "p2" && p.isBreakPoint).length
  const p1BreakPointsTotal = points.filter(p => p.server === "p2" && p.isBreakPoint).length
  
  const p2BreakPointsWon = points.filter(p => p.winner === "p2" && p.server === "p1" && p.isBreakPoint).length
  const p2BreakPointsTotal = points.filter(p => p.server === "p1" && p.isBreakPoint).length
  
  const StatRow = ({ label, p1Value, p2Value }: { label: string; p1Value: string | number; p2Value: string | number }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b last:border-b-0">
      <div className="font-medium">{p1Value}</div>
      <div className="text-muted-foreground text-xs text-center px-2">{label}</div>
      <div className="font-medium">{p2Value}</div>
    </div>
  )

  return (
    <div className="p-2">
      <div className="flex justify-between items-center text-sm font-semibold mb-2">
        <span>{playerNames.p1}</span>
        <span>{playerNames.p2}</span>
      </div>
      <StatRow label="Total Points Won" p1Value={p1Points} p2Value={p2Points} />
      <StatRow label="Service Pts Won" p1Value={`${p1ServePointsWon}/${p1ServePointsTotal}`} p2Value={`${p2ServePointsWon}/${p2ServePointsTotal}`} />
      <StatRow label="Break Pts Won" p1Value={`${p1BreakPointsWon}/${p1BreakPointsTotal}`} p2Value={`${p2BreakPointsWon}/${p2BreakPointsTotal}`} />
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  
  // Local state for UI
  const [showServeSwapConfirm, setShowServeSwapConfirm] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPointDetail, setShowPointDetail] = useState(false)
  const [showServeSelection, setShowServeSelection] = useState(false)
  const [pendingPointWinner, setPendingPointWinner] = useState<'p1' | 'p2' | null>(null)
  const [score, setScore] = useState<TennisScore>({
    sets: [],
    games: [0, 0],
    points: [0, 0],
    server: 'p1',
    gameNumber: 1,
    setNumber: 1
  })
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [isInGame, setIsInGame] = useState(false)
  
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`,
  }

  const detailLevel = match.matchFormatParsed?.detailLevel || "simple"
  
  // Helper function to recalculate score from point log
  const recalculateScoreFromPointLog = (points: PointDetail[]): TennisScore => {
    const newScore: TennisScore = {
      sets: [],
      games: [0, 0],
      points: [0, 0],
      server: 'p1',
      gameNumber: 1,
      setNumber: 1
    }

    if (points.length === 0) {
      return newScore
    }

    // Simple scoring logic
    for (const point of points) {
      const winnerIndex = point.winner === 'p1' ? 0 : 1
      newScore.points[winnerIndex]++

      if (newScore.points[winnerIndex] >= 4 && 
          newScore.points[winnerIndex] - newScore.points[1 - winnerIndex] >= 2) {
        
        newScore.games[winnerIndex]++
        newScore.points = [0, 0]
        newScore.gameNumber++

        if (newScore.games[winnerIndex] >= 6) {
          if (newScore.games[winnerIndex] - newScore.games[1 - winnerIndex] >= 2 || 
              (newScore.games[winnerIndex] === 7 && newScore.games[1 - winnerIndex] === 6)) {
            
            newScore.sets.push([newScore.games[0], newScore.games[1]])
            newScore.games = [0, 0]
            newScore.setNumber++
            newScore.gameNumber = 1
          }
        }
        
        newScore.server = newScore.server === 'p1' ? 'p2' : 'p1'
      }
    }

    return newScore
  }
  
  // Initialize match data
  useEffect(() => {
    const existingPointLog: PointDetail[] = match.pointLog 
      ? match.pointLog.map(pointStr => {
          try {
            return JSON.parse(pointStr)
          } catch (error) {
            console.error("Failed to parse point:", error)
            return null
          }
        }).filter(Boolean)
      : []
    
    setPointLog(existingPointLog)
    
    let initialScore: TennisScore
    if (existingPointLog.length > 0) {
      initialScore = recalculateScoreFromPointLog(existingPointLog)
      setIsInGame(true)
    } else {
      initialScore = {
        sets: [],
        games: [0, 0],
        points: [0, 0],
        server: 'p1', // Default, will be overridden by serve selection
        gameNumber: 1,
        setNumber: 1
      }
      setIsInGame(false)
      // Show serve selection for new matches
      setShowServeSelection(true)
    }
    
    setScore(initialScore)
  }, [match.pointLog])

  const handleServeSwap = () => {
    if (isInGame) {
      toast.error("Cannot change server in the middle of a game!")
      setShowServeSwapConfirm(false)
      return
    }
    
    setScore(prev => ({ 
      ...prev, 
      server: prev.server === 'p1' ? 'p2' : 'p1' 
    }))
    setShowServeSwapConfirm(false)
    toast.success("Server changed")
  }

  const getGameScore = () => {
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

  const handlePointWin = async (winner: 'p1' | 'p2') => {
    // For "points" detail level, just award the point immediately
    if (detailLevel === "points") {
      await awardPoint(winner)
      return
    }
    
    // For "simple" or "complex" detail levels, show point detail sheet
    setPendingPointWinner(winner)
    setShowPointDetail(true)
  }

  const isBreakPoint = (currentScore: TennisScore): boolean => {
    const receiver = currentScore.server === 'p1' ? 'p2' : 'p1'
    const receiverIndex = receiver === 'p1' ? 0 : 1
    const serverIndex = receiver === 'p1' ? 1 : 0
    
    const receiverPoints = currentScore.points[receiverIndex]
    const serverPoints = currentScore.points[serverIndex]
    
    // Standard game breakpoint condition
    if (receiverPoints >= 3 && receiverPoints > serverPoints) {
      return true
    }
    
    return false
  }

  const awardPoint = async (winner: 'p1' | 'p2', pointDetails?: Partial<PointDetail>) => {
    const newPointDetail: PointDetail = {
      id: `${Date.now()}-${Math.random()}`,
      pointNumber: pointLog.length + 1,
      setNumber: score.setNumber,
      gameNumber: score.gameNumber,
      server: score.server,
      winner,
      gameScore: getGameScore(),
      pointOutcome: pointDetails?.pointOutcome || 'winner',
      serveType: pointDetails?.serveType || 'first',
      serveOutcome: pointDetails?.serveOutcome || 'winner',
      rallyLength: pointDetails?.rallyLength || 1,
      isBreakPoint: isBreakPoint(score),
      isSetPoint: false,
      isMatchPoint: false,
      isGameWinning: false,
      isSetWinning: false,
      isMatchWinning: false,
      timestamp: new Date().toISOString(),
      ...pointDetails
    }

    const updatedPointLog = [...pointLog, newPointDetail]
    setPointLog(updatedPointLog)
    
    // Recalculate score
    const newScore = recalculateScoreFromPointLog(updatedPointLog)
    setScore(newScore)
    setIsInGame(true)

    // Save to backend
    try {
      await updateMatchScore(match.$id, {
        score: newScore,
        pointLog: updatedPointLog
      })
    } catch (error) {
      console.error("Failed to update match score:", error)
      toast.error("Failed to save point")
    }
  }

  const handlePointDetailSave = (pointDetail: Partial<PointDetail>) => {
    if (pendingPointWinner) {
      awardPoint(pendingPointWinner, pointDetail)
      setPendingPointWinner(null)
      setShowPointDetail(false)
    }
  }

  const handleSimplePoint = () => {
    if (pendingPointWinner) {
      awardPoint(pendingPointWinner)
      setPendingPointWinner(null)
      setShowPointDetail(false)
    }
  }

  const handleUndo = async () => {
    if (pointLog.length === 0) return

    const updatedPointLog = pointLog.slice(0, -1)
    setPointLog(updatedPointLog)
    
    if (updatedPointLog.length === 0) {
      const initialScore: TennisScore = {
        sets: [],
        games: [0, 0],
        points: [0, 0],
        server: 'p1' as const,
        gameNumber: 1,
        setNumber: 1
      }
      setScore(initialScore)
      setIsInGame(false)
    } else {
      const newScore = recalculateScoreFromPointLog(updatedPointLog)
      setScore(newScore)
    }

    try {
      await updateMatchScore(match.$id, {
        score: score,
        pointLog: updatedPointLog
      })
      toast.success("Point undone")
    } catch (error) {
      console.error("Failed to undo point:", error)
      toast.error("Failed to undo")
    }
  }

  const handleEndMatch = () => {
    toast.success("Match ended")
    router.push(`/matches/${match.$id}`)
  }

  // Enhanced share with native sharing API
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/live/${match.$id}`
    const shareData = {
      title: "Live Tennis Match",
      text: `🎾 ${playerNames.p1} vs ${playerNames.p2}`,
      url: shareUrl,
    }

    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      navigator
        .share(shareData)
        .catch((err) => console.warn("Share cancelled", err))
    } else {
      setShowShareDialog(true)
    }
  }

  const handleServeSelection = (selectedServer: 'p1' | 'p2') => {
    setScore(prev => ({
      ...prev,
      server: selectedServer
    }))
    setShowServeSelection(false)
    toast.success(`${playerNames[selectedServer]} will serve first`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Minimalist Header - Fixed */}
        <div className="flex-shrink-0 bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Badge variant="default" className="bg-green-500 text-white animate-pulse">Live</Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 pb-32 md:pb-24">
            <LiveScoreboard 
              playerOneName={playerNames.p1}
              playerTwoName={playerNames.p2}
              score={score}
              currentServer={score.server}
              isInGame={isInGame}
              onServerClick={() => setShowServeSwapConfirm(true)}
            />

            <PointEntry onPointWin={handlePointWin} score={score} />
            
            <Tabs defaultValue="stats" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="commentary">Commentary</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4">
                <SimpleStatsDisplay points={pointLog} playerNames={playerNames} />
              </TabsContent>
              <TabsContent value="points" className="max-h-96 overflow-y-auto mt-4">
                <PointByPointView pointLog={pointLog} playerNames={playerNames} />
              </TabsContent>
              <TabsContent value="commentary" className="text-center py-8 text-muted-foreground mt-4">
                Commentary coming soon...
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Action Bar - Fixed (Undo/End Match) */}
        <div className="flex-shrink-0 bg-background border-t p-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={pointLog.length === 0} className="flex-1">
              <Undo className="h-4 w-4 mr-2" /> Undo
            </Button>
            <Button variant="destructive" size="sm" onClick={handleEndMatch} className="flex-1">
              <Trophy className="h-4 w-4 mr-2" /> End Match
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ShareDialog 
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        matchId={match.$id}
        playerNames={playerNames}
      />

      {/* Point Detail Sheet */}
      {pendingPointWinner && (
        <PointDetailSheet
          open={showPointDetail}
          onOpenChange={setShowPointDetail}
          onSave={handlePointDetailSave}
          onSimplePoint={handleSimplePoint}
          pointContext={{
            pointNumber: pointLog.length + 1,
            setNumber: score.setNumber,
            gameNumber: score.gameNumber,
            gameScore: getGameScore(),
            winner: pendingPointWinner,
            server: score.server,
            isBreakPoint: isBreakPoint(score),
            isSetPoint: false,   // Could be calculated based on set situation
            isMatchPoint: false, // Could be calculated based on match situation
            playerNames
          }}
        />
      )}

      {/* Serve Swap Confirmation Dialog */}
      <Dialog open={showServeSwapConfirm} onOpenChange={setShowServeSwapConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Server?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to change the server? This action can only be done between games.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowServeSwapConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                onClick={handleServeSwap}
                className="flex-1"
              >
                Change Server
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Initial Serve Selection Dialog */}
      <Dialog open={showServeSelection} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TennisBallIcon className="w-5 h-5" />
              Who serves first?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Choose which player will serve the first game of the match.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleServeSelection('p1')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <TennisBallIcon className="w-6 h-6" />
                <span className="font-medium">{playerNames.p1}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleServeSelection('p2')}
                className="h-16 flex flex-col items-center gap-2"
              >
                <TennisBallIcon className="w-6 h-6" />
                <span className="font-medium">{playerNames.p2}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 