"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Share2, Trophy, Clock, TrendingUp, Target } from "lucide-react"
import { Player, MatchFormat, Score, PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { toast } from "sonner"
import { useRealtimeMatch } from "@/hooks/use-realtime-match"

interface PublicLiveMatchProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    scoreParsed: Score
    matchFormatParsed: MatchFormat
    status: "In Progress" | "Completed"
    pointLog?: string[]
    winnerId?: string
    matchDate: string
  }
}

// Point-by-point component
function PointByPointBreakdown({ pointLog, playerNames }: { 
  pointLog: PointDetail[], 
  playerNames: { p1: string, p2: string } 
}) {
  if (pointLog.length === 0) return null

  // Group points by games
  const gamePoints = pointLog.reduce((acc, point) => {
    const gameKey = `${point.setNumber}-${point.gameNumber}`
    if (!acc[gameKey]) {
      acc[gameKey] = []
    }
    acc[gameKey].push(point)
    return acc
  }, {} as Record<string, PointDetail[]>)

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          POINT BY POINT - SET 1
        </h3>
        <div className="space-y-3">
          {Object.entries(gamePoints).slice(-8).map(([gameKey, points]) => {
            const lastPoint = points[points.length - 1]
            const gameNum = gameKey.split('-')[1]
            
            return (
              <motion.div
                key={gameKey}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{gameNum}</span>
                  </div>
                  <div className="font-semibold text-lg">
                    {lastPoint.winner === 'p1' ? `${playerNames.p1.split(' ')[0]} wins` : `${playerNames.p2.split(' ')[0]} wins`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-lg">
                    {lastPoint.winner === 'p1' ? '1' : '0'} - {lastPoint.winner === 'p2' ? '1' : '0'}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {lastPoint.gameScore || "15-0, 30-0, 40-0"}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export function PublicLiveMatch({ match: initialMatch }: PublicLiveMatchProps) {
  const [match, setMatch] = useState(initialMatch)
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const { connected, lastUpdate } = useRealtimeMatch(match.$id)

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
    if (lastUpdate) {
      setMatch(prev => ({
        ...prev,
        scoreParsed: lastUpdate.score ? JSON.parse(lastUpdate.score) : prev.scoreParsed,
        status: lastUpdate.status || prev.status,
        pointLog: lastUpdate.pointLog || prev.pointLog,
        winnerId: lastUpdate.winnerId || prev.winnerId
      }))
    }
  }, [lastUpdate])

  const getPointDisplay = (points: number) => {
    const pointMap = ["0", "15", "30", "40"]
    if (points < 4) return pointMap[points]
    return "40"
  }

  const getGameScore = () => {
    const p1Points = getPointDisplay(match.scoreParsed.points[0])
    const p2Points = getPointDisplay(match.scoreParsed.points[1])
    
    // Handle deuce situation
    if (match.scoreParsed.points[0] >= 3 && match.scoreParsed.points[1] >= 3) {
      if (match.scoreParsed.points[0] === match.scoreParsed.points[1]) return "DEUCE"
      if (match.scoreParsed.points[0] > match.scoreParsed.points[1]) return `AD-${match.playerOne.firstName.toUpperCase()}`
      return `AD-${match.playerTwo.firstName.toUpperCase()}`
    }
    
    return `${p1Points} - ${p2Points}`
  }

  const shareMatch = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Match link copied to clipboard!")
    }).catch(() => {
      toast.error("Failed to copy link")
    })
  }

  const matchStats = calculateMatchStats(pointLog)
  const hasPointData = pointLog.length > 0
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-4 max-w-md mx-auto space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center pt-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Live Tennis Match</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white">
              {match.status === "In Progress" ? "Live" : "Completed"}
            </Badge>
            {connected && (
              <Badge variant="outline" className="border-green-500 text-green-500">
                Connected
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Main Scoreboard - Clean Design */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-0">
              {/* Player Names */}
              <div className="grid grid-cols-2 bg-muted/50">
                <div className={`p-4 text-center ${match.winnerId === match.playerOne.$id ? 'bg-primary/20' : ''}`}>
                  <div className="text-sm text-muted-foreground mb-1">Player 1</div>
                  <div className="font-semibold">{match.playerOne.firstName}</div>
                </div>
                <div className={`p-4 text-center border-l ${match.winnerId === match.playerTwo.$id ? 'bg-primary/20' : ''}`}>
                  <div className="text-sm text-muted-foreground mb-1">Player 2</div>
                  <div className="font-semibold">{match.playerTwo.firstName}</div>
                </div>
              </div>

              {/* Set Scores */}
              <div className="grid grid-cols-2">
                <div className="p-6 text-center">
                  <div className="text-4xl font-bold font-mono text-primary">
                    {match.scoreParsed.sets[0]?.[0] || 0}
                  </div>
                </div>
                <div className="p-6 text-center border-l">
                  <div className="text-4xl font-bold font-mono text-primary">
                    {match.scoreParsed.sets[0]?.[1] || 0}
                  </div>
                </div>
              </div>

              {/* Games Score */}
              {match.status === "In Progress" && (
                <div className="grid grid-cols-2 bg-muted/30">
                  <div className="p-4 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Games</div>
                    <div className="text-2xl font-mono">{match.scoreParsed.games[0]}</div>
                  </div>
                  <div className="p-4 text-center border-l">
                    <div className="text-xs text-muted-foreground mb-1">Games</div>
                    <div className="text-2xl font-mono">{match.scoreParsed.games[1]}</div>
                  </div>
                </div>
              )}

              {/* Current Game Score */}
              {match.status === "In Progress" && (
                <div className="bg-primary/10 p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Current Game</div>
                  <div className="text-xl font-mono text-primary font-semibold">{getGameScore()}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Statistics */}
        {hasPointData && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Match Statistics
                </h3>
                <div className="space-y-4">
                  {/* Player 1 Stats */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {match.playerOne.firstName}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player1.totalPointsWon}</div>
                        <div className="text-muted-foreground text-xs">Total Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player1.winners}</div>
                        <div className="text-muted-foreground text-xs">Winners</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player1.unforcedErrors}</div>
                        <div className="text-muted-foreground text-xs">Unforced Errors</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {match.playerTwo.firstName}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player2.totalPointsWon}</div>
                        <div className="text-muted-foreground text-xs">Total Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player2.winners}</div>
                        <div className="text-muted-foreground text-xs">Winners</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{matchStats.player2.unforcedErrors}</div>
                        <div className="text-muted-foreground text-xs">Unforced Errors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Point by Point Breakdown */}
        {hasPointData && (
          <motion.div variants={itemVariants}>
            <PointByPointBreakdown pointLog={pointLog} playerNames={playerNames} />
          </motion.div>
        )}

        {/* Share Button */}
        <motion.div variants={itemVariants} className="text-center py-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareMatch}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-semibold"
          >
            <Share2 className="h-4 w-4" />
            Share Match
          </motion.button>
        </motion.div>

        {/* Match Info */}
        <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground pb-4">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Match started {new Date(match.matchDate).toLocaleDateString()}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 