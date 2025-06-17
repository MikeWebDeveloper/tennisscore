"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Share2, 
  ArrowLeft,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Undo,
  Trophy
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore, addMatchComment } from "@/lib/actions/matches"
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

interface Comment {
  text: string
  timestamp: string
  author?: string
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

// Green Tennis Ball Icon Component
function TennisBall({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <motion.svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
    >
      <circle cx="12" cy="12" r="10" fill="#39FF14" stroke="#2DD00A" strokeWidth="1"/>
      <path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12s-2 4.5-4.5 4.5S2 14.5 2 12z" fill="none" stroke="#2DD00A" strokeWidth="1.5"/>
      <path d="M22 12c0 2.5-2 4.5-4.5 4.5S13 14.5 13 12s2-4.5 4.5-4.5S22 9.5 22 12z" fill="none" stroke="#2DD00A" strokeWidth="1.5"/>
    </motion.svg>
  )
}

// Serve Switcher Component
function ServeSwitcher({ 
  currentServe, 
  onServeChange 
}: { 
  currentServe: 'first' | 'second'
  onServeChange: (serve: 'first' | 'second') => void 
}) {
  return (
    <div className="flex bg-muted rounded-lg p-1 w-fit mx-auto">
      <Button
        variant={currentServe === 'first' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onServeChange('first')}
        className="text-xs"
      >
        1st Serve
      </Button>
      <Button
        variant={currentServe === 'second' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onServeChange('second')}
        className="text-xs"
      >
        2nd Serve
      </Button>
    </div>
  )
}

// Point Score Display Component - Large tennis scores
function PointScore({ 
  score, 
  isServing, 
  onTap 
}: { 
  score: string
  isServing: boolean
  onTap: () => void 
}) {
  return (
    <motion.div
      className={`text-8xl font-bold cursor-pointer select-none p-6 rounded-xl transition-colors ${
        isServing ? 'bg-primary/10 border-2 border-primary/30' : 'hover:bg-muted/50'
      }`}
      onClick={onTap}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
    >
      {score}
    </motion.div>
  )
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

// Swipeable Cards Component
function SwipeableCards({ 
  pointLog, 
  comments,
  matchStats,
  onAddComment,
  match 
}: { 
  pointLog: PointDetail[]
  comments: Comment[]
  matchStats: MatchStats
  onAddComment: (comment: string) => Promise<void>
  match: {
    playerOne: Player
    playerTwo: Player
  }
}) {
  const [currentCard, setCurrentCard] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isAddingComment, setIsAddingComment] = useState(false)
  const cards = ['stats', 'points', 'commentary']
  
  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length)
  }
  
  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    setIsAddingComment(true)
    try {
      await onAddComment(newComment.trim())
      setNewComment("")
      toast.success("Comment added!")
    } catch {
      toast.error("Failed to add comment")
    }
    setIsAddingComment(false)
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Button variant="ghost" size="sm" onClick={prevCard}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-sm">
          {cards[currentCard] === 'stats' && 'Match Statistics'}
          {cards[currentCard] === 'points' && 'Point by Point'}
          {cards[currentCard] === 'commentary' && 'Commentary'}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={nextCard}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {cards[currentCard] === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-1"
            >
              {matchStats.isBasicMode ? (
                // Points-only mode - show simplified stats like flashscore
                <>
                  <StatsCard title="Total Points" player1Value={matchStats.player1.totalPoints || 0} player2Value={matchStats.player2.totalPoints || 0} />
                  <StatsCard title="Service Points Won" player1Value={matchStats.player1.servicePoints || 0} player2Value={matchStats.player2.servicePoints || 0} />
                  <StatsCard title="Receiving Points Won" player1Value={matchStats.player1.receivingPoints || 0} player2Value={matchStats.player2.receivingPoints || 0} />
                  {(matchStats.player1.breakPointsWon > 0 || matchStats.player2.breakPointsWon > 0) && (
                    <StatsCard title="Break Points Won" player1Value={`${matchStats.player1.breakPointsWon}/${matchStats.player1.totalBreakPoints}`} player2Value={`${matchStats.player2.breakPointsWon}/${matchStats.player2.totalBreakPoints}`} />
                  )}
                </>
              ) : (
                // Detailed mode - show traditional tennis stats
                <>
                  <StatsCard title="Total Points" player1Value={matchStats.player1.totalPoints || 0} player2Value={matchStats.player2.totalPoints || 0} />
                  <StatsCard title="Service Points Won" player1Value={matchStats.player1.servicePoints || 0} player2Value={matchStats.player2.servicePoints || 0} />
                  <StatsCard title="Receiving Points Won" player1Value={matchStats.player1.receivingPoints || 0} player2Value={matchStats.player2.receivingPoints || 0} />
                  <StatsCard title="Aces" player1Value={matchStats.player1.aces} player2Value={matchStats.player2.aces} />
                  <StatsCard title="Double Faults" player1Value={matchStats.player1.doubleFaults} player2Value={matchStats.player2.doubleFaults} />
                  <StatsCard title="Winners" player1Value={matchStats.player1.winners} player2Value={matchStats.player2.winners} />
                  <StatsCard title="Unforced Errors" player1Value={matchStats.player1.unforcedErrors} player2Value={matchStats.player2.unforcedErrors} />
                  <StatsCard title="Break Points Won" player1Value={`${matchStats.player1.breakPointsWon}/${matchStats.player1.totalBreakPoints}`} player2Value={`${matchStats.player2.breakPointsWon}/${matchStats.player2.totalBreakPoints}`} />
                </>
              )}
            </motion.div>
          )}
          
          {cards[currentCard] === 'points' && (
            <motion.div
              key="points"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-1 max-h-48 overflow-y-auto"
            >
              {pointLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No points played yet</p>
              ) : (
                pointLog.slice(-10).reverse().map((point, index) => (
                  <div key={point.id || index} className={`grid grid-cols-5 gap-2 p-2 text-xs rounded hover:bg-muted/30 ${
                    point.isBreakPoint ? 'bg-orange-50 border border-orange-200' : ''
                  }`}>
                    {/* Point number */}
                    <div className="text-center text-xs text-muted-foreground font-mono">
                      #{point.pointNumber}
                    </div>
                    
                    {/* Score before point */}
                    <div className="text-center font-mono text-xs font-medium">
                      {point.gameScore}
                    </div>
                    
                    {/* Server */}
                    <div className="text-center text-xs text-muted-foreground">
                      {point.server === 'p1' ? match.playerOne.firstName.charAt(0) : match.playerTwo.firstName.charAt(0)}
                    </div>
                    
                    {/* Winner */}
                    <div className="text-center text-xs font-medium">
                      {point.winner === 'p1' ? match.playerOne.firstName.charAt(0) : match.playerTwo.firstName.charAt(0)}
                    </div>
                    
                    {/* Outcome + special points */}
                    <div className="text-right text-xs">
                      <div className="flex items-center justify-end gap-1">
                        {point.pointOutcome && (
                          <span className="text-muted-foreground">
                            {point.pointOutcome === 'ace' ? 'Ace' :
                             point.pointOutcome === 'winner' ? 'W' :
                             point.pointOutcome === 'unforced_error' ? 'UE' :
                             point.pointOutcome === 'double_fault' ? 'DF' : 
                             point.pointOutcome}
                          </span>
                        )}
                        {point.isBreakPoint && (
                          <Badge variant="outline" className="text-xs px-1 py-0 bg-orange-100">BP</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
          
          {cards[currentCard] === 'commentary' && (
            <motion.div
              key="commentary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Live Commentary</span>
                </div>
              </div>
              
              {/* Add Comment Section */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Comments List */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No comments yet</p>
                ) : (
                  comments.map((comment, index) => (
                    <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="font-medium">{comment.text}</div>
                      {comment.timestamp && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  
  // Local state for UI
  const [showServeSwapConfirm, setShowServeSwapConfirm] = useState(false)
  const [currentServe, setCurrentServe] = useState<'first' | 'second'>('first')
  const [score, setScore] = useState<TennisScore>({
    sets: [],
    games: [0, 0],
    points: [0, 0],
    server: 'p1',
    gameNumber: 1,
    setNumber: 1
  })
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isInGame, setIsInGame] = useState(false)
  
  // Helper function to recalculate score from point log
  const recalculateScoreFromPointLog = (points: PointDetail[]): TennisScore => {
    const newScore: TennisScore = {
      sets: [],
      games: [0, 0],
      points: [0, 0],
      server: 'p1', // Will be determined from point log or default to p1
      gameNumber: 1,
      setNumber: 1
    }

    if (points.length === 0) {
      return newScore
    }

    // Replay all points to rebuild score
    for (const point of points) {
      const winnerIndex = point.winner === 'p1' ? 0 : 1
      newScore.points[winnerIndex]++

      // Check for game completion
      if (newScore.points[winnerIndex] >= 4 && 
          newScore.points[winnerIndex] - newScore.points[1 - winnerIndex] >= 2) {
        
        // Game won - update games
        newScore.games[winnerIndex]++
        newScore.points = [0, 0]
        newScore.gameNumber++

        // Check for set completion (first to 6 with 2-game lead, or 7-6)
        if (newScore.games[winnerIndex] >= 6) {
          if (newScore.games[winnerIndex] - newScore.games[1 - winnerIndex] >= 2 || 
              (newScore.games[winnerIndex] === 7 && newScore.games[1 - winnerIndex] === 6)) {
            
            // Set won - add to sets array and reset games
            newScore.sets.push([newScore.games[0], newScore.games[1]])
            newScore.games = [0, 0]
            newScore.setNumber++
            newScore.gameNumber = 1
          }
        }
        
        // Server changes after each game
        newScore.server = newScore.server === 'p1' ? 'p2' : 'p1'
      }
    }

    // Determine current server based on game number if no points yet in current game
    if (newScore.points[0] === 0 && newScore.points[1] === 0) {
      const totalGames = newScore.games[0] + newScore.games[1]
      newScore.server = totalGames % 2 === 0 ? 'p1' : 'p2'
    } else {
      // Use server from the last point in current game
      const lastPointInGame = points.findLast(p => 
        p.setNumber === newScore.setNumber && p.gameNumber === newScore.gameNumber
      )
      if (lastPointInGame) {
        newScore.server = lastPointInGame.server
      }
    }

    return newScore
  }
  
  // Initialize match data
  useEffect(() => {
    // Parse existing point log if available
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
    
    // Recalculate score from point log or initialize
    let initialScore: TennisScore
    if (existingPointLog.length > 0) {
      initialScore = recalculateScoreFromPointLog(existingPointLog)
      setIsInGame(true) // Match is already in progress
    } else {
      // New match - default to player 1 serving first
      initialScore = {
        sets: [],
        games: [0, 0],
        points: [0, 0],
        server: 'p1', // Default to Player 1 serving first
        gameNumber: 1,
        setNumber: 1
      }
      setIsInGame(false)
    }
    
    setScore(initialScore)
  }, [match.$id]) // Only re-run when match ID changes, not on every match update



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

  const calculateMatchStats = (points: PointDetail[]) => {
    // Determine if this is a points-only match based on the data available
    const hasDetailedOutcomes = points.some(p => 
      p.pointOutcome && !['winner', 'unforced_error'].includes(p.pointOutcome)
    )
    
    if (!hasDetailedOutcomes && points.length > 0) {
      // Points-only mode - show basic stats like flashscore
      const player1Stats = {
        totalPoints: points.filter(p => p.winner === 'p1').length,
        servicePoints: points.filter(p => p.winner === 'p1' && p.server === 'p1').length,
        receivingPoints: points.filter(p => p.winner === 'p1' && p.server === 'p2').length,
        // Keep minimal stats for compatibility
        aces: 0,
        doubleFaults: 0,
        winners: 0,
        unforcedErrors: 0,
        breakPointsWon: points.filter(p => p.winner === 'p1' && p.isBreakPoint).length,
        totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p2').length
      }
      
      const player2Stats = {
        totalPoints: points.filter(p => p.winner === 'p2').length,
        servicePoints: points.filter(p => p.winner === 'p2' && p.server === 'p2').length,
        receivingPoints: points.filter(p => p.winner === 'p2' && p.server === 'p1').length,
        // Keep minimal stats for compatibility
        aces: 0,
        doubleFaults: 0,
        winners: 0,
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
    
    // Detailed mode - show traditional tennis stats
    const player1Stats = {
      totalPoints: points.filter(p => p.winner === 'p1').length,
      servicePoints: points.filter(p => p.winner === 'p1' && p.server === 'p1').length,
      receivingPoints: points.filter(p => p.winner === 'p1' && p.server === 'p2').length,
      aces: points.filter(p => p.winner === 'p1' && p.pointOutcome === 'ace').length,
      doubleFaults: points.filter(p => p.server === 'p1' && p.pointOutcome === 'double_fault').length,
      winners: points.filter(p => p.winner === 'p1' && p.pointOutcome === 'winner').length,
      unforcedErrors: points.filter(p => p.winner === 'p2' && p.pointOutcome === 'unforced_error').length,
      breakPointsWon: points.filter(p => p.winner === 'p1' && p.isBreakPoint).length,
      totalBreakPoints: points.filter(p => p.isBreakPoint && p.server === 'p2').length
    }
    
    const player2Stats = {
      totalPoints: points.filter(p => p.winner === 'p2').length,
      servicePoints: points.filter(p => p.winner === 'p2' && p.server === 'p2').length,
      receivingPoints: points.filter(p => p.winner === 'p2' && p.server === 'p1').length,
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

  // Convert numeric points to tennis score display
  const getPointDisplay = (p1Points: number, p2Points: number) => {
    // Handle deuce and advantage
    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) return "DEUCE"
      if (p1Points > p2Points) return "ADV - 40"
      return "40 - ADV"
    }
    
    // Regular scoring
    const scoreMap = ["0", "15", "30", "40"]
    const p1Score = p1Points < 4 ? scoreMap[p1Points] : "40"
    const p2Score = p2Points < 4 ? scoreMap[p2Points] : "40"
    
    return `${p1Score} - ${p2Score}`
  }

  // Convert individual player points to tennis score
  const getPlayerPointScore = (points: number, opponentPoints: number) => {
    if (points >= 3 && opponentPoints >= 3) {
      if (points === opponentPoints) return "40"
      if (points > opponentPoints) return "ADV"
      return "40"
    }
    
    const scoreMap = ["0", "15", "30", "40"]
    return points < 4 ? scoreMap[points] : "40"
  }

  // Check if current situation is a break point
  const isBreakPoint = (serverPoints: number, receiverPoints: number) => {
    // Break point occurs when the receiver is one point away from winning the game
    if (serverPoints >= 3 && receiverPoints >= 3) {
      // In deuce situation, receiver having advantage is break point
      return receiverPoints > serverPoints
    }
    // Receiver at 40 and server not at 40, or receiver at 30 and server at 40
    return receiverPoints >= 3 && receiverPoints > serverPoints
  }

  const awardPoint = async (winner: 'player1' | 'player2') => {
    const winnerP = winner === 'player1' ? 'p1' : 'p2'
    setIsInGame(true)
    
    try {
      // Calculate if this is a break point before awarding
      const isCurrentBreakPoint = score.server !== winnerP && 
        isBreakPoint(
          score.server === 'p1' ? score.points[0] : score.points[1],
          score.server === 'p1' ? score.points[1] : score.points[0]
        )

      // Create point detail
      const pointDetail: PointDetail = {
        id: `point-${Date.now()}`,
        timestamp: new Date().toISOString(),
        pointNumber: pointLog.length + 1,
        setNumber: score.setNumber,
        gameNumber: score.gameNumber,
        gameScore: getPointDisplay(score.points[0], score.points[1]),
        winner: winnerP,
        server: score.server,
        serveType: currentServe,
        serveOutcome: 'winner',
        rallyLength: Math.floor(Math.random() * 10) + 1, // Random for now
        pointOutcome: 'winner', // This should be set based on how the point was won
        isBreakPoint: isCurrentBreakPoint,
        isSetPoint: false,
        isMatchPoint: false,
        isGameWinning: false,
        isSetWinning: false,
        isMatchWinning: false
      }

      // Add point to log first
      const newPointLog = [...pointLog, pointDetail]
      setPointLog(newPointLog)

      // Recalculate score from the complete point log
      const newScore = recalculateScoreFromPointLog(newPointLog)
      setScore(newScore)

      // Update point detail with correct flags after calculation
      if (newScore.games[winner === 'player1' ? 0 : 1] > score.games[winner === 'player1' ? 0 : 1]) {
        pointDetail.isGameWinning = true
      }
      if (newScore.sets.length > score.sets.length) {
        pointDetail.isSetWinning = true
      }

             // Save to database
       await updateMatchScore(match.$id, {
         score: {
           sets: newScore.sets,
           games: newScore.games,
           points: newScore.points
         },
         pointLog: newPointLog
       })

      // Reset serve type for next point
      setCurrentServe('first')
      setIsInGame(false)

      toast.success(`Point awarded to ${winner === 'player1' ? match.playerOne.firstName : match.playerTwo.firstName}`)
    } catch (error) {
      console.error('Error awarding point:', error)
      toast.error('Failed to award point')
      setIsInGame(false)
    }
  }

  const undoLastPoint = async () => {
    if (pointLog.length === 0) {
      toast.error("No points to undo")
      return
    }

    try {
      // Remove last point from log
      const newPointLog = pointLog.slice(0, -1)
      setPointLog(newPointLog)
      
      // Recalculate score from remaining points
      const recalculatedScore = recalculateScoreFromPointLog(newPointLog)
      setScore(recalculatedScore)
      setIsInGame(false)

             // Save to database
       await updateMatchScore(match.$id, {
         score: {
           sets: recalculatedScore.sets,
           games: recalculatedScore.games,
           points: recalculatedScore.points
         },
         pointLog: newPointLog
       })

      toast.success("Point undone")
    } catch (error) {
      console.error('Error undoing point:', error)
      toast.error('Failed to undo point')
    }
  }

  const shareMatch = () => {
    const liveUrl = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(liveUrl).then(() => {
      toast.success("Live match link copied to clipboard!")
    }).catch(() => {
      toast.error("Failed to copy link")
    })
  }

  const handleAddComment = async (comment: string) => {
    try {
      const result = await addMatchComment(match.$id, comment)
      if (result.error) {
        throw new Error(result.error)
      }
      // Add comment to local state
      setComments(prev => [...prev, {
        text: comment,
        timestamp: new Date().toISOString(),
        author: 'You'
      }])
    } catch (error) {
      throw error
    }
  }

  const matchStats = calculateMatchStats(pointLog)

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
              <Badge variant={isConnected ? "default" : "secondary"} className="bg-green-500/20 text-green-400 border-green-500">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 pb-24">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-white">Match Details</CardTitle>
                  <div className="flex gap-1">
                    {cards.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentCard ? 'bg-primary' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {['Stats', 'Points', 'Timeline'].map((tab, index) => (
                    <button
                      key={tab}
                      onClick={() => setCurrentCard(index)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        index === currentCard 
                          ? 'bg-primary text-black font-medium' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                <AnimatePresence mode="wait">
                  {cards[currentCard] === 'stats' && renderStatsCard()}
                  {cards[currentCard] === 'points' && renderPointsCard()}
                  {cards[currentCard] === 'timeline' && renderTimelineCard()}
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
                // Haptic feedback for iOS Safari
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
            <DialogTitle>Change Server?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to change the server?
              {isInGame && <span className="text-red-500 block mt-2">Warning: Cannot change server in the middle of a game!</span>}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleServeSwap} disabled={isInGame} className="flex-1">
                Yes, Change Server
              </Button>
              <Button variant="outline" onClick={() => setShowServeSwapConfirm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 