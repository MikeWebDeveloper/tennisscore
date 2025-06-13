"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Share2, 
  ArrowLeft,
  Target,
  Zap,
  AlertTriangle,
  RotateCcw,
  Circle
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { reconstructMatchScore } from "@/lib/utils/tennis-scoring"
import { Player, PointDetail, ServeType, PointOutcome, ShotType } from "@/lib/types"

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
    pointLog?: string
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
  return (
    <motion.div 
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-mono font-bold">
            {isPercentage ? `${player1Value}%` : player1Value}
          </div>
          {player1Detail && (
            <div className="text-xs text-muted-foreground mt-1">
              {player1Detail}
            </div>
          )}
        </div>
        
        <div className="text-center">
          <div className="text-lg font-mono font-bold">
            {isPercentage ? `${player2Value}%` : player2Value}
          </div>
          {player2Detail && (
            <div className="text-xs text-muted-foreground mt-1">
              {player2Detail}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Progress 
          value={isPercentage ? Number(player1Value) : 
            Number(player1Value) / (Number(player1Value) + Number(player2Value)) * 100} 
          className="h-2"
        />
        <Progress 
          value={isPercentage ? Number(player2Value) : 
            Number(player2Value) / (Number(player1Value) + Number(player2Value)) * 100} 
          className="h-2"
        />
      </div>
    </motion.div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const [score, setScore] = useState(match.scoreParsed)
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [currentServer, setCurrentServer] = useState<"p1" | "p2" | null>(null)
  const [serveType, setServeType] = useState<ServeType>("first")
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState("statistics")
  
  // New state for point outcome selection
  const [pendingPoint, setPendingPoint] = useState<{
    player: number
    context: PointContext
  } | null>(null)
  const [showPointOutcome, setShowPointOutcome] = useState(false)

  // Initialize from existing match data
  useEffect(() => {
    // Parse existing point log if available
    if (match.pointLog) {
      try {
        const existingPointLog = JSON.parse(match.pointLog)
        setPointLog(existingPointLog)
        
        // Determine current server from last point or default to p1
        if (existingPointLog.length > 0) {
          const lastPoint = existingPointLog[existingPointLog.length - 1]
          // Server switches after each game, so check if we're in a new game
          const totalGames = score.games[0] + score.games[1]
          const isNewGame = score.points[0] === 0 && score.points[1] === 0
          
          if (isNewGame && totalGames > 0) {
            // New game, so server has switched
            setCurrentServer(lastPoint.server === "p1" ? "p2" : "p1")
          } else {
            // Same game, same server
            setCurrentServer(lastPoint.server)
          }
        } else {
          // No points played yet, default to p1
          setCurrentServer("p1")
        }
      } catch (error) {
        console.error("Failed to parse point log:", error)
        setCurrentServer("p1") // Default if no valid data
      }
    } else {
      // New match, default to p1
      setCurrentServer("p1")
    }
  }, [match.pointLog, score.games, score.points])

  // Calculate live stats
  const matchStats = calculateMatchStats(pointLog)
  const playerNames = {
    p1: `${match.playerOne.firstName} ${match.playerTwo.lastName}`,
    p2: `${match.playerTwo.firstName} ${match.playerTwo.lastName}`
  }

  const getPointDisplay = (points: number) => {
    const pointMap = ["0", "15", "30", "40"]
    if (points < 4) return pointMap[points]
    return "40"
  }

  const getGameScore = () => {
    const p1Points = getPointDisplay(score.points[0])
    const p2Points = getPointDisplay(score.points[1])
    
    // Handle deuce situation
    if (score.points[0] >= 3 && score.points[1] >= 3) {
      if (score.points[0] === score.points[1]) return "DEUCE"
      if (score.points[0] > score.points[1]) return "AD-" + playerNames.p1.split(' ')[0].toUpperCase()
      return "AD-" + playerNames.p2.split(' ')[0].toUpperCase()
    }
    
    return `${p1Points} - ${p2Points}`
  }

  const awardPoint = async (playerIndex: number) => {
    if (isUpdating || !currentServer) return

    setIsUpdating(true)

    // Generate point context
    const context: PointContext = {
      pointNumber: pointLog.length + 1,
      setNumber: score.sets.length + 1,
      gameNumber: score.games[0] + score.games[1] + 1,
      gameScore: getGameScore(),
      winner: playerIndex === 0 ? "p1" : "p2",
      server: currentServer,
      isBreakPoint: false, // Simplified for now
      isSetPoint: false,
      isMatchPoint: false,
      playerNames
    }

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

  // Point-by-Point component
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
          <div className="space-y-6">
            {Object.entries(setGroups[selectedSet])
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([gameNumber, gamePoints]) => (
                <div key={gameNumber} className="space-y-3">
                  <h3 className="font-medium text-sm">
                    Game {gameNumber}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1">
                    {gamePoints.map((point, pointIndex) => (
                      <Dialog key={point.id}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 font-mono text-xs"
                          >
                            {point.winner === "p1" ? 
                              playerNames.p1.split(' ')[0] : 
                              playerNames.p2.split(' ')[0]
                            }
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <div className="space-y-4">
                            <div className="text-center">
                              <h4 className="font-semibold">Point {point.pointNumber}</h4>
                              <p className="text-sm text-muted-foreground">
                                Game {point.gameNumber}, Set {point.setNumber}
                              </p>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Score:</span>
                                <span className="font-mono">{point.gameScore}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Server:</span>
                                <span>{point.server === "p1" ? playerNames.p1 : playerNames.p2}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Serve:</span>
                                <span>{point.serveType === "first" ? "1st Serve" : "2nd Serve"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Outcome:</span>
                                <span className="capitalize">{point.pointOutcome.replace('_', ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Winner:</span>
                                <span>{point.winner === "p1" ? playerNames.p1 : playerNames.p2}</span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    )
  }

  const StatisticsTab = () => (
    <div className="space-y-6">
      <StatRow
        label="Aces"
        player1Value={matchStats.player1.aces}
        player2Value={matchStats.player2.aces}
        delay={1}
      />
      
      <StatRow
        label="Double Faults"
        player1Value={matchStats.player1.doubleFaults}
        player2Value={matchStats.player2.doubleFaults}
        delay={2}
      />
      
      <StatRow
        label="Winners"
        player1Value={matchStats.player1.winners}
        player2Value={matchStats.player2.winners}
        delay={3}
      />
      
      <StatRow
        label="Unforced Errors"
        player1Value={matchStats.player1.unforcedErrors}
        player2Value={matchStats.player2.unforcedErrors}
        delay={4}
      />
      
      <StatRow
        label="1st Serve %"
        player1Value={Math.round(matchStats.player1.firstServePercentage)}
        player2Value={Math.round(matchStats.player2.firstServePercentage)}
        isPercentage={true}
        player1Detail={`${matchStats.player1.firstServesMade}/${matchStats.player1.firstServesAttempted}`}
        player2Detail={`${matchStats.player2.firstServesMade}/${matchStats.player2.firstServesAttempted}`}
        delay={5}
      />
      
      <StatRow
        label="1st Serve Points Won"
        player1Value={Math.round(matchStats.player1.firstServeWinPercentage)}
        player2Value={Math.round(matchStats.player2.firstServeWinPercentage)}
        isPercentage={true}
        player1Detail={`${matchStats.player1.firstServePointsWon}/${matchStats.player1.firstServePointsPlayed}`}
        player2Detail={`${matchStats.player2.firstServePointsWon}/${matchStats.player2.firstServePointsPlayed}`}
        delay={6}
      />
      
      <StatRow
        label="Points Won"
        player1Value={Math.round(matchStats.player1.pointWinPercentage)}
        player2Value={Math.round(matchStats.player2.pointWinPercentage)}
        isPercentage={true}
        player1Detail={`${matchStats.player1.totalPointsWon}/${matchStats.player1.totalPointsWon + matchStats.player2.totalPointsWon}`}
        player2Detail={`${matchStats.player2.totalPointsWon}/${matchStats.player1.totalPointsWon + matchStats.player2.totalPointsWon}`}
        delay={7}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undoLastPoint}
              disabled={pointLog.length === 0}
            >
              <RotateCcw className="h-4 w-4 text-red-500" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={shareMatch}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Match Header - Player Names, Photos, and Scores */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            {/* Player 1 */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                {match.playerOne.profilePictureId ? (
                  <AvatarImage 
                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/profile-pictures/files/${match.playerOne.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`}
                    alt={`${match.playerOne.firstName} ${match.playerOne.lastName}`}
                  />
                ) : null}
                <AvatarFallback>
                  {match.playerOne.firstName[0]}{match.playerOne.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">
                    {match.playerOne.firstName} {match.playerOne.lastName}
                  </h2>
                  {currentServer === "p1" && (
                    <Circle className="h-3 w-3 fill-primary text-primary" />
                  )}
                </div>
                {match.playerOne.rating && (
                  <p className="text-sm text-muted-foreground">
                    {match.playerOne.rating}
                  </p>
                )}
              </div>
            </div>

            {/* Set and Game Scores */}
            <div className="flex flex-col items-center gap-2">
              {/* Sets */}
              <div className="flex gap-4 text-sm">
                {score.sets.map((set, index) => (
                  <div key={index} className="flex gap-1">
                    <span className="w-6 text-center font-mono">{set.p1}</span>
                    <span className="w-6 text-center font-mono">{set.p2}</span>
                  </div>
                ))}
                {/* Current set */}
                <div className="flex gap-1 font-semibold">
                  <span className="w-6 text-center font-mono">{score.games[0]}</span>
                  <span className="w-6 text-center font-mono">{score.games[1]}</span>
                </div>
              </div>
            </div>

            {/* Player 2 */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  {currentServer === "p2" && (
                    <Circle className="h-3 w-3 fill-primary text-primary" />
                  )}
                  <h2 className="font-semibold text-lg">
                    {match.playerTwo.firstName} {match.playerTwo.lastName}
                  </h2>
                </div>
                {match.playerTwo.rating && (
                  <p className="text-sm text-muted-foreground">
                    {match.playerTwo.rating}
                  </p>
                )}
              </div>
              
              <Avatar className="h-12 w-12">
                {match.playerTwo.profilePictureId ? (
                  <AvatarImage 
                    src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/profile-pictures/files/${match.playerTwo.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`}
                    alt={`${match.playerTwo.firstName} ${match.playerTwo.lastName}`}
                  />
                ) : null}
                <AvatarFallback>
                  {match.playerTwo.firstName[0]}{match.playerTwo.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Current Game Score */}
      <div className="p-4 bg-muted/30">
        <div className="text-center">
          <h3 className="text-3xl font-mono font-bold mb-2">
            {getGameScore()}
          </h3>
          
          {/* Serve Type Selection */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant={serveType === "first" ? "default" : "outline"}
              size="sm"
              onClick={() => setServeType("first")}
              className="relative"
            >
              1st Serve
              {serveType === "first" && <span className="ml-1">✓</span>}
            </Button>
            <Button
              variant={serveType === "second" ? "default" : "outline"}
              size="sm"
              onClick={() => setServeType("second")}
              className="relative"
            >
              2nd Serve
              {serveType === "second" && <span className="ml-1">✓</span>}
            </Button>
          </div>

          {/* Point Buttons */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Button
              onClick={() => awardPoint(0)}
              disabled={isUpdating || !currentServer}
              size="lg"
              className="h-20 text-lg font-semibold"
            >
              Point {match.playerOne.firstName}
            </Button>
            <Button
              onClick={() => awardPoint(1)}
              disabled={isUpdating || !currentServer}
              size="lg"
              className="h-20 text-lg font-semibold"
            >
              Point {match.playerTwo.firstName}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Statistics and Point-by-Point */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="point-by-point">Point by Point</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statistics" className="mt-6">
            <StatisticsTab />
          </TabsContent>
          
          <TabsContent value="point-by-point" className="mt-6">
            <PointByPointTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Point Outcome Selection Modal */}
      <Dialog open={showPointOutcome} onOpenChange={setShowPointOutcome}>
        <DialogContent className="max-w-sm bg-background/95 backdrop-blur">
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold">How was the point won?</h4>
              <p className="text-sm text-muted-foreground">
                {serveType === "first" ? "1st Serve" : "2nd Serve"}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => savePointWithOutcome("ace")}
                variant="default"
                className="h-12 flex flex-col items-center justify-center"
              >
                <Target className="h-4 w-4 mb-1" />
                Ace
              </Button>

              {serveType === "second" && (
                <Button
                  onClick={() => savePointWithOutcome("double_fault")}
                  variant="destructive"
                  className="h-12 flex flex-col items-center justify-center"
                >
                  <AlertTriangle className="h-4 w-4 mb-1" />
                  Double Fault
                </Button>
              )}

              <Button
                onClick={() => savePointWithOutcome("winner")}
                variant="default"
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 