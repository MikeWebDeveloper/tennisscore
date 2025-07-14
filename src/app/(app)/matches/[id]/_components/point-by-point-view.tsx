"use client"

import { Badge } from "@/components/ui/badge"
import React from "react"
import { PointDetail } from "@/lib/types"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useTranslations } from "@/hooks/use-translations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isBreakPoint, isSetPoint, isMatchPoint } from "@/lib/utils/tennis-scoring"
import { MatchFormat } from "@/stores/matchStore"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames?: {
    p1: string
    p2: string
    p3?: string
    p4?: string
  }
}

const getGameScoreAfterGame = (gamePoints: PointDetail[], allPoints: PointDetail[]) => {
    // Count all games won up to this point
    let p1Games = 0, p2Games = 0;
    const currentSetNumber = gamePoints[0]?.setNumber || 1;
    
    // Count games won in previous sets and current set
    for(const point of allPoints) {
        // Stop if we've gone past this game
        if(point.setNumber > currentSetNumber || 
           (point.setNumber === currentSetNumber && point.gameNumber > gamePoints[0].gameNumber)) {
            break;
        }
        
        if(point.isGameWinning) {
            // Only count games in the current set
            if(point.setNumber === currentSetNumber) {
                if(point.winner === 'p1') p1Games++;
                else p2Games++;
            }
        }
    }
    
    return { p1: p1Games, p2: p2Games };
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const t = useTranslations()
  
  // playerNames is available for future enhancements but not currently used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = playerNames

  if (!pointLog || pointLog.length === 0) {
    return <div className="text-center text-muted-foreground p-8">{t('noPointDataAvailable')}</div>
  }

  // Determine who started serving the match from the first point
  const matchStartingServer = pointLog[0]?.server || 'p1'
  
  // Group points by set
  const pointsBySets = pointLog.reduce((acc, point) => {
    const setNumber = point.setNumber
    if (!acc[setNumber]) acc[setNumber] = []
    acc[setNumber].push(point)
    return acc
  }, {} as Record<number, PointDetail[]>)

  const setNumbers = Object.keys(pointsBySets).map(Number).sort((a, b) => a - b)
  const defaultSet = setNumbers[setNumbers.length - 1]?.toString() || "1"

  return (
    <Tabs defaultValue={defaultSet} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${setNumbers.length}, 1fr)` }}>
        {setNumbers.map(setNumber => (
          <TabsTrigger key={setNumber} value={setNumber.toString()}>
            {t('set')} {setNumber}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {setNumbers.map(setNumber => {
        const setPoints = pointsBySets[setNumber]
        
        // Group points by game within this set
        const pointsByGame = setPoints.reduce((acc, point) => {
          const gameKey = `game-${point.gameNumber}`
          if (!acc[gameKey]) acc[gameKey] = []
          acc[gameKey].push(point)
          return acc
        }, {} as Record<string, PointDetail[]>)
        
        return (
          <TabsContent key={setNumber} value={setNumber.toString()} className="space-y-1 mt-4">
            {Object.entries(pointsByGame)
              .sort(([, a], [, b]) => {
                // Sort games in descending order (latest game first)
                const gameNumA = a[0]?.gameNumber || 0
                const gameNumB = b[0]?.gameNumber || 0
                return gameNumB - gameNumA
              })
              .map(([gameKey, pointsInGame]) => {
                const firstPoint = pointsInGame[0];
                if (!firstPoint) return null;

                const lastPoint = pointsInGame[pointsInGame.length - 1];
                const isBreak = lastPoint.isGameWinning && lastPoint.server !== lastPoint.winner;
                const finalGameScore = getGameScoreAfterGame(pointsInGame, pointLog);
                
                // Determine the correct server for this game based on tennis rules
                // Server alternates every game within a set
                // Between sets: player who served SECOND in previous set serves FIRST in next set
                const currentGameNumber = firstPoint.gameNumber;
                const currentSetNumber = firstPoint.setNumber;
                
                let correctServer: 'p1' | 'p2';
                
                if (currentSetNumber === 1) {
                  // First set: use match starting server and alternate within the set
                  const gamesIntoSet = currentGameNumber - 1;
                  correctServer = matchStartingServer === 'p1' 
                    ? (gamesIntoSet % 2 === 0 ? 'p1' : 'p2')
                    : (gamesIntoSet % 2 === 0 ? 'p2' : 'p1');
                } else {
                  // For sets after the first, determine who served last in the previous set
                  const previousSetPoints = pointsBySets[currentSetNumber - 1] || [];
                  const lastGameInPreviousSet = Math.max(...previousSetPoints.map(p => p.gameNumber));
                  const lastPointOfPreviousSet = previousSetPoints
                    .filter(p => p.gameNumber === lastGameInPreviousSet)
                    .pop();
                  
                  // The player who served SECOND in the previous set serves FIRST in this set
                  const previousSetLastServer = lastPointOfPreviousSet?.server || matchStartingServer;
                  const newSetStartingServer = previousSetLastServer === 'p1' ? 'p2' : 'p1';
                  
                  // Now alternate within this set starting with the new set starting server
                  const gamesIntoSet = currentGameNumber - 1;
                  correctServer = newSetStartingServer === 'p1'
                    ? (gamesIntoSet % 2 === 0 ? 'p1' : 'p2')
                    : (gamesIntoSet % 2 === 0 ? 'p2' : 'p1');
                }

                return (
                  <div key={gameKey} className="py-4 px-2 border-b border-border/50 text-center">
                    <div className="flex items-center justify-center w-full">
                      <div className="flex-1 text-right">
                        {correctServer === 'p1' && (
                          <div className="inline-flex items-center gap-2 justify-end">
                            {isBreak && <Badge variant="destructive" className="text-xs font-bold bg-red-600">{t('lostServe')}</Badge>}
                            <TennisBallIcon isServing={true} className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 font-mono text-3xl font-bold px-4">
                        <span>{finalGameScore.p1}</span>
                        <span className="text-muted-foreground">-</span>
                        <span>{finalGameScore.p2}</span>
                      </div>
                      <div className="flex-1 text-left">
                        {correctServer === 'p2' && (
                          <div className="inline-flex items-center gap-2 justify-start">
                            <TennisBallIcon isServing={true} className="w-5 h-5" />
                            {isBreak && <Badge variant="destructive" className="text-xs font-bold bg-red-600">{t('lostServe')}</Badge>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                                      <div className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2 font-mono">
                        {(() => {
                          // Reconstruct the score context for each point
                          // We'll walk through the point log up to this point to get the correct games, points, sets, tiebreak status, etc.
                          return pointsInGame
                         .filter(point => !point.isGameWinning)
                         .map((point) => {
                           // Find all points up to and including this one
                           const pointIdx = pointLog.findIndex(p => p.id === point.id)
                           const logUpToThisPoint = pointLog.slice(0, pointIdx + 1)

                           // Calculate current set and game context
                           const setNumber = point.setNumber
                           const gameNumber = point.gameNumber
                           const setPoints = logUpToThisPoint.filter(p => p.setNumber === setNumber)
                           const gamePoints = setPoints.filter(p => p.gameNumber === gameNumber)

                           // Calculate games won in this set so far
                           let p1Games = 0, p2Games = 0
                           setPoints.forEach(p => {
                             if (p.isGameWinning) {
                               if (p.winner === 'p1') p1Games++
                               else p2Games++
                             }
                           })

                           // Calculate points in this game so far
                           let p1Points = 0, p2Points = 0
                           gamePoints.forEach(p => {
                             if (p.winner === 'p1') p1Points++
                             else p2Points++
                           })

                           // Determine if tiebreak
                           // If isTiebreak is not present, infer from gameScore or context
                           // Type guard for isTiebreak property
                           const hasIsTiebreak = (p: unknown): p is PointDetail & { isTiebreak?: boolean } => typeof p === 'object' && p !== null && 'isTiebreak' in p;
                           const isTiebreak = gamePoints.some(p => hasIsTiebreak(p) && p.isTiebreak === true)
                           let tiebreakPoints = [0, 0]
                           if (isTiebreak) {
                             tiebreakPoints = [0, 0]
                             gamePoints.forEach(p => {
                               if (p.winner === 'p1') tiebreakPoints[0]++
                               else tiebreakPoints[1]++
                             })
                           }

                           // Reconstruct sets array for helpers
                           // Only include fully completed sets (exclude current set)
                           const setsArr: number[][] = []
                           for (let s = 1; s < setNumber; s++) {
                             const setPts = pointLog.filter(p => p.setNumber === s)
                             let s1 = 0, s2 = 0
                             setPts.forEach(p => {
                               if (p.isGameWinning) {
                                 if (p.winner === 'p1') s1++
                                 else s2++
                               }
                             })
                             setsArr.push([s1, s2])
                           }

                           // Get match format (assume from first point)
                           // If matchFormat is not present in point, fallback to default
                           const matchFormat: MatchFormat = (pointLog[0] as (PointDetail & { matchFormat?: MatchFormat }))?.matchFormat || { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: "standard" }

                           // Use helpers to determine BP/SP/MP
                           let isBP = false, isSP = false, isMP = false
                           if (!isTiebreak) {
                             // Only check BP in regular games
                             const server = point.server
                             const serverPoints = server === 'p1' ? p1Points : p2Points
                             const returnerPoints = server === 'p1' ? p2Points : p1Points
                             isBP = isBreakPoint(serverPoints, returnerPoints, matchFormat.noAd)
                           }
                           // Set point
                           const setPointRes = isSetPoint(
                             p1Games, p2Games,
                             isTiebreak ? tiebreakPoints[0] : p1Points,
                             isTiebreak ? tiebreakPoints[1] : p2Points,
                             matchFormat,
                             isTiebreak,
                             setsArr
                           )
                           isSP = setPointRes.isSetPoint && setPointRes.player === point.winner
                           // Match point
                           const matchPointRes = isMatchPoint(
                             p1Games, p2Games,
                             isTiebreak ? tiebreakPoints[0] : p1Points,
                             isTiebreak ? tiebreakPoints[1] : p2Points,
                             setsArr,
                             matchFormat,
                             isTiebreak
                           )
                           isMP = matchPointRes.isMatchPoint && matchPointRes.player === point.winner

                           // Only show one badge per point: MP > SP > BP
                           let badge: { label: string; className: string } | null = null
                           if (isMP) {
                             badge = { label: 'MP', className: 'text-xs p-1 bg-red-600 text-white hover:bg-red-700' }
                           } else if (isSP) {
                             badge = { label: 'SP', className: 'text-xs p-1 bg-blue-500 text-white hover:bg-blue-600' }
                           } else if (isBP) {
                             badge = { label: 'BP', className: 'text-xs p-1 bg-orange-500 text-white hover:bg-orange-600' }
                           }

                           return (
                             <div key={point.id} className="inline-flex items-center gap-1">
                               <span className="text-xs">
                                 {point.gameScore.replace(/-/g, ':')}
                               </span>
                               {badge && (
                                 <Badge className={badge.className}>{badge.label}</Badge>
                               )}
                             </div>
                           )
                         })
                        })()}
                      </div>
                    </div>
                  )
                })}
              </TabsContent>
            )
          })}
        </Tabs>
      )
    } 