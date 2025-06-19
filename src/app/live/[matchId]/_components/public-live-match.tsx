"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Share2, Trophy, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Player, MatchFormat, Score, PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { toast } from "sonner"
import { useRealtimeMatch } from "@/hooks/use-realtime-match"
import { MatchStatsComponent } from "@/app/(app)/matches/[id]/_components/match-stats"
import { PointByPointView } from "@/app/(app)/matches/[id]/_components/point-by-point-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"

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

// Live Scoreboard Component matching the live interface
function LiveScoreboard({
  playerOneName,
  playerTwoName,
  score,
  status,
  winnerId,
  playerOneId,
  playerTwoId
}: {
  playerOneName: string
  playerTwoName: string
  score: Score & { server?: "p1" | "p2" }
  status: string
  winnerId?: string
  playerOneId: string
  playerTwoId: string
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

  return (
    <div className="bg-card text-card-foreground rounded-lg border my-4">
      {/* Header Row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center p-2 border-b text-xs text-muted-foreground">
        <div className="font-semibold uppercase tracking-wider">Player</div>
        <div className="w-12 text-center">Sets</div>
        <div className="w-12 text-center">Games</div>
        <div className="w-12 text-center">Points</div>
      </div>
      
      {/* Player 1 Row */}
      <div className={`grid grid-cols-[1fr_auto_auto_auto] items-center p-3 font-medium ${winnerId === playerOneId ? 'bg-primary/10' : ''}`}>
        <div className="flex items-center gap-3">
          {score.server === "p1" && (
            <motion.div layoutId="tennis-ball" className="flex-shrink-0">
              <TennisBallIcon className="w-4 h-4" />
            </motion.div>
          )}
          <span className="font-sans font-semibold tracking-wide">{playerOneName}</span>
        </div>
        <div className="w-12 text-center font-mono text-xl">{score.sets[0]?.[0] || 0}</div>
        <div className="w-12 text-center font-mono text-xl">{score.games[0]}</div>
        <div className="w-12 text-center font-mono text-xl font-bold text-primary">
          {status === "In Progress" ? getPointDisplay(score.points, 0) : ""}
        </div>
      </div>

      <div className="border-t"></div>

      {/* Player 2 Row */}
      <div className={`grid grid-cols-[1fr_auto_auto_auto] items-center p-3 font-medium ${winnerId === playerTwoId ? 'bg-primary/10' : ''}`}>
        <div className="flex items-center gap-3">
          {score.server === "p2" && (
            <motion.div layoutId="tennis-ball" className="flex-shrink-0">
              <TennisBallIcon className="w-4 h-4" />
            </motion.div>
          )}
          <span className="font-sans font-semibold tracking-wide">{playerTwoName}</span>
        </div>
        <div className="w-12 text-center font-mono text-xl">{score.sets[0]?.[1] || 0}</div>
        <div className="w-12 text-center font-mono text-xl">{score.games[1]}</div>
        <div className="w-12 text-center font-mono text-xl font-bold text-primary">
          {status === "In Progress" ? getPointDisplay(score.points, 1) : ""}
        </div>
      </div>
    </div>
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
  const { connected, lastUpdate, error, retryCount } = useRealtimeMatch(match.$id)

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

  const shareMatch = async () => {
    const url = window.location.href
    const title = `${match.playerOne.firstName} ${match.playerOne.lastName} vs ${match.playerTwo.firstName} ${match.playerTwo.lastName} - Live Tennis Match`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Watch this live tennis match!",
          url
        })
      } catch (err) {
        // User canceled share or error occurred
        if (err instanceof Error && err.name !== 'AbortError') {
          fallbackShare(url)
        }
      }
    } else {
      fallbackShare(url)
    }
  }

  const fallbackShare = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Match link copied to clipboard!")
    }).catch(() => {
      toast.error("Failed to copy link")
    })
  }

  const refreshMatch = () => {
    window.location.reload()
  }

  // Test function to trigger a manual update
  const testUpdate = async () => {
    try {
      console.log("🧪 Testing manual update for match:", match.$id)
      
      // Create a mock update
      const testUpdate = {
        score: JSON.stringify({
          ...match.scoreParsed,
          points: [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)]
        }),
        status: match.status
      }
      
      console.log("Test update data:", testUpdate)
      
      // This would normally be done via a server action, but for testing
      // we can see if we receive the update via real-time
      toast.success("Test update triggered - check console for real-time events")
    } catch (error) {
      console.error("Test update failed:", error)
      toast.error("Test update failed")
    }
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Live Tennis Match</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMatch}
                className="p-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testUpdate}
                className="p-2 text-xs"
              >
                🧪 Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareMatch}
                className="p-2"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white">
              {match.status === "In Progress" ? "Live" : "Completed"}
            </Badge>
            
            {/* Connection Status */}
            <Badge variant={connected ? "outline" : "destructive"} className={`border-2 ${connected ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
              {connected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  {retryCount > 0 ? `Retry ${retryCount}/5` : 'Disconnected'}
                </>
              )}
            </Badge>
          </div>
          
          {error && (
            <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded border">
              Connection error: {error}
            </div>
          )}
        </motion.div>

        {/* Live Scoreboard */}
        <motion.div variants={itemVariants}>
          <LiveScoreboard
            playerOneName={playerNames.p1}
            playerTwoName={playerNames.p2}
            score={match.scoreParsed}
            status={match.status}
            winnerId={match.winnerId}
            playerOneId={match.playerOne.$id}
            playerTwoId={match.playerTwo.$id}
          />
        </motion.div>

        {/* Match Details Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="points" disabled={!hasPointData}>
                Point-by-Point
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <MatchStatsComponent 
                    stats={matchStats}
                    playerOne={match.playerOne}
                    playerTwo={match.playerTwo}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <PointByPointView
                    pointLog={pointLog}
                    playerNames={playerNames}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Match Info Footer */}
        <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span>Started {new Date(match.matchDate).toLocaleString()}</span>
          </div>
          <p className="text-xs">
            Powered by TennisScore
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 