"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PointDetail } from "@/lib/types"
import { Target } from "lucide-react"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
  matchFormat?: {
    noAd?: boolean
    tiebreak?: boolean
    shortSets?: boolean
  }
}

interface PointProgression {
  p1Score: string
  p2Score: string
  pointWinner: 'p1' | 'p2'
}

interface GameResult {
  gameNumber: number
  setNumber: number
  winner: 'p1' | 'p2'
  pointProgression: PointProgression[]
  finalGameScore: string
  isBreakGame?: boolean
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  if (pointLog.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No point-by-point data available</p>
        </CardContent>
      </Card>
    )
  }

  // Group points by games and analyze progression
  const gameResults: GameResult[] = []
  const gameGroups = pointLog.reduce((groups, point) => {
    const gameKey = `${point.setNumber}-${point.gameNumber}`
    if (!groups[gameKey]) {
      groups[gameKey] = []
    }
    groups[gameKey].push(point)
    return groups
  }, {} as Record<string, PointDetail[]>)

  // Convert tennis points to display score
  const getTennisScore = (points: number): string => {
    switch (points) {
      case 0: return "0"
      case 1: return "15"
      case 2: return "30"
      case 3: return "40"
      default: return "40"
    }
  }

  // Process each game to show progression
  Object.entries(gameGroups).forEach(([gameKey, points]) => {
    const [setNumber, gameNumber] = gameKey.split('-').map(Number)
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    
    // Simulate point progression with actual tennis scoring
    const pointProgression: PointProgression[] = []
    let p1Points = 0
    let p2Points = 0
    
    points.forEach((point) => {
      if (point.winner === 'p1') {
        p1Points++
      } else {
        p2Points++
      }
      
      // Handle deuce situation
      let p1Display: string
      let p2Display: string
      
      if (p1Points >= 3 && p2Points >= 3) {
        if (p1Points === p2Points) {
          p1Display = "DEUCE"
          p2Display = "DEUCE"
        } else if (p1Points > p2Points) {
          p1Display = "AD"
          p2Display = ""
        } else {
          p1Display = ""
          p2Display = "AD"
        }
      } else {
        p1Display = getTennisScore(p1Points)
        p2Display = getTennisScore(p2Points)
      }
      
      pointProgression.push({
        p1Score: p1Display,
        p2Score: p2Display,
        pointWinner: point.winner
      })
    })

    // Determine if this was a break game (server lost)
    const isBreakGame = (firstPoint?.server !== lastPoint.winner)

    gameResults.push({
      gameNumber,
      setNumber,
      winner: lastPoint.winner,
      pointProgression,
      finalGameScore: `${playerNames[lastPoint.winner === 'p1' ? 'p1' : 'p2'].split(' ')[0]} wins`,
      isBreakGame
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          POINT BY POINT - SET 1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
                 {gameResults.slice(-8).map((game, index) => {
          
          return (
            <motion.div
              key={`${game.setNumber}-${game.gameNumber}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-muted/50 rounded-lg p-4 ${
                game.isBreakGame ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{game.gameNumber}</span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {game.finalGameScore}
                      {game.isBreakGame && (
                        <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary">
                          BREAK
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm">Game {game.gameNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-lg">
                    {game.winner === 'p1' ? '1' : '0'} - {game.winner === 'p2' ? '1' : '0'}
                  </div>
                  <div className="text-muted-foreground text-sm font-mono">
                    {game.pointProgression.length > 0 ? (
                      (() => {
                        const lastPoint = game.pointProgression[game.pointProgression.length - 1]
                        if (lastPoint.p1Score === "DEUCE" && lastPoint.p2Score === "DEUCE") {
                          return "DEUCE"
                        }
                        if (lastPoint.p1Score === "AD") {
                          return `AD ${playerNames.p1.split(' ')[0]}`
                        }
                        if (lastPoint.p2Score === "AD") {
                          return `AD ${playerNames.p2.split(' ')[0]}`
                        }
                        return `${lastPoint.p1Score} - ${lastPoint.p2Score}`
                      })()
                    ) : (
                      "0 - 0"
                    )}
                  </div>
                </div>
              </div>
              
              {/* Point progression details */}
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">Point progression:</div>
                <div className="flex flex-wrap gap-1">
                  {game.pointProgression.slice(0, 8).map((point, pointIndex) => {
                    let scoreDisplay = ""
                    if (point.p1Score === "DEUCE" && point.p2Score === "DEUCE") {
                      scoreDisplay = "DEUCE"
                    } else if (point.p1Score === "AD") {
                      scoreDisplay = `AD-${playerNames.p1.split(' ')[0]}`
                    } else if (point.p2Score === "AD") {
                      scoreDisplay = `AD-${playerNames.p2.split(' ')[0]}`
                    } else {
                      scoreDisplay = `${point.p1Score}-${point.p2Score}`
                    }
                    
                    return (
                      <Badge 
                        key={pointIndex}
                        variant="outline" 
                        className={`text-xs ${
                          point.pointWinner === 'p1' 
                            ? 'bg-primary/10 text-primary border-primary' 
                            : 'bg-destructive/10 text-destructive border-destructive'
                        }`}
                      >
                        {scoreDisplay}
                      </Badge>
                    )
                  })}
                  {game.pointProgression.length > 8 && (
                    <span className="text-xs text-muted-foreground">...</span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
        
        {gameResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No games completed yet</p>
          </div>
        )}
        
        {gameResults.length > 8 && (
          <div className="text-center pt-4">
            <p className="text-muted-foreground text-sm">
              Showing last 8 games • {gameResults.length} total games
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 