"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  RotateCcw,
  Undo,
  Trophy
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { Player, PointDetail, Score } from "@/lib/types"

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
  }
}

interface TennisScore {
  sets: number[][]
  games: number[]
  points: number[]
  server: 'p1' | 'p2'
  gameNumber: number
  setNumber: number
}

interface MatchStats {
  player1: {
    totalPoints?: number
    servicePoints?: number
    receivingPoints?: number
    aces: number
    doubleFaults: number
    winners: number
    unforcedErrors: number
    breakPointsWon: number
    totalBreakPoints: number
  }
  player2: {
    totalPoints?: number
    servicePoints?: number
    receivingPoints?: number
    aces: number
    doubleFaults: number
    winners: number
    unforcedErrors: number
    breakPointsWon: number
    totalBreakPoints: number
  }
  isBasicMode?: boolean
}

// Stats Card Component
function StatsCard({ title, player1Value, player2Value }: {
  title: string
  player1Value: number | string
  player2Value: number | string
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <div className="text-center flex-1">
        <div className="text-lg font-semibold">{player1Value}</div>
      </div>
      <div className="text-center flex-1">
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
      <div className="text-center flex-1">
        <div className="text-lg font-semibold">{player2Value}</div>
      </div>
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  
  // Local state for UI
  const [showServeSwapConfirm, setShowServeSwapConfirm] = useState(false)
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
        server: 'p1',
        gameNumber: 1,
        setNumber: 1
      }
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

  const calculateMatchStats = (points: PointDetail[]): MatchStats => {
    const hasDetailedOutcomes = points.some(p => 
      p.pointOutcome && !['winner', 'unforced_error'].includes(p.pointOutcome)
    )
    
    if (!hasDetailedOutcomes && points.length > 0) {
      const player1Stats = {
        totalPoints: points.filter(p => p.winner === 'p1').length,
        servicePoints: points.filter(p => p.winner === 'p1' && p.server === 'p1').length,
        receivingPoints: points.filter(p => p.winner === 'p1' && p.server === 'p2').length,
        aces: 0,
        doubleFaults: 0,
        winners: points.filter(p => p.winner === 'p1').length,
        unforcedErrors: 0,
        breakPointsWon: points.filter(p => p.winner === 'p1' && p.isBreakPoint).length,
        totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p2').length
      }
      
      const player2Stats = {
        totalPoints: points.filter(p => p.winner === 'p2').length,
        servicePoints: points.filter(p => p.winner === 'p2' && p.server === 'p2').length,
        receivingPoints: points.filter(p => p.winner === 'p2' && p.server === 'p1').length,
        aces: 0,
        doubleFaults: 0,
        winners: points.filter(p => p.winner === 'p2').length,
        unforcedErrors: 0,
        breakPointsWon: points.filter(p => p.winner === 'p2' && p.isBreakPoint).length,
        totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p1').length
      }
      
      return {
        player1: player1Stats,
        player2: player2Stats,
        isBasicMode: true
      }
    }

    // Detailed mode fallback
    const player1Stats = {
      aces: points.filter(p => p.winner === 'p1' && p.pointOutcome === 'ace').length,
      doubleFaults: points.filter(p => p.server === 'p1' && p.pointOutcome === 'double_fault').length,
      winners: points.filter(p => p.winner === 'p1' && p.pointOutcome === 'winner').length,
      unforcedErrors: points.filter(p => p.winner === 'p2' && p.pointOutcome === 'unforced_error').length,
      breakPointsWon: points.filter(p => p.winner === 'p1' && p.isBreakPoint).length,
      totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p2').length
    }
    
    const player2Stats = {
      aces: points.filter(p => p.winner === 'p2' && p.pointOutcome === 'ace').length,
      doubleFaults: points.filter(p => p.server === 'p2' && p.pointOutcome === 'double_fault').length,
      winners: points.filter(p => p.winner === 'p2' && p.pointOutcome === 'winner').length,
      unforcedErrors: points.filter(p => p.winner === 'p1' && p.pointOutcome === 'unforced_error').length,
      breakPointsWon: points.filter(p => p.winner === 'p2' && p.isBreakPoint).length,
      totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p1').length
    }
    
    return {
      player1: player1Stats,
      player2: player2Stats,
      isBasicMode: false
    }
  }

  const getGameScore = () => {
    const p1Points = score.points[0]
    const p2Points = score.points[1]
    
    // Handle deuce situation
    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) return "DEUCE"
      if (p1Points > p2Points) return `AD-${match.playerOne.firstName.toUpperCase()}`
      return `AD-${match.playerTwo.firstName.toUpperCase()}`
    }
    
    const pointMap = ["0", "15", "30", "40"]
    const p1Display = pointMap[Math.min(p1Points, 3)]
    const p2Display = pointMap[Math.min(p2Points, 3)]
    
    return `${p1Display} - ${p2Display}`
  }

  const handlePointWin = async (winner: 'p1' | 'p2') => {
         const newPointDetail: PointDetail = {
       id: `${Date.now()}-${Math.random()}`,
       pointNumber: pointLog.length + 1,
       setNumber: score.setNumber,
       gameNumber: score.gameNumber,
       server: score.server,
       winner,
       gameScore: getGameScore(),
       pointOutcome: 'winner',
       serveType: 'first',
       serveOutcome: 'winner',
       rallyLength: 1,
       isBreakPoint: false,
       isSetPoint: false,
       isMatchPoint: false,
       isGameWinning: false,
       isSetWinning: false,
       isMatchWinning: false,
       timestamp: new Date().toISOString()
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

  const matchStats = calculateMatchStats(pointLog)

  const renderStatsCard = () => (
    <motion.div
      key="stats"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-1"
    >
      {matchStats.isBasicMode ? (
        <>
          <StatsCard title="Total Points" player1Value={matchStats.player1.totalPoints || 0} player2Value={matchStats.player2.totalPoints || 0} />
          <StatsCard title="Service Points Won" player1Value={matchStats.player1.servicePoints || 0} player2Value={matchStats.player2.servicePoints || 0} />
          <StatsCard title="Receiving Points Won" player1Value={matchStats.player1.receivingPoints || 0} player2Value={matchStats.player2.receivingPoints || 0} />
          {(matchStats.player1.breakPointsWon > 0 || matchStats.player2.breakPointsWon > 0) && (
            <StatsCard title="Break Points Won" player1Value={`${matchStats.player1.breakPointsWon}/${matchStats.player1.totalBreakPoints}`} player2Value={`${matchStats.player2.breakPointsWon}/${matchStats.player2.totalBreakPoints}`} />
          )}
        </>
      ) : (
        <>
          <StatsCard title="Aces" player1Value={matchStats.player1.aces} player2Value={matchStats.player2.aces} />
          <StatsCard title="Double Faults" player1Value={matchStats.player1.doubleFaults} player2Value={matchStats.player2.doubleFaults} />
          <StatsCard title="Winners" player1Value={matchStats.player1.winners} player2Value={matchStats.player2.winners} />
          <StatsCard title="Unforced Errors" player1Value={matchStats.player1.unforcedErrors} player2Value={matchStats.player2.unforcedErrors} />
          <StatsCard title="Break Points Won" player1Value={`${matchStats.player1.breakPointsWon}/${matchStats.player1.totalBreakPoints}`} player2Value={`${matchStats.player2.breakPointsWon}/${matchStats.player2.totalBreakPoints}`} />
        </>
      )}
    </motion.div>
  )

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="flex flex-col h-screen">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 bg-slate-900/50 backdrop-blur-sm border-b border-slate-700">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500">
                Live
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 pb-32 md:pb-24">
            {/* Score Display - Prominent */}
            <div className="py-6">
              <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700">
                <CardContent className="p-0">
                  {/* Player Names */}
                  <div className="grid grid-cols-2 bg-slate-800/50">
                    <div className="p-4 text-center">
                      <div className="text-sm text-slate-400 mb-1">Player 1</div>
                      <div className="font-semibold text-white flex items-center justify-center gap-2">
                        {score.server === 'p1' && <div className="w-2 h-2 bg-primary rounded-full" />}
                        {match.playerOne.firstName}
                      </div>
                    </div>
                    <div className="p-4 text-center border-l border-slate-700">
                      <div className="text-sm text-slate-400 mb-1">Player 2</div>
                      <div className="font-semibold text-white flex items-center justify-center gap-2">
                        {score.server === 'p2' && <div className="w-2 h-2 bg-primary rounded-full" />}
                        {match.playerTwo.firstName}
                      </div>
                    </div>
                  </div>

                  {/* Set Scores */}
                  <div className="grid grid-cols-2 bg-slate-900">
                    <div className="p-6 text-center">
                      <div className="text-4xl font-bold font-mono text-primary">
                        {score.sets[0]?.[0] || 0}
                      </div>
                    </div>
                    <div className="p-6 text-center border-l border-slate-700">
                      <div className="text-4xl font-bold font-mono text-primary">
                        {score.sets[0]?.[1] || 0}
                      </div>
                    </div>
                  </div>

                  {/* Games */}
                  <div className="grid grid-cols-2 bg-slate-800">
                    <div className="p-4 text-center">
                      <div className="text-xs text-slate-400 mb-1">Games</div>
                      <div className="text-2xl font-mono text-white">{score.games[0]}</div>
                    </div>
                    <div className="p-4 text-center border-l border-slate-700">
                      <div className="text-xs text-slate-400 mb-1">Games</div>
                      <div className="text-2xl font-mono text-white">{score.games[1]}</div>
                    </div>
                  </div>

                  {/* Current Game */}
                  <div className="bg-slate-700/50 p-4 text-center">
                    <div className="text-sm text-slate-300 mb-2">Current Game</div>
                    <div className="text-xl font-mono text-primary font-semibold">
                      {getGameScore()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Swipeable Cards */}
            <Card className="bg-slate-900/80 backdrop-blur-sm border-slate-700 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Match Details</CardTitle>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                <AnimatePresence mode="wait">
                  {renderStatsCard()}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Action Bar - Fixed */}
        <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-4">
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handlePointWin('p1')
                if ('vibrate' in navigator) {
                  navigator.vibrate(50)
                }
              }}
              className="bg-gradient-to-r from-primary to-green-500 text-black font-semibold py-4 px-6 rounded-xl shadow-lg active:shadow-sm transition-all"
            >
              <div className="text-lg">Point {match.playerOne.firstName}</div>
              <div className="text-sm opacity-80">Tap to score</div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handlePointWin('p2')
                if ('vibrate' in navigator) {
                  navigator.vibrate(50)
                }
              }}
              className="bg-gradient-to-r from-primary to-green-500 text-black font-semibold py-4 px-6 rounded-xl shadow-lg active:shadow-sm transition-all"
            >
              <div className="text-lg">Point {match.playerTwo.firstName}</div>
              <div className="text-sm opacity-80">Tap to score</div>
            </motion.button>
          </div>
          
          {/* Action Buttons Row */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={pointLog.length === 0}
              className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowServeSwapConfirm(true)}
              disabled={isInGame}
              className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Switch Server
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEndMatch}
              className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Serve Swap Confirmation Dialog */}
      <Dialog open={showServeSwapConfirm} onOpenChange={setShowServeSwapConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Server?</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowServeSwapConfirm(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleServeSwap} className="flex-1">
              Switch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 