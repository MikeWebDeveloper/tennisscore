"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { PointDetail } from "@/lib/types"
import { Target } from "lucide-react"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
}

interface GameGroup {
  setNumber: number
  gameNumber: number
  server: 'p1' | 'p2'
  winner: 'p1' | 'p2'
  scoreInGame: { p1: number; p2: number }
  scoreAfterGame: { p1: number; p2: number }
  pointProgression: string[]
  isBreak: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
}

// Tennis score mapping
const scoreMap: { [key: number]: string } = { 0: "0", 1: "15", 2: "30", 3: "40" }

function getPointScore(p1: number, p2: number, noAd: boolean = false): string {
  if (p1 >= 3 && p2 >= 3) {
    if (p1 === p2) return "40:40"
    if (noAd) return p1 > p2 ? "Winner" : "Loser"
    if (p1 > p2) return "AD:40"
    return "40:AD"
  }
  return `${scoreMap[p1] || '40'}:${scoreMap[p2] || '40'}`
}

function processPointLog(pointLog: PointDetail[]): GameGroup[] {
  const gameGroups: GameGroup[] = []
  if (!pointLog || pointLog.length === 0) return gameGroups

  const games = pointLog.reduce((acc, point) => {
    const key = `set${point.setNumber}-game${point.gameNumber}`
    if (!acc[key]) acc[key] = []
    acc[key].push(point)
    return acc
  }, {} as Record<string, PointDetail[]>)

  for (const key in games) {
    const gamePoints = games[key]
    const firstPoint = gamePoints[0]
    const lastPoint = gamePoints[gamePoints.length - 1]
    
    let p1GamePts = 0, p2GamePts = 0
    const pointProgression: string[] = []
    
    for (let i = 0; i < gamePoints.length; i++) {
      const point = gamePoints[i]
      
      // The progression shows the score *before* the point is played
      pointProgression.push(getPointScore(p1GamePts, p2GamePts))

      if (point.winner === 'p1') {
        p1GamePts++
      } else {
        p2GamePts++
      }
    }
    
    // Determine set score *after* this game
    const currentSetGames = gameGroups.filter(g => g.setNumber === firstPoint.setNumber)
    let p1GamesInSet = currentSetGames.filter(g => g.winner === 'p1').length
    let p2GamesInSet = currentSetGames.filter(g => g.winner === 'p2').length
    if (lastPoint.winner === 'p1') {
      p1GamesInSet++
    } else {
      p2GamesInSet++
    }

    const isSetOver = (p1GamesInSet >= 6 && p1GamesInSet - p2GamesInSet >= 2) || (p2GamesInSet >= 6 && p2GamesInSet - p1GamesInSet >= 2) || p1GamesInSet === 7 || p2GamesInSet === 7

    gameGroups.push({
      setNumber: firstPoint.setNumber,
      gameNumber: firstPoint.gameNumber,
      server: firstPoint.server,
      winner: lastPoint.winner,
      scoreInGame: { p1: p1GamePts, p2: p2GamePts },
      scoreAfterGame: { p1: p1GamesInSet, p2: p2GamesInSet },
      pointProgression,
      isBreak: firstPoint.server !== lastPoint.winner,
      isSetPoint: !!lastPoint.isSetPoint,
      isMatchPoint: !!lastPoint.isMatchPoint,
    })
    
    if (isSetOver) {
      // This logic is for tracking sets, which we are not displaying per-game anymore.
      // Keeping it here in case we need it later, but commenting out to fix linter.
      // if (p1GamesInSet > p2GamesInSet) {
      //   p1Sets++
      // } else {
      //   p2Sets++
      // }
    }
  }
  return gameGroups
}

export function PointByPointView({ pointLog }: PointByPointViewProps) {
  const processedGames = processPointLog(pointLog)

  if (processedGames.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No point-by-point data available.
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 font-sans">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 px-2">
        <Target className="w-5 h-5 text-primary" />
        Point History
      </h3>
      <div className="space-y-1">
        {processedGames.map((game, index) => {
          const isP1Winner = game.winner === 'p1'
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b last:border-b-0 py-3"
            >
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  {game.isBreak && <Badge variant="destructive" className="text-xs">BREAK</Badge>}
                  {game.isSetPoint && <Badge className="bg-amber-500 text-white text-xs">SET</Badge>}
                  {game.isMatchPoint && <Badge className="bg-green-500 text-white text-xs">MATCH</Badge>}
                </div>
                <div className="flex items-center gap-3 font-mono text-lg font-bold">
                  <div className={`flex items-center gap-1.5 ${isP1Winner ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {game.server === 'p1' && <Target className="w-4 h-4 text-primary" />}
                    <span>{game.scoreAfterGame.p1}</span>
                  </div>
                  <span>-</span>
                  <div className={`flex items-center gap-1.5 ${!isP1Winner ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <span>{game.scoreAfterGame.p2}</span>
                    {game.server === 'p2' && <Target className="w-4 h-4 text-primary" />}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono px-2 mt-1">
                {game.pointProgression.join(" , ")}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 