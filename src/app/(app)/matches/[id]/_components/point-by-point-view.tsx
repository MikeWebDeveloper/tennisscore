"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PointDetail as BasePointDetail } from "@/lib/types"
import { Target } from "lucide-react"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"

type PointDetail = BasePointDetail & { isTiebreak?: boolean }

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
}

interface GameData {
  setNumber: number
  gameNumber: number
  server: 'p1' | 'p2'
  winner: 'p1' | 'p2'
  finalGameScore: string
  pointProgression: string[]
  isBreak: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  isTiebreak: boolean
  points: PointDetail[]
}

// Tennis score mapping
const TENNIS_SCORES = ["0", "15", "30", "40"]

function getTennisScore(p1Points: number, p2Points: number): string {
  // Handle deuce and advantage situations
  if (p1Points >= 3 && p2Points >= 3) {
    if (p1Points === p2Points) return "40-40"
    if (p1Points > p2Points) return "AD-40"
    return "40-AD"
  }
  
  // Regular scoring
  const p1Score = TENNIS_SCORES[Math.min(p1Points, 3)] || "40"
  const p2Score = TENNIS_SCORES[Math.min(p2Points, 3)] || "40"
  return `${p1Score}-${p2Score}`
}

function getTiebreakScore(p1Points: number, p2Points: number): string {
  return `${p1Points}-${p2Points}`
}

function processPointLog(pointLog: PointDetail[]): GameData[] {
  if (!pointLog || pointLog.length === 0) return []

  // Group points by game
  const gameGroups: { [key: string]: PointDetail[] } = {}
  
  pointLog.forEach(point => {
    const gameKey = `${point.setNumber}-${point.gameNumber}-${point.isTiebreak ? 'tb' : 'reg'}`
    if (!gameGroups[gameKey]) {
      gameGroups[gameKey] = []
    }
    gameGroups[gameKey].push(point)
  })

  const processedGames: GameData[] = []

  Object.values(gameGroups).forEach(gamePoints => {
    if (gamePoints.length === 0) return

    const firstPoint = gamePoints[0]
    const lastPoint = gamePoints[gamePoints.length - 1]
    const isTiebreak = !!firstPoint.isTiebreak
    
    let p1Points = 0
    let p2Points = 0
    const pointProgression: string[] = []

    // Process each point in the game
    gamePoints.forEach((point, index) => {
      // Add the score BEFORE this point (except for the first point)
      if (index > 0) {
        if (isTiebreak) {
          pointProgression.push(getTiebreakScore(p1Points, p2Points))
        } else {
          pointProgression.push(getTennisScore(p1Points, p2Points))
        }
      }

      // Award the point
      if (point.winner === 'p1') {
        p1Points++
      } else {
        p2Points++
      }
    })

    // Add the final score
    if (isTiebreak) {
      pointProgression.push(getTiebreakScore(p1Points, p2Points))
    } else {
      pointProgression.push(getTennisScore(p1Points, p2Points))
    }

    // Determine final game score (who won the game)
    const gameWinner = lastPoint.winner
    const finalGameScore = gameWinner === 'p1' ? "1-0" : "0-1"

    // Check if this was a break (server lost the game)
    const isBreak = firstPoint.server !== gameWinner

    processedGames.push({
      setNumber: firstPoint.setNumber,
      gameNumber: firstPoint.gameNumber,
      server: firstPoint.server,
      winner: gameWinner,
      finalGameScore,
      pointProgression,
      isBreak,
      isSetPoint: !!lastPoint.isSetPoint,
      isMatchPoint: !!lastPoint.isMatchPoint,
      isTiebreak,
      points: gamePoints
    })
  })

  // Sort games by set and game number
  return processedGames.sort((a, b) => {
    if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber
    return a.gameNumber - b.gameNumber
  })
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const processedGames = processPointLog(pointLog)

  if (processedGames.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No point-by-point data available yet.</p>
        <p className="text-sm mt-2">Start playing to see the point progression!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Point-by-Point</h3>
      </div>
      
      <div className="space-y-3">
        {processedGames.map((game, index) => {
          const serverName = game.server === 'p1' ? playerNames.p1 : playerNames.p2
          const winnerName = game.winner === 'p1' ? playerNames.p1 : playerNames.p2
          
          return (
            <motion.div
              key={`${game.setNumber}-${game.gameNumber}-${game.isTiebreak ? 'tb' : 'reg'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <TennisBallIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {serverName} serving
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {game.isBreak && (
                          <Badge variant="destructive" className="text-xs">
                            BREAK
                          </Badge>
                        )}
                        {game.isSetPoint && (
                          <Badge className="bg-amber-500 text-white text-xs">
                            SET POINT
                          </Badge>
                        )}
                        {game.isMatchPoint && (
                          <Badge className="bg-green-500 text-white text-xs">
                            MATCH POINT
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {game.isTiebreak ? 'Tiebreak' : `Game ${game.gameNumber}`}
                      </div>
                      <div className="font-bold text-lg">
                        <span className={game.winner === 'p1' ? 'text-foreground' : 'text-muted-foreground'}>
                          {winnerName}
                        </span>
                        <span className="text-muted-foreground mx-2">wins</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Point progression:</span>
                    <div className="mt-1 font-mono text-xs">
                      {game.pointProgression.length > 0 ? (
                        game.pointProgression.join(" → ")
                      ) : (
                        "No progression data"
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 