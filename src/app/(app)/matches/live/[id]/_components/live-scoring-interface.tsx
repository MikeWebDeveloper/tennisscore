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
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore, addMatchComment } from "@/lib/actions/matches"
import { Player, PointDetail, Score } from "@/lib/types"
import { ServeSelection } from "./serve-selection"

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
    aces: number
    doubleFaults: number
    winners: number
    unforcedErrors: number
    breakPointsWon: number
    totalBreakPoints: number
  }
  player2: {
    aces: number
    doubleFaults: number
    winners: number
    unforcedErrors: number
    breakPointsWon: number
    totalBreakPoints: number
  }
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
  onAddComment 
}: { 
  pointLog: PointDetail[]
  comments: Comment[]
  matchStats: MatchStats
  onAddComment: (comment: string) => Promise<void>
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
              <StatsCard title="Aces" player1Value={matchStats.player1.aces} player2Value={matchStats.player2.aces} />
              <StatsCard title="Double Faults" player1Value={matchStats.player1.doubleFaults} player2Value={matchStats.player2.doubleFaults} />
              <StatsCard title="Winners" player1Value={matchStats.player1.winners} player2Value={matchStats.player2.winners} />
              <StatsCard title="Unforced Errors" player1Value={matchStats.player1.unforcedErrors} player2Value={matchStats.player2.unforcedErrors} />
              <StatsCard title="Break Points Won" player1Value={`${matchStats.player1.breakPointsWon}/${matchStats.player1.totalBreakPoints}`} player2Value={`${matchStats.player2.breakPointsWon}/${matchStats.player2.totalBreakPoints}`} />
            </motion.div>
          )}
          
          {cards[currentCard] === 'points' && (
            <motion.div
              key="points"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2 max-h-48 overflow-y-auto"
            >
              {pointLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No points played yet</p>
              ) : (
                pointLog.map((point, index) => (
                  <div key={index} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                    <span>Point {index + 1}</span>
                    <span className="text-xs font-mono">{point.gameScore}</span>
                    <span>{point.winner === 'p1' ? 'Player 1' : 'Player 2'}</span>
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
  const [showServeSelection, setShowServeSelection] = useState(true)
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
    
    // Initialize score from match data
    const initialScore: TennisScore = {
      sets: match.scoreParsed.sets || [],
      games: match.scoreParsed.games || [0, 0],
      points: match.scoreParsed.points || [0, 0],
      server: 'p1',
      gameNumber: (match.scoreParsed.games?.[0] || 0) + (match.scoreParsed.games?.[1] || 0) + 1,
      setNumber: 1
    }
    setScore(initialScore)
    
    // If there are existing points, don't show serve selection
    if (existingPointLog.length > 0) {
      setShowServeSelection(false)
      // Determine current server from game number
      const totalGames = initialScore.games[0] + initialScore.games[1]
      initialScore.server = totalGames % 2 === 0 ? 'p1' : 'p2'
      setScore(initialScore)
    }
  }, [match])

  const handleServeSelected = (server: 'p1' | 'p2') => {
    setScore(prev => ({ ...prev, server }))
    setShowServeSelection(false)
  }

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
    
    return { player1: player1Stats, player2: player2Stats }
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
        rallyLength: 1,
        pointOutcome: 'winner', // This should be set based on how the point was won
        isBreakPoint: isCurrentBreakPoint,
        isSetPoint: false,
        isMatchPoint: false,
        isGameWinning: false,
        isSetWinning: false,
        isMatchWinning: false
      }

      // Calculate new score with proper tennis logic
      const newScore = { ...score }
      const winnerIndex = winner === 'player1' ? 0 : 1
      const loserIndex = 1 - winnerIndex
      
      newScore.points[winnerIndex]++
      
      // Check for game win
      let gameWon = false
      let setWon = false
      if (newScore.points[winnerIndex] >= 4) {
        if (newScore.points[winnerIndex] - newScore.points[loserIndex] >= 2) {
          // Game won
          gameWon = true
          newScore.games[winnerIndex]++
          newScore.points = [0, 0]
          newScore.gameNumber++
          pointDetail.isGameWinning = true
          
          // Check for set win (first to 6 games with 2 game lead, or 7-6)
          if (newScore.games[winnerIndex] >= 6) {
            if (newScore.games[winnerIndex] - newScore.games[loserIndex] >= 2 || 
                (newScore.games[winnerIndex] === 7 && newScore.games[loserIndex] === 6)) {
              setWon = true
              pointDetail.isSetWinning = true
              
              // Add set to sets array
              if (!newScore.sets) newScore.sets = []
              newScore.sets.push([newScore.games[0], newScore.games[1]])
              newScore.games = [0, 0]
              newScore.setNumber++
              newScore.gameNumber = 1
            }
          }
          
          // Change server for next game (unless set was won)
          if (!setWon) {
            newScore.server = newScore.server === 'p1' ? 'p2' : 'p1'
          }
          setIsInGame(false)
        }
      }
      
      // Add to point log
      const newPointLog = [...pointLog, pointDetail]
      setPointLog(newPointLog)
      setScore(newScore)

      // Update match in database
      const scoreForDb = {
        sets: newScore.sets,
        games: newScore.games,
        points: newScore.points
      }
      
      await updateMatchScore(match.$id, {
        score: scoreForDb,
        pointLog: newPointLog
      })

      // Reset to first serve for next point
      setCurrentServe('first')
      
      if (setWon) {
        toast.success(`Set to ${winner === 'player1' ? match.playerOne.firstName : match.playerTwo.firstName}! ${newScore.sets[newScore.sets.length - 1][0]}-${newScore.sets[newScore.sets.length - 1][1]}`)
        setIsInGame(false)
      } else if (gameWon) {
        toast.success(`Game to ${winner === 'player1' ? match.playerOne.firstName : match.playerTwo.firstName}! Score: ${newScore.games[0]}-${newScore.games[1]}`)
        setIsInGame(false)
      } else {
        toast.success(`Point to ${winner === 'player1' ? match.playerOne.firstName : match.playerTwo.firstName}`)
      }
    } catch (error) {
      console.error('Error awarding point:', error)
      toast.error('Failed to award point')
      setIsInGame(false)
    }
  }

  const undoLastPoint = async () => {
    if (pointLog.length === 0) return

    try {
      const newPointLog = pointLog.slice(0, -1)
      setPointLog(newPointLog)
      
      // Recalculate score from point log
      // This is a simplified implementation - in production you'd want to fully recalculate
      const recalculatedScore: TennisScore = {
        sets: [],
        games: [0, 0],
        points: [0, 0],
        server: score.server,
        gameNumber: 1,
        setNumber: 1
      }
      
      setScore(recalculatedScore)
      setIsInGame(false)

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-red-500 text-white">
            LIVE
          </Badge>
          <Button variant="ghost" size="sm" onClick={shareMatch}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Players and Score */}
      <div className="p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            {match.playerOne.firstName} {match.playerOne.lastName} vs {match.playerTwo.firstName} {match.playerTwo.lastName}
          </h1>
          <div className="text-sm text-muted-foreground">
            Monday, June 16, 2025
          </div>
        </div>

        {/* Main Score Display */}
        <div className="grid grid-cols-3 gap-6 items-center mb-8">
          {/* Player 1 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
                {match.playerOne.firstName[0]}
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-semibold text-lg">{match.playerOne.firstName} {match.playerOne.lastName}</div>
                  <div className="text-sm text-muted-foreground">{match.playerOne.rating || 'Unrated'}</div>
                </div>
                {score.server === 'p1' && <TennisBall onClick={() => setShowServeSwapConfirm(true)} />}
              </div>
            </div>
            <PointScore
              score={getPlayerPointScore(score.points[0], score.points[1])}
              isServing={score.server === 'p1'}
              onTap={() => awardPoint('player1')}
            />
          </div>

          {/* Center - Games/Sets Score */}
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">
              {score.games[0]} - {score.games[1]}
            </div>
            <div className="text-2xl mb-4 font-mono">
              {getPointDisplay(score.points[0], score.points[1])}
            </div>
            
            {/* Sets Display */}
            {score.sets && score.sets.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">Sets</div>
                <div className="flex justify-center gap-4">
                  {score.sets.map((set, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold">{set[0]}</span>-<span className="font-semibold">{set[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <ServeSwitcher currentServe={currentServe} onServeChange={setCurrentServe} />
          </div>

          {/* Player 2 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-semibold text-lg">
                {match.playerTwo.firstName[0]}
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-semibold text-lg">{match.playerTwo.firstName} {match.playerTwo.lastName}</div>
                  <div className="text-sm text-muted-foreground">{match.playerTwo.rating || 'Unrated'}</div>
                </div>
                {score.server === 'p2' && <TennisBall onClick={() => setShowServeSwapConfirm(true)} />}
              </div>
            </div>
            <PointScore
              score={getPlayerPointScore(score.points[1], score.points[0])}
              isServing={score.server === 'p2'}
              onTap={() => awardPoint('player2')}
            />
          </div>
        </div>

        {/* Undo Button */}
        <div className="flex justify-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={undoLastPoint}
            disabled={pointLog.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo Last Point
          </Button>
        </div>

        {/* Swipeable Cards */}
        <SwipeableCards pointLog={pointLog} comments={comments} matchStats={matchStats} onAddComment={handleAddComment} />
      </div>

      {/* Initial Serve Selection Dialog */}
      <Dialog open={showServeSelection} onOpenChange={setShowServeSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Who serves first?</DialogTitle>
          </DialogHeader>
          <ServeSelection
            playerOne={match.playerOne}
            playerTwo={match.playerTwo}
            onServeSelected={handleServeSelected}
          />
        </DialogContent>
      </Dialog>

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