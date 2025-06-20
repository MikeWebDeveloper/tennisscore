"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointDetail as BasePointDetail } from "@/lib/types"
import { Target } from "lucide-react"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useState } from "react"

type PointDetail = BasePointDetail & { isTiebreak?: boolean }

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
}

interface SetData {
  setNumber: number
  games: GameData[]
}

interface GameData {
  setNumber: number
  gameNumber: number
  server: 'p1' | 'p2'
  winner: 'p1' | 'p2'
  pointProgression: string[]
  gameScore: string // e.g., "1-0", "1-1", etc.
  isBreak: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  isTiebreak: boolean
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

function processPointLogBySets(pointLog: PointDetail[]): SetData[] {
  if (!pointLog || pointLog.length === 0) return []

  // Group points by set and game
  const setGroups: { [setNumber: number]: { [gameKey: string]: PointDetail[] } } = {}
  
  pointLog.forEach(point => {
    if (!setGroups[point.setNumber]) {
      setGroups[point.setNumber] = {}
    }
    
    const gameKey = `${point.gameNumber}-${point.isTiebreak ? 'tb' : 'reg'}`
    if (!setGroups[point.setNumber][gameKey]) {
      setGroups[point.setNumber][gameKey] = []
    }
    setGroups[point.setNumber][gameKey].push(point)
  })

  const processedSets: SetData[] = []

  // Process each set
  Object.keys(setGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(setNumberStr => {
    const setNumber = parseInt(setNumberStr)
    const gameGroups = setGroups[setNumber]
    const processedGames: GameData[] = []

    // Track cumulative game scores for this set
    let p1GamesWon = 0
    let p2GamesWon = 0

    // Sort games by game number to process them in order
    const sortedGameEntries = Object.entries(gameGroups).sort(([keyA], [keyB]) => {
      const gameNumA = parseInt(keyA.split('-')[0])
      const gameNumB = parseInt(keyB.split('-')[0])
      return gameNumA - gameNumB
    })

    // Process each game in the set
    sortedGameEntries.forEach(([, gamePoints]) => {
      if (gamePoints.length === 0) return

      const firstPoint = gamePoints[0]
      const lastPoint = gamePoints[gamePoints.length - 1]
      const isTiebreak = !!firstPoint.isTiebreak
      
      let p1Points = 0
      let p2Points = 0
      const pointProgression: string[] = []

      // Process each point in the game to build progression
      gamePoints.forEach((point) => {
        // Award the point
        if (point.winner === 'p1') {
          p1Points++
        } else {
          p2Points++
        }

        // Store the score AFTER this point (this is the key fix!)
        const scoreAfterPoint = isTiebreak 
          ? getTiebreakScore(p1Points, p2Points)
          : getTennisScore(p1Points, p2Points)

        pointProgression.push(scoreAfterPoint)
      })

      // Add "Game" at the end if it's not a tiebreak
      if (!isTiebreak) {
        pointProgression.push("Game")
      }

      // Determine game winner and update cumulative score
      const gameWinner = lastPoint.winner
      if (gameWinner === 'p1') {
        p1GamesWon++
      } else {
        p2GamesWon++
      }

      // Create cumulative game score string
      const gameScore = `${p1GamesWon}-${p2GamesWon}`
      
      // A break occurs when the receiving player wins the entire game
      const isBreak = firstPoint.server !== gameWinner

      processedGames.push({
        setNumber: firstPoint.setNumber,
        gameNumber: firstPoint.gameNumber,
        server: firstPoint.server,
        winner: gameWinner,
        pointProgression,
        gameScore,
        isBreak,
        isSetPoint: !!lastPoint.isSetPoint,
        isMatchPoint: !!lastPoint.isMatchPoint,
        isTiebreak
      })
    })

    processedSets.push({
      setNumber,
      games: processedGames
    })
  })

  return processedSets.sort((a, b) => a.setNumber - b.setNumber)
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const processedSets = processPointLogBySets(pointLog)
  const [selectedSet, setSelectedSet] = useState<number>(1)

  if (processedSets.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No point-by-point data available yet.</p>
        <p className="text-sm mt-2">Start playing to see the point progression!</p>
      </div>
    )
  }

  // Get the current set data
  const currentSetData = processedSets.find(set => set.setNumber === selectedSet) || processedSets[0]

  return (
    <div className="space-y-4">
      {/* Set Selection Tabs */}
      {processedSets.length > 1 && (
        <Tabs value={`set-${selectedSet}`} onValueChange={(value) => {
          const setNum = parseInt(value.replace('set-', ''))
          setSelectedSet(setNum)
        }}>
          <TabsList className="grid grid-cols-3 w-full">
            {processedSets.map((set) => (
              <TabsTrigger key={`set-${set.setNumber}`} value={`set-${set.setNumber}`} className="text-xs">
                SET {set.setNumber}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Point by Point Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            POINT BY POINT - SET {selectedSet}
          </h3>
        </div>
      </div>

      {/* Games in Selected Set */}
      <div className="space-y-3">
        {currentSetData?.games.map((game) => {
          const serverName = game.server === 'p1' ? playerNames.p1 : playerNames.p2
          
          return (
            <motion.div
              key={`${game.setNumber}-${game.gameNumber}-${game.isTiebreak ? 'tb' : 'reg'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 bg-card"
            >
              {/* Game Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TennisBallIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {serverName.split(' ')[0]} serving
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {game.isBreak && (
                      <Badge variant="destructive" className="text-xs px-2 py-0">
                        BREAK
                      </Badge>
                    )}
                    {game.isSetPoint && (
                      <Badge className="bg-amber-500 text-white text-xs px-2 py-0">
                        SET POINT
                      </Badge>
                    )}
                    {game.isMatchPoint && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-0">
                        MATCH POINT
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {game.isTiebreak ? 'Tiebreak' : `Game ${game.gameNumber}`} • 
                  </span>
                  <span className="font-bold text-lg ml-1">
                    {game.gameScore}
                  </span>
                </div>
              </div>

              {/* Point Progression - Single elegant line */}
              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground">
                  {game.pointProgression.join(' → ')}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Show message if no games in current set */}
      {(!currentSetData || currentSetData.games.length === 0) && (
        <div className="text-center text-muted-foreground py-8">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No games played in Set {selectedSet} yet.</p>
        </div>
      )}
    </div>
  )
} 