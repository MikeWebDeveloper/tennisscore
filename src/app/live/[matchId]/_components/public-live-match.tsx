"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Share2, Trophy, Clock } from "lucide-react"
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background p-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Live Tennis Match</h1>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge variant={match.status === "In Progress" ? "default" : "secondary"}>
              {match.status === "In Progress" ? "Live" : "Completed"}
            </Badge>
            {connected && (
              <Badge variant="outline" className="text-green-600">
                Connected
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Main Scoreboard */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Player Names */}
              <div className="grid grid-cols-2 bg-muted/50">
                <div className={`p-4 text-center font-medium ${match.winnerId === match.playerOne.$id ? 'bg-primary text-primary-foreground' : ''}`}>
                  {match.playerOne.firstName} {match.playerOne.lastName}
                </div>
                <div className={`p-4 text-center font-medium ${match.winnerId === match.playerTwo.$id ? 'bg-primary text-primary-foreground' : ''}`}>
                  {match.playerTwo.firstName} {match.playerTwo.lastName}
                </div>
              </div>

              {/* Set Scores */}
              <div className="grid grid-cols-2 border-b">
                {match.scoreParsed.sets.map((set, index) => (
                  <div key={index} className="grid grid-cols-2 border-r last:border-r-0">
                    <div className="p-3 text-center text-lg font-mono border-r">
                      {set[0]}
                    </div>
                    <div className="p-3 text-center text-lg font-mono">
                      {set[1]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Game Score */}
              {match.status === "In Progress" && (
                <div className="grid grid-cols-2">
                  <div className="p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Games</div>
                    <div className="text-2xl font-mono">{match.scoreParsed.games[0]}</div>
                  </div>
                  <div className="p-4 text-center border-l">
                    <div className="text-sm text-muted-foreground mb-1">Games</div>
                    <div className="text-2xl font-mono">{match.scoreParsed.games[1]}</div>
                  </div>
                </div>
              )}

              {/* Current Point Score */}
              {match.status === "In Progress" && (
                <div className="bg-muted/30 p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Current Game</div>
                  <div className="text-xl font-mono">{getGameScore()}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Stats */}
        {pointLog.length > 0 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Match Statistics</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {match.playerOne.firstName} {match.playerOne.lastName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Points</span>
                                               <span className="font-mono">{matchStats.player1.totalPointsWon}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Winners</span>
                       <span className="font-mono">{matchStats.player1.winners}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Unforced Errors</span>
                       <span className="font-mono">{matchStats.player1.unforcedErrors}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      {match.playerTwo.firstName} {match.playerTwo.lastName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Points</span>
                                               <span className="font-mono">{matchStats.player2.totalPointsWon}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Winners</span>
                       <span className="font-mono">{matchStats.player2.winners}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>Unforced Errors</span>
                       <span className="font-mono">{matchStats.player2.unforcedErrors}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Share Button */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareMatch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share Match
          </motion.button>
        </motion.div>

        {/* Match Info */}
        <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Match started {new Date(match.matchDate).toLocaleDateString()}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 