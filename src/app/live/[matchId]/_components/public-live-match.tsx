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
import { MatchStatsComponentSimple } from "@/app/(app)/matches/[id]/_components/match-stats"
import { PointByPointView } from "@/app/(app)/matches/[id]/_components/point-by-point-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LiveScoreboard as SharedLiveScoreboard } from "@/components/shared/live-scoreboard"

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

// Use shared scoreboard component
const LiveScoreboard = SharedLiveScoreboard

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
  const [mounted, setMounted] = useState(false)
  
  // Only start real-time connection after component mounts to prevent hydration issues
  const { connected, lastUpdate, error, retryCount } = useRealtimeMatch(mounted ? match.$id : "")

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

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
    if (lastUpdate && mounted) {
      console.log("🔄 Updating match with real-time data:", lastUpdate)
      setMatch(prev => ({
        ...prev,
        scoreParsed: lastUpdate.score ? JSON.parse(lastUpdate.score) : prev.scoreParsed,
        status: lastUpdate.status || prev.status,
        pointLog: lastUpdate.pointLog || prev.pointLog,
        winnerId: lastUpdate.winnerId || prev.winnerId
      }))
    }
  }, [lastUpdate, mounted])

  const shareMatch = async () => {
    const url = window.location.href
    const title = `${match.playerOne.firstName} ${match.playerOne.lastName} vs ${match.playerTwo.firstName} ${match.playerTwo.lastName} - Live Tennis Match`
    const text = "Watch this live tennis match!"
    
    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Try native share first if available and on mobile
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title,
          text,
          url
        })
        toast.success("Match shared successfully!")
        return
      } catch (err) {
        // User canceled or error occurred, fall through to clipboard
        console.log("Native share failed or canceled:", err)
      }
    }
    
    // Fallback to clipboard copy for desktop or when native share fails
    fallbackShare(url)
  }

  const fallbackShare = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Match link copied to clipboard! Share it with others to let them watch live.")
    } catch {
      // If clipboard fails, show the URL in an alert
      toast.error(`Copy this link manually: ${url}`)
    }
  }

  const refreshMatch = () => {
    window.location.reload()
  }

  const matchStats = calculateMatchStats(pointLog)
  const hasPointData = pointLog.length > 0
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerOne.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`
  }

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative z-10 p-4 max-w-md mx-auto space-y-4">
          <div className="text-center pt-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Live Tennis Match</h1>
            </div>
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 p-3 max-w-sm mx-auto space-y-3"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center pt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Live Tennis</h1>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMatch}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareMatch}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white text-xs">
              {match.status === "In Progress" ? "Live" : "Completed"}
            </Badge>
            
            {/* Connection Status - only show if match is in progress */}
            {match.status === "In Progress" && (
              <Badge variant={connected ? "outline" : "destructive"} className={`text-xs border ${connected ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                {connected ? (
                  <>
                    <Wifi className="w-2 h-2 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2 h-2 mr-1" />
                    {retryCount > 0 ? `Retry ${retryCount}/3` : 'Connecting'}
                  </>
                )}
              </Badge>
            )}
          </div>
          
          {error && match.status === "In Progress" && (
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
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
              <TabsTrigger value="points" disabled={!hasPointData} className="text-xs">
                Points
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-3">
              <Card>
                <CardContent className="p-3">
                  <MatchStatsComponentSimple 
                    stats={matchStats}
                    playerNames={playerNames}
                    detailLevel="simple"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points" className="mt-3">
              <Card>
                <CardContent className="p-3">
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
        <motion.div variants={itemVariants} className="text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3 w-3" />
            <span>Started {new Date(match.matchDate).toLocaleDateString()}</span>
          </div>
          <p className="text-xs opacity-60">
            TennisScore
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
} 