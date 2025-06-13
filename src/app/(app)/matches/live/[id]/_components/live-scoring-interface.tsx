"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Share2, 
  ArrowLeft,
  Target,
  Zap,
  AlertTriangle,
  RotateCcw
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { Player, PointDetail, ServeType, PointOutcome, ShotType } from "@/lib/types"
import { ServeSelection } from "./serve-selection"
import { generatePointContext, calculateMatchStats } from "@/lib/utils/match-stats"
import { reconstructGameProgression, getServer, reconstructMatchScore } from "@/lib/utils/tennis-scoring"

interface PointContext {
  pointNumber: number
  setNumber: number
  gameNumber: number
  gameScore: string
  winner: "p1" | "p2"
  server: "p1" | "p2"
  isBreakPoint: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  playerNames: { p1: string; p2: string }
  gameWon?: boolean
  setWon?: boolean
  matchWon?: boolean
}

interface LiveScoringInterfaceProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    scoreParsed: {
      sets: { p1: number; p2: number }[]
      games: number[]
      points: number[]
    }
    matchFormatParsed: {
      sets: number
      noAd: boolean
    }
    status: "In Progress" | "Completed"
  }
}

interface StatRowProps {
  label: string
  player1Value: number | string
  player2Value: number | string
  isPercentage?: boolean
  player1Detail?: string
  player2Detail?: string
  delay?: number
}

function StatRow({ 
  label, 
  player1Value, 
  player2Value, 
  isPercentage = false,
  player1Detail,
  player2Detail,
  delay = 0
}: StatRowProps) {
  const p1Num = typeof player1Value === 'string' ? parseFloat(player1Value) : player1Value
  const p2Num = typeof player2Value === 'string' ? parseFloat(player2Value) : player2Value
  
  let p1Percentage = 50
  let p2Percentage = 50
  
  if (isPercentage) {
    p1Percentage = Math.min(Math.max(p1Num, 0), 100)
    p2Percentage = Math.min(Math.max(p2Num, 0), 100)
  } else if (p1Num + p2Num > 0) {
    const total = p1Num + p2Num
    p1Percentage = (p1Num / total) * 100
    p2Percentage = (p2Num / total) * 100
  }

  const displayValue1 = isPercentage ? `${p1Num}%` : player1Value.toString()
  const displayValue2 = isPercentage ? `${p2Num}%` : player2Value.toString()

  const hasMaxValue = (isPercentage && (p1Num === 100 || p2Num === 100)) || 
                     (!isPercentage && (p1Percentage === 100 || p2Percentage === 100))

  return (
    <motion.div 
      className="py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.4 }}
    >
      <div className="text-center mb-1.5">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
      </div>

      <div className="relative flex items-center">
        <div className={`text-right pr-3 ${hasMaxValue ? 'w-14' : 'w-12'}`}>
          <div className="text-base font-bold">{displayValue1}</div>
          {player1Detail && (
            <div className="text-xs text-muted-foreground">({player1Detail})</div>
          )}
        </div>
        
        <div className="flex-1 flex items-center">
          <div className="flex-1 h-1 bg-muted overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500 origin-right"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: p1Percentage / 100 }}
              transition={{ 
                delay: delay * 0.15 + 0.4, 
                duration: 1.0, 
                ease: "easeOut" 
              }}
            />
          </div>
          
          <div className="w-px h-3 bg-border mx-1" />
          
          <div className="flex-1 h-1 bg-muted overflow-hidden">
            <motion.div 
              className="h-full bg-red-500 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: p2Percentage / 100 }}
              transition={{ 
                delay: delay * 0.15 + 0.4, 
                duration: 1.0, 
                ease: "easeOut" 
              }}
            />
          </div>
        </div>

        <div className={`text-left pl-3 ${hasMaxValue ? 'w-14' : 'w-12'}`}>
          <div className="text-base font-bold">{displayValue2}</div>
          {player2Detail && (
            <div className="text-xs text-muted-foreground">({player2Detail})</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface PointPopupProps {
  score: string
  serveType: string
  pointOutcome: string
  winnerName: string
  setNumber: number
  gameNumber: number
  server: "p1" | "p2"
  playerNames: { p1: string; p2: string }
}

function PointPopup({ 
  score, 
  serveType, 
  pointOutcome, 
  winnerName, 
  setNumber, 
  gameNumber, 
  server,
  playerNames 
}: PointPopupProps) {
  const serverName = server === "p1" ? playerNames.p1 : playerNames.p2
  
  const getPointOutcomeText = () => {
    switch (pointOutcome) {
      case "ace": return "Ace"
      case "winner": return "Winner"
      case "unforced_error": return "Unforced Error"
      case "forced_error": return "Forced Error"
      case "double_fault": return "Double Fault"
      default: return pointOutcome
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-md">
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">{score}</div>
        <p className="text-sm text-muted-foreground">
          Set {setNumber}, Game {gameNumber}
        </p>
      </div>
      
      <div className="space-y-2 text-center">
        <div className="text-lg font-semibold text-blue-500">
          {serveType === "first" ? "1st" : "2nd"} Serve
        </div>
        
        <div className="text-lg font-semibold text-green-500">
          {getPointOutcomeText()}
        </div>
        
        <div className="text-lg font-semibold text-orange-500">
          {winnerName}
        </div>
        
        <div className="text-base text-muted-foreground">
          {serverName} serving
        </div>
      </div>
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const [score, setScore] = useState(match.scoreParsed)
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [currentServer, setCurrentServer] = useState<"p1" | "p2" | null>(null)
  const [showServeSelection, setShowServeSelection] = useState(true)
  const [serveType, setServeType] = useState<ServeType>("first")
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState("statistics")
  
  // New state for point outcome selection
  const [pendingPoint, setPendingPoint] = useState<{
    player: number
    context: PointContext
  } | null>(null)
  const [showPointOutcome, setShowPointOutcome] = useState(false)

  // Calculate live stats
  const matchStats = calculateMatchStats(pointLog)
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`
  }

  const getPointDisplay = (points: number) => {
    const pointMap = ["0", "15", "30", "40"]
    if (points < 4) return pointMap[points]
    return "40"
  }

  const handleServeSelected = (servingPlayer: "p1" | "p2") => {
    setCurrentServer(servingPlayer)
    setShowServeSelection(false)
  }

  const awardPoint = async (playerIndex: number) => {
    if (isUpdating || !currentServer) return

    setIsUpdating(true)

    // Generate point context
    const context = generatePointContext(
      pointLog.length + 1,
      score,
      playerIndex === 0 ? "p1" : "p2",
      playerNames
    )

    // Set pending point and show outcome selection
    setPendingPoint({
      player: playerIndex,
      context
    })
    setShowPointOutcome(true)
    setIsUpdating(false)
  }

  const savePointWithOutcome = async (pointOutcome: PointOutcome, shotType?: ShotType) => {
    if (!pendingPoint || !currentServer) return

    // Update score based on point
    const newScore = { ...score }
    const winner = pendingPoint.player === 0 ? "p1" : "p2"
    
    // Update points
    newScore.points[pendingPoint.player]++
    
    // Check for game win
    if (isGameWon(pendingPoint.player)) {
      newScore.games[pendingPoint.player]++
      newScore.points = [0, 0]
      
      // Switch server for next game
      setCurrentServer(currentServer === "p1" ? "p2" : "p1")
      
      // Check for set win
      if (isSetWon(pendingPoint.player)) {
        const newSet = { p1: newScore.games[0], p2: newScore.games[1] }
        newScore.sets.push(newSet)
        newScore.games = [0, 0]
      }
    }

    setScore(newScore)

    // Create detailed point log entry
    const pointDetail: PointDetail = {
      id: `point-${Date.now()}`,
      pointNumber: pointLog.length + 1,
      setNumber: newScore.sets.length + 1,
      gameNumber: newScore.games[0] + newScore.games[1] + 1,
      gameScore: `${getPointDisplay(score.points[0])}-${getPointDisplay(score.points[1])}`,
      winner,
      server: currentServer!,
      serveType,
      serveOutcome: pointOutcome,
      rallyLength: 1,
      pointOutcome,
      lastShotType: shotType,
      isBreakPoint: pendingPoint.context.isBreakPoint,
      isSetPoint: pendingPoint.context.isSetPoint,
      isMatchPoint: pendingPoint.context.isMatchPoint,
      isGameWinning: pendingPoint.context.gameWon || false,
      isSetWinning: pendingPoint.context.setWon || false,
      isMatchWinning: pendingPoint.context.matchWon || false,
      timestamp: new Date().toISOString()
    }
    
    const newPointLog = [...pointLog, pointDetail]
    setPointLog(newPointLog)
    
    // Save to server
    await saveScore(newScore, newPointLog, pendingPoint.context.matchWon || false, pendingPoint.player)
    
    // Reset states
    setServeType("first")
    setShowPointOutcome(false)
    setPendingPoint(null)
  }

  const saveScore = async (newScore: typeof score, newPointLog: PointDetail[], matchWon: boolean, winnerIndex?: number) => {
    try {
      const result = await updateMatchScore(match.$id, {
        score: newScore,
        pointLog: newPointLog,
        status: matchWon ? "Completed" : "In Progress",
        winnerId: matchWon && winnerIndex !== undefined ? 
          (winnerIndex === 0 ? match.playerOne.$id : match.playerTwo.$id) : undefined
      })
      
      if (!result.success) {
        toast.error("Failed to save score")
      }
    } catch {
      toast.error("Failed to save score")
    }
  }

  const undoLastPoint = () => {
    if (pointLog.length === 0) return
    
    const lastPoint = pointLog[pointLog.length - 1]
    const newPointLog = pointLog.slice(0, -1)
    
    // Reconstruct score from remaining points
    // This is a simplified version - in production you'd want more robust score reconstruction
    setPointLog(newPointLog)
    toast.success("Last point undone")
  }

  const shareMatch = () => {
    const url = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(url)
    toast.success("Match link copied to clipboard!")
  }

  const isGameWon = (playerIndex: number) => {
    const playerPoints = score.points[playerIndex]
    const opponentPoints = score.points[playerIndex === 0 ? 1 : 0]
    return playerPoints >= 4 && playerPoints >= opponentPoints + 2
  }

  const isSetWon = (playerIndex: number) => {
    const playerGames = score.games[playerIndex]
    const opponentGames = score.games[playerIndex === 0 ? 1 : 0]
    return playerGames >= 6 && playerGames >= opponentGames + 2
  }

  // Point-by-Point component similar to the finished match
  const PointByPointTab = () => {
    const matchScore = reconstructMatchScore(pointLog.map(p => ({
      winner: p.winner,
      setNumber: p.setNumber,
      gameNumber: p.gameNumber
    })))

    const setGroups = pointLog.reduce((sets, point) => {
      const setKey = point.setNumber
      if (!sets[setKey]) {
        sets[setKey] = {}
      }
      
      const gameKey = point.gameNumber
      if (!sets[setKey][gameKey]) {
        sets[setKey][gameKey] = []
      }
      
      sets[setKey][gameKey].push(point)
      return sets
    }, {} as Record<number, Record<number, PointDetail[]>>)

    const [selectedSet, setSelectedSet] = useState(1)
    const availableSets = Object.keys(setGroups).map(Number).sort()

    if (pointLog.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No points logged yet. Start scoring to see the point-by-point breakdown.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Set switcher */}
        {availableSets.length > 1 && (
          <div className="flex justify-center">
            <div className="flex bg-muted rounded-lg p-1">
              {availableSets.map((setNum) => (
                <Button
                  key={setNum}
                  variant={selectedSet === setNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSet(setNum)}
                  className="text-xs"
                >
                  {setNum}. SET
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Games for selected set */}
        {setGroups[selectedSet] && (
          <div className="space-y-3">
            {Object.entries(setGroups[selectedSet]).map(([gameNum, gamePoints]) => {
              const gameNumber = Number(gameNum)
              const server = getServer(gameNumber)
              
              const scoreProgression = reconstructGameProgression(gamePoints, match.matchFormatParsed.noAd)
              const lastPoint = gamePoints[gamePoints.length - 1]
              const gameWinner = lastPoint.winner
              
              const thisSetGames = Object.entries(setGroups[selectedSet])
                .filter(([gNum]) => Number(gNum) <= gameNumber)
                .reduce((acc, [, gPoints]) => {
                  const gWinner = gPoints[gPoints.length - 1].winner
                  if (gWinner === "p1") acc.p1++
                  else acc.p2++
                  return acc
                }, { p1: 0, p2: 0 })

              const gameScore = `${thisSetGames.p1}-${thisSetGames.p2}`
              
              return (
                <motion.div 
                  key={`${selectedSet}-${gameNumber}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gameNumber * 0.05 }}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      SET {selectedSet} • GAME {gameNumber}
                      <span className="ml-2">
                        🎾 {server === "p1" ? playerNames.p1 : playerNames.p2} serving
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                      {scoreProgression.slice(1, -1).map((score, index) => {
                        const point = gamePoints[index]
                        if (!point) return null
                        
                        return (
                          <Dialog key={`${gameNumber}-${index}`}>
                            <DialogTrigger asChild>
                              <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className="px-2 py-1 text-xs border border-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {score}
                              </motion.button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <PointPopup
                                score={score}
                                serveType={point.serveType || "first"}
                                pointOutcome={point.pointOutcome || "other"}
                                winnerName={point.winner === "p1" ? playerNames.p1 : playerNames.p2}
                                setNumber={point.setNumber}
                                gameNumber={point.gameNumber}
                                server={point.server}
                                playerNames={playerNames}
                              />
                            </DialogContent>
                          </Dialog>
                        )
                      })}
                    </div>
                    
                    <div className="text-lg font-bold">{gameScore}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Statistics component similar to the finished match
  const StatisticsTab = () => (
    <div className="max-w-md mx-auto">
      <div className="space-y-0.5">
        <StatRow
          label="Aces"
          player1Value={matchStats.player1.aces}
          player2Value={matchStats.player2.aces}
          delay={0}
        />
        
        <StatRow
          label="Double Faults"
          player1Value={matchStats.player1.doubleFaults}
          player2Value={matchStats.player2.doubleFaults}
          delay={1}
        />
        
        <StatRow
          label="1st Serve Percentage"
          player1Value={Math.round(matchStats.player1.firstServePercentage)}
          player2Value={Math.round(matchStats.player2.firstServePercentage)}
          isPercentage={true}
          delay={2}
        />
        
        <StatRow
          label="1st Serve Points Won"
          player1Value={Math.round(matchStats.player1.firstServeWinPercentage)}
          player2Value={Math.round(matchStats.player2.firstServeWinPercentage)}
          isPercentage={true}
          player1Detail={`${Math.round(matchStats.player1.firstServePointsWon)}/${Math.round(matchStats.player1.firstServePointsPlayed)}`}
          player2Detail={`${Math.round(matchStats.player2.firstServePointsWon)}/${Math.round(matchStats.player2.firstServePointsPlayed)}`}
          delay={3}
        />
        
        <StatRow
          label="2nd Serve Points Won"
          player1Value={Math.round(matchStats.player1.secondServeWinPercentage)}
          player2Value={Math.round(matchStats.player2.secondServeWinPercentage)}
          isPercentage={true}
          player1Detail={`${Math.round(matchStats.player1.secondServePointsWon)}/${Math.round(matchStats.player1.secondServePointsPlayed)}`}
          player2Detail={`${Math.round(matchStats.player2.secondServePointsWon)}/${Math.round(matchStats.player2.secondServePointsPlayed)}`}
          delay={4}
        />
        
        <StatRow
          label="Winners"
          player1Value={matchStats.player1.winners}
          player2Value={matchStats.player2.winners}
          delay={5}
        />

        <StatRow
          label="Unforced Errors"
          player1Value={matchStats.player1.unforcedErrors}
          player2Value={matchStats.player2.unforcedErrors}
          delay={6}
        />

        <StatRow
          label="Net Points Won"
          player1Value={Math.round(matchStats.player1.pointWinPercentage)}
          player2Value={Math.round(matchStats.player2.pointWinPercentage)}
          isPercentage={true}
          player1Detail={`${matchStats.player1.totalPointsWon}/${matchStats.player1.totalPointsWon + matchStats.player2.totalPointsWon}`}
          player2Detail={`${matchStats.player2.totalPointsWon}/${matchStats.player1.totalPointsWon + matchStats.player2.totalPointsWon}`}
          delay={7}
        />
      </div>
    </div>
  )

  // Show serve selection if not set yet
  if (showServeSelection || !currentServer) {
    return (
      <ServeSelection
        playerOne={match.playerOne}
        playerTwo={match.playerTwo}
        onServeSelected={handleServeSelected}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={shareMatch}>
            <Share2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={undoLastPoint} 
            disabled={pointLog.length === 0}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Compact Scoreboard */}
      <div className="bg-card border-b p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Player</div>
            <div className="font-medium text-sm truncate flex items-center justify-center gap-1">
              {currentServer === "p1" && "🎾"} {playerNames.p1}
            </div>
            <div className="font-medium text-sm truncate flex items-center justify-center gap-1">
              {currentServer === "p2" && "🎾"} {playerNames.p2}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Games</div>
            <div className="text-lg font-mono">{score.games[0]}</div>
            <div className="text-lg font-mono">{score.games[1]}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Points</div>
            <Button
              variant="ghost"
              size="sm"
              className="text-lg font-mono h-auto p-1"
              onClick={() => awardPoint(0)}
              disabled={isUpdating || match.status === "Completed"}
            >
              {getPointDisplay(score.points[0])}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-lg font-mono h-auto p-1"
              onClick={() => awardPoint(1)}
              disabled={isUpdating || match.status === "Completed"}
            >
              {getPointDisplay(score.points[1])}
            </Button>
          </div>
        </div>
      </div>

      {/* Serve Type Selection */}
      <div className="p-3 border-b bg-muted/10">
        <div className="flex items-center justify-center gap-4">
          <Label className="text-sm font-medium">Serve Type:</Label>
          <div className="flex gap-2">
            <Button
              variant={serveType === "first" ? "default" : "outline"}
              size="sm"
              onClick={() => setServeType("first")}
              className={serveType === "first" ? "bg-primary text-primary-foreground" : ""}
            >
              {serveType === "first" && "✓ "}1st Serve
            </Button>
            <Button
              variant={serveType === "second" ? "default" : "outline"}
              size="sm"
              onClick={() => setServeType("second")}
              className={serveType === "second" ? "bg-primary text-primary-foreground" : ""}
            >
              {serveType === "second" && "✓ "}2nd Serve
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Statistics and Point-by-Point */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-2 mx-3 mt-3">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="point-by-point">Point by Point</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statistics" className="flex-1 overflow-y-auto p-4">
            <StatisticsTab />
          </TabsContent>
          
          <TabsContent value="point-by-point" className="flex-1 overflow-y-auto p-4">
            <PointByPointTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Point Outcome Selection Modal */}
      <AnimatePresence>
        {showPointOutcome && pendingPoint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-lg p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-semibold text-center mb-4">
                Point won by {pendingPoint.player === 0 ? playerNames.p1 : playerNames.p2}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => savePointWithOutcome("ace")}
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <Target className="h-4 w-4 mb-1" />
                  Ace
                </Button>
                
                <Button
                  onClick={() => savePointWithOutcome("double_fault")}
                  variant="destructive"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <AlertTriangle className="h-4 w-4 mb-1" />
                  Double Fault
                </Button>
                
                <Button
                  onClick={() => savePointWithOutcome("winner")}
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <Zap className="h-4 w-4 mb-1" />
                  Winner
                </Button>
                
                <Button
                  onClick={() => savePointWithOutcome("unforced_error")}
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  Unforced Error
                </Button>
                
                <Button
                  onClick={() => savePointWithOutcome("forced_error")}
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  Forced Error
                </Button>
                
                                 <Button
                   onClick={() => savePointWithOutcome("forced_error")}
                   variant="outline"
                   className="h-12 flex flex-col items-center justify-center"
                 >
                   Other
                 </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setShowPointOutcome(false)
                  setPendingPoint(null)
                }}
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 