"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { 
  Share2, 
  ArrowLeft,
  RotateCcw,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { calculateMatchStats } from "@/lib/utils/match-stats"
import { isBreakPoint, isGameWon as getGameWon, isSetWon as getSetWon, getGameWinner, getServer } from "@/lib/utils/tennis-scoring"
import { Player, PointDetail, ServeType, PointOutcome, MatchFormat, Score } from "@/lib/types"
import { ServeSelection } from "./serve-selection"

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
    scoreParsed: Score
    matchFormatParsed: MatchFormat
    status: "In Progress" | "Completed"
    pointLog?: string[]
    winnerId?: string
  }
}

// Tennis Ball SVG Component
function TennisBall({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" fill="#9ACD32" stroke="#228B22" strokeWidth="1"/>
      <path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12s-2 4.5-4.5 4.5S2 14.5 2 12z" fill="none" stroke="#228B22" strokeWidth="1.5"/>
      <path d="M22 12c0 2.5-2 4.5-4.5 4.5S13 14.5 13 12s2-4.5 4.5-4.5S22 9.5 22 12z" fill="none" stroke="#228B22" strokeWidth="1.5"/>
    </svg>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const [score, setScore] = useState<Score>(match.scoreParsed)
  const [pointLog, setPointLog] = useState<PointDetail[]>([])
  const [currentServer, setCurrentServer] = useState<"p1" | "p2" | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // New states for detailed point logging
  const [pendingPoint, setPendingPoint] = useState<{
    player: number
    context: PointContext
  } | null>(null)
  const [showPointOutcome, setShowPointOutcome] = useState(false)

  // Initialize from existing match data
  useEffect(() => {
    // Parse existing point log if available
    if (match.pointLog && match.pointLog.length > 0) {
      try {
        // Parse each string in the array back into a PointDetail object
        const existingPointLog: PointDetail[] = match.pointLog.map(pointStr => JSON.parse(pointStr))
        setPointLog(existingPointLog)
        
        // Determine current server from the total games played
        const totalGamesPlayed = score.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + score.games[0] + score.games[1]
        const calculatedServer = getServer(totalGamesPlayed + 1)
        setCurrentServer(calculatedServer)
      } catch (error) {
        console.error("Failed to parse point log:", error)
        setCurrentServer(null) // Default to null if parsing fails
      }
    } else {
      // No points played yet, default to null to show ServeSelection
      setCurrentServer(null)
    }
  }, [match.pointLog, score.sets, score.games])

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

  const getGameScore = () => {
    const p1Points = getPointDisplay(score.points[0])
    const p2Points = getPointDisplay(score.points[1])
    
    // Handle deuce situation
    if (score.points[0] >= 3 && score.points[1] >= 3) {
      if (score.points[0] === score.points[1]) return "DEUCE"
      if (score.points[0] > score.points[1]) return `AD-${playerNames.p1.split(' ')[0].toUpperCase()}`
      return `AD-${playerNames.p2.split(' ')[0].toUpperCase()}`
    }
    
    return `${p1Points} - ${p2Points}`
  }

  const awardPoint = async (playerIndex: number) => {
    if (isUpdating) return

    // Ensure a server is selected before awarding a point
    if (!currentServer) {
      toast.info("Please select the initial server.")
      return
    }

    setIsUpdating(true)

    // Get current game and set scores to pass to point context
    const currentSetNumber = score.sets.length + 1
    const currentGameNumber = score.games[0] + score.games[1] + 1

    const context: PointContext = {
      pointNumber: pointLog.length + 1,
      setNumber: currentSetNumber,
      gameNumber: currentGameNumber,
      gameScore: getGameScore(), // Current game score (e.g., "30-15")
      winner: playerIndex === 0 ? "p1" : "p2",
      server: currentServer,
      isBreakPoint: false, // Will be calculated dynamically in scoring logic
      isSetPoint: false,
      isMatchPoint: false,
      playerNames,
      gameWon: false,
      setWon: false,
      matchWon: false,
    }

    // Set pending point and show outcome selection
    setPendingPoint({
      player: playerIndex,
      context
    })
    setShowPointOutcome(true) // Open the new detailed point logging sheet
    setIsUpdating(false)
  }

  const savePointWithOutcome = async (
    outcome: PointOutcome,
    selectedServeType: ServeType
  ) => {
    if (!pendingPoint || !currentServer) return

    setIsUpdating(true)
    setShowPointOutcome(false) // Close the point outcome sheet

    const winner = pendingPoint.player === 0 ? "p1" : "p2"

    // Calculate new score based on the awarded point
    const newPoints = [...score.points]
    newPoints[pendingPoint.player]++

    let newGames = [...score.games]
    const newSets = [...score.sets]
    let matchWinnerId: string | undefined = undefined
    let newServer = currentServer
    let matchStatus: "In Progress" | "Completed" = "In Progress"

    const gameWon = getGameWon(newPoints[0], newPoints[1], match.matchFormatParsed.noAd);
    let setWon = false;
    let matchWon = false;

    if (gameWon) {
      // Increment game count for the winner
      if (winner === "p1") newGames[0]++
      else newGames[1]++

      // Reset points for new game
      newPoints[0] = 0
      newPoints[1] = 0

      // Determine if set is won
      const currentSets = [...newSets]
      setWon = getSetWon(newGames[0], newGames[1], match.matchFormatParsed, currentSets)

      if (setWon) {
        // Add current game score to sets
        newSets.push([...newGames]) // Push a copy of newGames

        // Reset games for new set
        newGames = [0, 0]

        // Determine if match is won
        matchWon = newSets.filter(set => set[0] > set[1]).length === match.matchFormatParsed.sets ||
                         newSets.filter(set => set[1] > set[0]).length === match.matchFormatParsed.sets

        if (matchWon) {
          matchStatus = "Completed"
          matchWinnerId = winner === "p1" ? match.playerOne.$id : match.playerTwo.$id
        }
      }

      // Server switches after each game
      const totalGamesPlayed = newSets.reduce((sum, set) => sum + set[0] + set[1], 0) + newGames[0] + newGames[1];
      newServer = getServer(totalGamesPlayed + 1) // Calculate next server based on total games played
    }

    const updatedScore = { sets: newSets, games: newGames, points: newPoints }
    setScore(updatedScore)

    const newPointDetail: PointDetail = {
      id: `point-${pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: pendingPoint.context.pointNumber,
      setNumber: pendingPoint.context.setNumber,
      gameNumber: pendingPoint.context.gameNumber,
      gameScore: pendingPoint.context.gameScore,
      winner,
      server: currentServer,
      serveType: selectedServeType,
      serveOutcome: outcome, // Use the selected outcome for serve outcome
      rallyLength: 1, // Default rally length for now
      pointOutcome: outcome,
      lastShotType: undefined,
      lastShotPlayer: winner,
      isBreakPoint: isBreakPoint(
        currentServer === "p1" ? score.points[0] : score.points[1],
        currentServer === "p1" ? score.points[1] : score.points[0],
        match.matchFormatParsed.noAd
      ),
      isSetPoint: setWon && !matchWon,
      isMatchPoint: matchWon,
      isGameWinning: gameWon,
      isSetWinning: setWon,
      isMatchWinning: matchWon,
      notes: "",
    }

    setPointLog((prev) => [...prev, newPointDetail])
    setCurrentServer(newServer) // Update server for next point

    // Save to database
    try {
      await updateMatchScore(match.$id, {
        score: updatedScore,
        pointLog: [...pointLog, newPointDetail],
        status: matchStatus,
        winnerId: matchWinnerId
      })
    } catch (error) {
      console.error("Failed to save match score:", error)
      toast.error("Failed to save score")
    }

    setIsUpdating(false)
  }

  const undoLastPoint = async () => {
    if (pointLog.length === 0 || isUpdating) return

    setIsUpdating(true)

    try {
      // Remove the last point from the log
      const newPointLog = pointLog.slice(0, -1)
      setPointLog(newPointLog)

      // Recalculate score from the remaining points
      const recalculatedScore = calculateScoreFromPointLog(newPointLog, match.matchFormatParsed)
      setScore(recalculatedScore)

      // Recalculate current server
      const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + 
                              recalculatedScore.games[0] + recalculatedScore.games[1]
      const newServer = getServer(totalGamesPlayed + 1)
      setCurrentServer(newServer)

      // Save to database
      await updateMatchScore(match.$id, {
        score: recalculatedScore,
        pointLog: newPointLog
      })

      toast.success("Point undone")
    } catch (error) {
      console.error("Failed to undo point:", error)
      toast.error("Failed to undo point")
    }

    setIsUpdating(false)
  }

  function calculateScoreFromPointLog(log: PointDetail[], format: MatchFormat) {
    // Reconstruct the score from the point log
    const sets: number[][] = []
    let games = [0, 0]
    let points = [0, 0]

    for (const point of log) {
      // Award point to winner
      if (point.winner === "p1") {
        points[0]++
      } else {
        points[1]++
      }

      // Check if game is won
      if (getGameWon(points[0], points[1], format.noAd)) {
        // Award game to winner
        const gameWinner = getGameWinner(points[0], points[1], format.noAd)
        if (gameWinner === "p1") games[0]++
        else if (gameWinner === "p2") games[1]++

        // Reset points
        points = [0, 0]

        // Check if set is won
        if (getSetWon(games[0], games[1], format, sets)) {
          // Add games to sets
          sets.push([...games])
          // Reset games
          games = [0, 0]
        }
      }
    }

    return { sets, games, points }
  }

  const shareMatch = () => {
    const url = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(url)
    toast.success("Live match link copied to clipboard!")
  }

  // Show serve selection if no server is selected
  if (!currentServer && match.status === "In Progress") {
    return (
      <ServeSelection
        playerOne={match.playerOne}
        playerTwo={match.playerTwo}
        onServeSelected={(server: "p1" | "p2") => setCurrentServer(server)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Matches
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-500">LIVE</span>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={shareMatch}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Match Date */}
      <div className="bg-primary text-primary-foreground px-4 py-2 text-center">
        <span className="text-sm font-medium">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Players and Scores */}
      <div className="bg-card border-b border-border">
        {/* Player 1 */}
        <motion.div 
          className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors"
          whileTap={{ scale: 0.98 }}
          onClick={() => awardPoint(0)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
              {match.playerOne.firstName[0]}
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {playerNames.p1}
                {currentServer === "p1" && (
                  <TennisBall className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {match.playerOne.rating || "Unrated"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">0</div>
          </div>
        </motion.div>

        {/* Player 2 */}
        <motion.div 
          className="flex items-center justify-between p-4 cursor-pointer active:bg-muted/50 transition-colors border-t border-border"
          whileTap={{ scale: 0.98 }}
          onClick={() => awardPoint(1)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
              {match.playerTwo.firstName[0]}
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {playerNames.p2}
                {currentServer === "p2" && (
                  <TennisBall className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {match.playerTwo.rating || "Unrated"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">0</div>
          </div>
        </motion.div>
      </div>

      {/* Game Score */}
      <div className="bg-muted/30 p-6 text-center">
        <motion.div 
          key={getGameScore()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-4xl font-bold text-primary mb-2"
        >
          {getGameScore()}
        </motion.div>
        
        {/* Serve indicators */}
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Button variant="outline" size="sm">First Serve</Button>
          <Button variant="outline" size="sm">Second Serve</Button>
        </div>
      </div>

      {/* Match Tab */}
      <div className="flex-1 p-4">
        <div className="text-center mb-6">
          <Button variant="ghost" className="text-primary font-semibold">
            <Zap className="w-4 h-4 mr-2" />
            Match
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.firstServePercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">1st Serve %</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.firstServePercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">1st Serve %</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.secondServeWinPercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">2nd Serve %</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.secondServeWinPercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">2nd Serve %</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.aces}</div>
            <div className="text-sm text-muted-foreground">Aces</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.aces}</div>
            <div className="text-sm text-muted-foreground">Aces</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.doubleFaults}</div>
            <div className="text-sm text-muted-foreground">Double Faults</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.doubleFaults}</div>
            <div className="text-sm text-muted-foreground">Double Faults</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.winners}</div>
            <div className="text-sm text-muted-foreground">Winners</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.winners}</div>
            <div className="text-sm text-muted-foreground">Winners</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player1.unforcedErrors}</div>
            <div className="text-sm text-muted-foreground">Unforced Errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{matchStats.player2.unforcedErrors}</div>
            <div className="text-sm text-muted-foreground">Unforced Errors</div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex justify-center gap-8">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-primary rounded-full" />
            <span className="text-xs">Match Stats</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-muted rounded-full" />
            <span className="text-xs">Shot Stats</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 bg-muted rounded-full" />
            <span className="text-xs">Match Log</span>
          </Button>
        </div>
      </div>

      {/* Undo Button */}
      {pointLog.length > 0 && (
        <div className="fixed bottom-20 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={undoLastPoint}
            disabled={isUpdating}
            className="rounded-full shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Point Outcome Selection Sheet */}
      <Dialog open={showPointOutcome} onOpenChange={setShowPointOutcome}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm p-6 rounded-lg shadow-xl">
          <h3 className="text-xl font-bold text-center mb-4">How did {pendingPoint?.player === 0 ? playerNames.p1 : playerNames.p2} win the point?</h3>
          
          {/* Outcome Selection */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button 
              className="py-6 text-lg font-semibold"
              onClick={() => savePointWithOutcome("ace", "first")}
            >
              Ace
            </Button>
            <Button 
              className="py-6 text-lg font-semibold"
              onClick={() => savePointWithOutcome("winner", "first")}
            >
              Winner
            </Button>
            <Button 
              className="py-6 text-lg font-semibold"
              onClick={() => savePointWithOutcome("unforced_error", "first")}
            >
              Unforced Error
            </Button>
            <Button 
              className="py-6 text-lg font-semibold"
              onClick={() => savePointWithOutcome("forced_error", "first")}
            >
              Forced Error
            </Button>
          </div>

          {/* Rally Length */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Rally Length:</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">-</Button>
              <span className="text-lg font-bold w-8 text-center">0</span>
              <Button variant="outline" size="sm">+</Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="destructive" 
              className="flex-1 py-3"
              onClick={() => setShowPointOutcome(false)}
            >
              Cancel Point
            </Button>
            <Button 
              className="flex-1 py-3"
              onClick={() => savePointWithOutcome("winner", "first")}
            >
              Save Point
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 