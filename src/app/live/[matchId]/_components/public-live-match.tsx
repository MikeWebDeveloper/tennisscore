"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Share2, Trophy, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Player, MatchFormat, Score, PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { toast } from "sonner"
import { useRealtimeMatch } from "@/hooks/use-realtime-match"
import { MatchStatsComponentSimple } from "@/app/(app)/matches/[id]/_components/match-stats"
import { PointByPointView } from "@/app/(app)/matches/[id]/_components/point-by-point-view"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LiveScoreboard } from "@/components/shared/live-scoreboard"

interface PublicLiveMatchProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    playerThree?: Player
    playerFour?: Player
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
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
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
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`,
    p3: match.playerThree ? `${match.playerThree.firstName} ${match.playerThree.lastName}` : undefined,
    p4: match.playerFour ? `${match.playerFour.firstName} ${match.playerFour.lastName}` : undefined,
  }

  // Prevent hydration mismatch by showing loading state until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative z-10 p-4 max-w-4xl mx-auto space-y-4">
          <div className="text-center pt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Live Tennis Match</h1>
            </div>
            <div className="animate-pulse text-muted-foreground">Loading...</div>
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
        animate="show"
        className="relative z-10 p-4 max-w-4xl mx-auto space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Live Tennis</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshMatch}
                className="h-9 px-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareMatch}
                className="h-9 px-3"
              >
                <Share2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Badge variant={match.status === "In Progress" ? "default" : "secondary"} className="bg-green-500 text-white">
              {match.status === "In Progress" ? "Live" : "Completed"}
            </Badge>
            
            {/* Connection Status - only show if match is in progress */}
            {match.status === "In Progress" && (
              <Badge variant={connected ? "outline" : "destructive"} className={`border ${connected ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}>
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    {retryCount > 0 ? `Retry ${retryCount}/3` : 'Connecting'}
                  </>
                )}
              </Badge>
            )}
          </div>
          
          {error && match.status === "In Progress" && (
            <div className="text-sm text-red-500 mt-3 p-3 bg-red-50 rounded border max-w-md mx-auto">
              Connection error: {error}
            </div>
          )}
        </motion.div>

        {/* Live Scoreboard */}
        <motion.div variants={itemVariants}>
          <LiveScoreboard
            playerOneName={playerNames.p1}
            playerTwoName={playerNames.p2}
            playerThreeName={playerNames.p3}
            playerFourName={playerNames.p4}
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
            <TabsList className="grid w-full grid-cols-2 h-10 max-w-md mx-auto">
              <TabsTrigger value="stats" className="text-sm">Stats</TabsTrigger>
              <TabsTrigger value="points" disabled={!hasPointData} className="text-sm">
                Points
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <MatchStatsComponentSimple 
                    stats={matchStats}
                    playerNames={playerNames}
                    detailLevel="simple"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="points" className="mt-4">
              <Card>
                <CardContent className="p-4 md:p-6">
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
        <motion.div variants={itemVariants} className="text-center py-4 border-t">
          <div className="text-center space-y-2">
            <h1 className="text-lg md:text-xl font-bold">
              {playerNames.p3 && playerNames.p4 
                ? `${playerNames.p1} / ${playerNames.p3}`
                : playerNames.p1
              }
            </h1>
            <div className="text-sm text-muted-foreground">vs</div>
            <h2 className="text-lg md:text-xl font-bold">
              {playerNames.p3 && playerNames.p4 
                ? `${playerNames.p2} / ${playerNames.p4}`
                : playerNames.p2
              }
            </h2>
            <div className="text-sm text-muted-foreground mt-3">
              {new Date(match.matchDate).toLocaleDateString()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
} 