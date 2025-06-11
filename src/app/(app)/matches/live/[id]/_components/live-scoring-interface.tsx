"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  Undo2, 
  Share2, 
  Settings, 
  Trophy,
  ArrowLeft,
  MessageSquare,
  Camera
} from "lucide-react"
import { toast } from "sonner"
import { updateMatchScore } from "@/lib/actions/matches"
import { Player } from "@/lib/types"

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
  }
  user: any
}

export function LiveScoringInterface({ match, user }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const [score, setScore] = useState(match.scoreParsed || {
    sets: [],
    games: [0, 0],
    points: [0, 0]
  })
  const [pointLog, setPointLog] = useState<any[]>([])
  const [detailedLogging, setDetailedLogging] = useState(false)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [pendingPoint, setPendingPoint] = useState<{ player: number } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const getPointDisplay = (points: number) => {
    if (match.matchFormatParsed?.noAd) {
      return points.toString()
    }
    
    const pointNames = ["0", "15", "30", "40"]
    
    if (points < 4) {
      return pointNames[points]
    }
    
    // Handle deuce and advantage
    const otherPlayer = points === 0 ? 1 : 0
    const otherPoints = score.points[otherPlayer]
    
    if (otherPoints < 3) {
      return "40"
    }
    
    if (points === otherPoints) {
      return "40" // Deuce
    }
    
    return points > otherPoints ? "AD" : "40"
  }

  const isGameWon = (playerIndex: number) => {
    const points = score.points[playerIndex]
    const opponentPoints = score.points[playerIndex === 0 ? 1 : 0]
    
    if (match.matchFormatParsed?.noAd) {
      return points >= 4 && points > opponentPoints
    }
    
    return points >= 4 && (points - opponentPoints) >= 2
  }

  const isSetWon = (playerIndex: number) => {
    const games = score.games[playerIndex]
    const opponentGames = score.games[playerIndex === 0 ? 1 : 0]
    
    return games >= 6 && (games - opponentGames) >= 2
  }

  const isMatchWon = (playerIndex: number) => {
    const setsWon = score.sets.filter(set => 
      playerIndex === 0 ? set.p1 > set.p2 : set.p2 > set.p1
    ).length
    
    return setsWon >= Math.ceil(match.matchFormatParsed?.sets / 2)
  }

  const awardPoint = async (playerIndex: number) => {
    if (match.status === "Completed") return
    
    setIsUpdating(true)
    
    const newScore = { ...score }
    newScore.points[playerIndex]++
    
    let gameWon = false
    let setWon = false
    let matchWon = false
    
    // Check if game is won
    if (isGameWon(playerIndex)) {
      newScore.games[playerIndex]++
      newScore.points = [0, 0]
      gameWon = true
      
      // Check if set is won
      if (isSetWon(playerIndex)) {
        newScore.sets.push({
          p1: newScore.games[0],
          p2: newScore.games[1]
        })
        newScore.games = [0, 0]
        setWon = true
        
        // Check if match is won
        if (isMatchWon(playerIndex)) {
          matchWon = true
        }
      }
    }
    
    setScore(newScore)
    
    const newPointLog = [...pointLog, {
      timestamp: new Date().toISOString(),
      winner: playerIndex === 0 ? "p1" : "p2",
      score: { ...newScore },
      gameWon,
      setWon,
      matchWon
    }]
    
    setPointLog(newPointLog)
    
    // If detailed logging is enabled and not match-ending point, show detail sheet
    if (detailedLogging && !matchWon) {
      setPendingPoint({ player: playerIndex })
      setShowDetailSheet(true)
    } else {
      // Save to server
      await saveScore(newScore, newPointLog, matchWon, playerIndex)
    }
    
    setIsUpdating(false)
  }

  const saveScore = async (newScore: any, newPointLog: any[], matchWon: boolean, winnerIndex?: number) => {
    try {
      const updateData = {
        score: newScore,
        pointLog: newPointLog,
        ...(matchWon && {
          status: "Completed" as const,
          winnerId: winnerIndex === 0 ? match.playerOne.$id : match.playerTwo.$id
        })
      }
      
      const result = await updateMatchScore(match.$id, updateData)
      
      if (result.error) {
        toast.error(result.error)
      }
      
      if (matchWon) {
        toast.success(`Match completed! ${winnerIndex === 0 ? match.playerOne.firstName : match.playerTwo.firstName} wins!`)
      }
    } catch (error) {
      toast.error("Failed to save score")
    }
  }

  const undoLastPoint = () => {
    if (pointLog.length === 0) return
    
    const lastPoint = pointLog[pointLog.length - 1]
    const newPointLog = pointLog.slice(0, -1)
    
    // Restore the previous score state
    if (newPointLog.length > 0) {
      setScore(newPointLog[newPointLog.length - 1].score)
    } else {
      setScore({
        sets: [],
        games: [0, 0],
        points: [0, 0]
      })
    }
    
    setPointLog(newPointLog)
    toast.success("Point undone")
  }

  const shareMatch = () => {
    const shareUrl = `${window.location.origin}/live/${match.$id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied to clipboard!")
  }

  const getPlayerName = (player: Player) => `${player.firstName} ${player.lastName}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={shareMatch}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Photo
          </Button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-muted/30 p-6 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{getPlayerName(match.playerOne)}</h2>
              <div className="flex items-center justify-center gap-4">
                {/* Sets */}
                {score.sets.map((set, index) => (
                  <span key={index} className="text-lg font-mono">
                    {set.p1}
                  </span>
                ))}
                {/* Current Games */}
                <span className="text-2xl font-mono font-bold">
                  {score.games[0]}
                </span>
                {/* Current Points */}
                <span className="text-3xl font-mono font-bold text-primary">
                  {getPointDisplay(score.points[0])}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{getPlayerName(match.playerTwo)}</h2>
              <div className="flex items-center justify-center gap-4">
                {/* Sets */}
                {score.sets.map((set, index) => (
                  <span key={index} className="text-lg font-mono">
                    {set.p2}
                  </span>
                ))}
                {/* Current Games */}
                <span className="text-2xl font-mono font-bold">
                  {score.games[1]}
                </span>
                {/* Current Points */}
                <span className="text-3xl font-mono font-bold text-primary">
                  {getPointDisplay(score.points[1])}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scoring Area */}
      <div className="flex-1 grid grid-cols-2">
        {/* Player 1 Tap Area */}
        <motion.button
          className="bg-blue-500/10 hover:bg-blue-500/20 transition-colors border-r border-border flex items-center justify-center disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
          onClick={() => awardPoint(0)}
          disabled={isUpdating || match.status === "Completed"}
        >
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{getPlayerName(match.playerOne)}</div>
            <div className="text-muted-foreground">Tap to award point</div>
          </div>
        </motion.button>

        {/* Player 2 Tap Area */}
        <motion.button
          className="bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
          onClick={() => awardPoint(1)}
          disabled={isUpdating || match.status === "Completed"}
        >
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{getPlayerName(match.playerTwo)}</div>
            <div className="text-muted-foreground">Tap to award point</div>
          </div>
        </motion.button>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t bg-muted/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="detailed-logging"
                checked={detailedLogging}
                onCheckedChange={setDetailedLogging}
              />
              <Label htmlFor="detailed-logging">Detailed Stats</Label>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={undoLastPoint}
            disabled={pointLog.length === 0 || isUpdating}
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
          </Button>
        </div>
      </div>

      {/* Detailed Point Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Point Details</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <p>Add detailed point information here...</p>
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={() => {
                  setShowDetailSheet(false)
                  setPendingPoint(null)
                }}
                className="flex-1"
              >
                Save Point
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowDetailSheet(false)
                  setPendingPoint(null)
                }}
                className="flex-1"
              >
                Simple Point
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {match.status === "Completed" && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card p-8 rounded-lg shadow-lg border text-center max-w-md"
          >
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Match Complete!</h2>
            <p className="text-muted-foreground mb-4">
              Congratulations on a great match!
            </p>
            <Button onClick={() => router.push("/matches")} className="w-full">
              View All Matches
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
} 