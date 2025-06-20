"use client"

import { motion } from "framer-motion"
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
  winner?: 'p1' | 'p2'
  pointProgression: { score: string; indicators: string[] }[]
  gameScore?: string
  isBreak?: boolean
  isTiebreak: boolean
  isCompleted: boolean
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

  // Sort points by their natural order first
  const sortedPoints = [...pointLog].sort((a, b) => {
    if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber
    if (a.gameNumber !== b.gameNumber) return a.gameNumber - b.gameNumber
    return a.pointNumber - b.pointNumber
  })

  // Group points by set and game
  const setGroups: { [setNumber: number]: { [gameNumber: number]: PointDetail[] } } = {}
  
  sortedPoints.forEach(point => {
    if (!setGroups[point.setNumber]) {
      setGroups[point.setNumber] = {}
    }
    if (!setGroups[point.setNumber][point.gameNumber]) {
      setGroups[point.setNumber][point.gameNumber] = []
    }
    setGroups[point.setNumber][point.gameNumber].push(point)
  })

  const processedSets: SetData[] = []

  // Process each set
  Object.keys(setGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(setNumberStr => {
    const setNumber = parseInt(setNumberStr)
    const gamesInSet = setGroups[setNumber]
    const processedGames: GameData[] = []

    // Track cumulative game scores for this set
    let p1GamesWon = 0
    let p2GamesWon = 0

    const gameKeys = Object.keys(gamesInSet).sort((a, b) => parseInt(a) - parseInt(b));
    
    gameKeys.forEach(gameNumberStr => {
        const gameNumber = parseInt(gameNumberStr);
        const gamePoints = gamesInSet[gameNumber].sort((a, b) => a.pointNumber - b.pointNumber);
        if (gamePoints.length === 0) return;

        const firstPoint = gamePoints[0];
        const isTiebreak = !!firstPoint.isTiebreak;
        const gameWinningPoint = gamePoints.find(p => p.isGameWinning);
        const isCompleted = !!gameWinningPoint;
        
        const pointProgression: { score: string; indicators: string[] }[] = [];
        let p1Points = 0;
        let p2Points = 0;

        gamePoints.forEach(point => {
            if (point.winner === 'p1') p1Points++;
            else p2Points++;
            
            const scoreAfterPoint = isTiebreak ? 
              getTiebreakScore(p1Points, p2Points) : 
              getTennisScore(p1Points, p2Points);
            
            const indicators: string[] = [];
            if (point.isBreakPoint) indicators.push("BP");
            if (point.isSetPoint) indicators.push("SP");
            if (point.isMatchPoint) indicators.push("MP");
            pointProgression.push({ score: scoreAfterPoint, indicators });
        });

        let gameWinner: 'p1' | 'p2' | undefined;
        let gameScore: string | undefined;
        let isBreak: boolean | undefined;

        if (isCompleted && gameWinningPoint) {
            gameWinner = gameWinningPoint.winner;
            if (gameWinner === 'p1') p1GamesWon++;
            else p2GamesWon++;
            gameScore = `${p1GamesWon}-${p2GamesWon}`;
            isBreak = firstPoint.server !== gameWinner;
        }

        processedGames.push({
            setNumber: firstPoint.setNumber,
            gameNumber: firstPoint.gameNumber,
            server: firstPoint.server,
            winner: gameWinner,
            pointProgression,
            gameScore,
            isBreak,
            isTiebreak,
            isCompleted
        });
    });

    processedSets.push({
      setNumber,
      games: processedGames,
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
                      {serverName} serving
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">
                    {game.isTiebreak ? 'Tiebreak' : `Game ${game.gameNumber}`}
                  </span>
                </div>
              </div>

              {/* Point Progression - Single elegant line with indicators and bold final score */}
              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground space-x-2">
                  {game.pointProgression.map((point, index) => (
                    <span key={index} className="inline-flex items-baseline gap-1">
                      <span className="text-foreground">{point.score}</span>
                      {point.indicators.length > 0 && (
                        <span className="text-xs space-x-1">
                          {point.indicators.map((indicator, i) => (
                            <span 
                              key={i}
                              className={
                                indicator === "BP" ? "text-orange-500" :
                                indicator === "SP" ? "text-blue-500" :
                                indicator === "MP" ? "text-red-500" : ""
                              }
                            >
                              {indicator}
                            </span>
                          ))}
                        </span>
                      )}
                      {index < game.pointProgression.length - 1 && (
                        <span className="text-muted-foreground"> → </span>
                      )}
                    </span>
                  ))}
                  {game.isCompleted && game.gameScore && (
                    <>
                      <span className="text-muted-foreground ml-2">→</span>
                      <span className="font-bold text-foreground ml-2 text-base">
                        {game.isTiebreak ? `Set ${game.gameScore}` : game.gameScore}
                        {game.isBreak && !game.isTiebreak && (
                          <span className="text-xs text-red-500 ml-1">(BREAK)</span>
                        )}
                      </span>
                    </>
                  )}
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