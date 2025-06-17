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

interface GameResult {
  gameNumber: number
  setNumber: number
  winner: 'p1' | 'p2'
  pointProgression: string[]
  finalScore: string
  isBreakGame?: boolean
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  if (pointLog.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">No point-by-point data available</p>
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

  // Process each game to show progression
  Object.entries(gameGroups).forEach(([gameKey, points]) => {
    const [setNumber, gameNumber] = gameKey.split('-').map(Number)
    const lastPoint = points[points.length - 1]
    
    // Simulate point progression (simplified for display)
    const pointProgression: string[] = []
    let p1Points = 0
    let p2Points = 0
    
    points.forEach((point) => {
      if (point.winner === 'p1') {
        p1Points++
      } else {
        p2Points++
      }
      
      // Convert to tennis scoring
      const getDisplayScore = (p1: number, p2: number) => {
        if (p1 < 3 && p2 < 3) {
          const scoreMap = ['0', '15', '30']
          return `${scoreMap[p1] || '40'}, ${scoreMap[p2] || '40'}`
        }
        if (p1 >= 3 && p2 >= 3) {
          if (p1 === p2) return 'Deuce'
          return p1 > p2 ? `Ad ${playerNames.p1.split(' ')[0]}` : `Ad ${playerNames.p2.split(' ')[0]}`
        }
        const scoreMap = ['0', '15', '30', '40']
        return `${scoreMap[Math.min(p1, 3)]}, ${scoreMap[Math.min(p2, 3)]}`
      }
      
      pointProgression.push(getDisplayScore(p1Points, p2Points))
    })

    // Determine if this was a break game (server lost)
    const isBreakGame = (points[0]?.server !== lastPoint.winner)

    gameResults.push({
      gameNumber,
      setNumber,
      winner: lastPoint.winner,
      pointProgression,
      finalScore: lastPoint.gameScore || `${gameNumber}`,
      isBreakGame
    })
  })

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="h-5 w-5 text-primary" />
          POINT BY POINT - SET 1
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
                 {gameResults.slice(-8).map((game, index) => {
           const winnerName = game.winner === 'p1' ? playerNames.p1 : playerNames.p2
          
          return (
            <motion.div
              key={`${game.setNumber}-${game.gameNumber}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-slate-800 rounded-lg p-4 ${
                game.isBreakGame ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{game.gameNumber}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">
                      {winnerName.split(' ')[0]} wins
                      {game.isBreakGame && (
                        <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary">
                          BREAK
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-400 text-sm">Game {game.gameNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold text-lg">
                    {game.winner === 'p1' ? '1' : '0'} - {game.winner === 'p2' ? '1' : '0'}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {game.pointProgression.length > 0 
                      ? game.pointProgression.slice(-1)[0] || '15, 30, 40'
                      : '15, 30, 40'
                    }
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
        
        {gameResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No games completed yet</p>
          </div>
        )}
        
        {gameResults.length > 8 && (
          <div className="text-center pt-4">
            <p className="text-slate-500 text-sm">
              Showing last 8 games • {gameResults.length} total games
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 