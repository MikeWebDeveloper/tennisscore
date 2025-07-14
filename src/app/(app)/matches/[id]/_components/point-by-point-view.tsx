"use client"

import { Badge } from "@/components/ui/badge"
import React from "react"
import { PointDetail } from "@/lib/types"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useTranslations } from "@/hooks/use-translations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isBreakPoint, isSetPoint, isMatchPoint } from "@/lib/utils/tennis-scoring"
import { MatchFormat } from "@/stores/matchStore"
import { Switch } from "@/components/ui/switch"
import { List, Grid } from "lucide-react"
import { formatPlayerFromObject, formatDoublesTeam, formatPlayerName } from "@/lib/utils"
import { Player } from "@/lib/types"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames?: {
    p1: string
    p2: string
    p3?: string
    p4?: string
  }
  playerObjects?: {
    p1: Player
    p2: Player
    p3?: Player
    p4?: Player
  }
  detailLevel?: "points" | "simple" | "detailed" | "complex"
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

// Helper to determine BP/SP/MP for a given point, reconstructing context up to that point
function getPointBadgeForLogIndex(pointIdx: number, pointLog: PointDetail[]) {
  // Only consider points up to and including this one
  const logUpToThisPoint = pointLog.slice(0, pointIdx + 1)
  const point = pointLog[pointIdx]
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
  if (isMP) {
    return { label: 'MP', className: 'text-xs p-1 bg-red-600 text-white hover:bg-red-700' }
  } else if (isSP) {
    return { label: 'SP', className: 'text-xs p-1 bg-blue-500 text-white hover:bg-blue-600' }
  } else if (isBP) {
    return { label: 'BP', className: 'text-xs p-1 bg-orange-500 text-white hover:bg-orange-600' }
  }
  return null
}

export function PointByPointView({ pointLog, playerNames, playerObjects, detailLevel = "simple" }: PointByPointViewProps) {
  const t = useTranslations()
  const [detailedView, setDetailedView] = React.useState(false)
  
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

  // Helper to get player/team display name (singles/doubles)
  const getPlayerName = (key: "p1" | "p2") => {
    if (playerObjects) {
      // Doubles if both p3 and p4 exist
      const isDoubles = !!(playerObjects.p3 && playerObjects.p4)
      if (key === "p1") {
        return isDoubles
          ? formatDoublesTeam(playerObjects.p1, playerObjects.p3!)
          : formatPlayerFromObject(playerObjects.p1)
      }
      if (key === "p2") {
        return isDoubles
          ? formatDoublesTeam(playerObjects.p2, playerObjects.p4!)
          : formatPlayerFromObject(playerObjects.p2)
      }
    }
    // Fallback to playerNames prop
    if (playerNames) {
      if (key === "p1") return playerNames.p1 || "P1"
      if (key === "p2") return playerNames.p2 || "P2"
    }
    return key
  }
  // Helper to get player color
  // Use blue for p1 and red for p2 to match Momentum bar
  const getPlayerColor = (key: "p1" | "p2") => key === "p1" ? "text-blue-600" : "text-red-600"

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${setNumbers.length}, 1fr)` }}>
          {setNumbers.map(setNumber => (
            <TabsTrigger key={setNumber} value={setNumber.toString()}>
              {t('set')} {setNumber}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Only show toggle for simple or detailed scoring */}
        {(detailLevel === "simple" || detailLevel === "detailed") && (
          <div className="flex items-center gap-2 ml-4">
            <Grid size={18} className={!detailedView ? "text-primary" : "text-muted-foreground"} />
            <Switch checked={detailedView} onCheckedChange={setDetailedView} />
            <List size={18} className={detailedView ? "text-primary" : "text-muted-foreground"} />
          </div>
        )}
      </div>
      <Tabs defaultValue={defaultSet} className="w-full">
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

                  if (!detailedView) {
                    // COMPACT VIEW (existing)
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
                               const pointIdx = pointLog.findIndex(p => p.id === point.id)
                               const badge = getPointBadgeForLogIndex(pointIdx, pointLog)
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
                  } else {
                    // DETAILED VIEW (reverse order, full name, color)
                    return (
                      <div key={gameKey} className="py-4 px-2 border-b border-border/50 text-center">
                        <div className="flex items-center justify-center w-full mb-2">
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
                        {/* Column headers for desktop */}
                        <div className="hidden md:grid grid-cols-4 gap-2 text-xs text-muted-foreground font-semibold mb-1 px-2">
                          <div className="text-left">{t('score')}</div>
                          <div className="text-center">{t('player')}</div>
                          <div className="text-right">{t('serveType')}</div>
                          <div className="text-right">Outcome</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-2 w-full">
                          {[...pointsInGame]
                            .filter(point => !point.isGameWinning)
                            .reverse()
                            .map((point) => {
                              // Responsive name formatting
                              let displayName = getPlayerName(point.winner)
                              let isDoubles = false
                              if (playerObjects) {
                                isDoubles = !!(playerObjects.p3 && playerObjects.p4)
                              }
                              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                // Mobile: Surname F. (doubles stacked)
                                if (playerObjects) {
                                  if (isDoubles) {
                                    if (point.winner === 'p1') {
                                      displayName =
                                        formatPlayerName(playerObjects.p1.firstName, playerObjects.p1.lastName, { shortened: true }) +
                                        '<br />' +
                                        formatPlayerName(playerObjects.p3!.firstName, playerObjects.p3!.lastName, { shortened: true })
                                    } else {
                                      displayName =
                                        formatPlayerName(playerObjects.p2.firstName, playerObjects.p2.lastName, { shortened: true }) +
                                        '<br />' +
                                        formatPlayerName(playerObjects.p4!.firstName, playerObjects.p4!.lastName, { shortened: true })
                                    }
                                  } else {
                                    const player = point.winner === 'p1' ? playerObjects.p1 : playerObjects.p2
                                    displayName = formatPlayerName(player.firstName, player.lastName, { shortened: true })
                                  }
                                }
                              }
                              // Serve type: only "1st" or "2nd"
                              const serveTypeShort = point.serveType === 'first' ? '1st' : '2nd'
                              // Outcome
                              let outcome = ''
                              switch (point.pointOutcome) {
                                case 'winner': outcome = t('winner'); break
                                case 'unforced_error': outcome = t('unforcedError'); break
                                case 'forced_error': outcome = t('forcedError'); break
                                case 'ace': outcome = t('ace'); break
                                case 'double_fault': outcome = t('doubleFault'); break
                                default: outcome = point.pointOutcome
                              }
                              // --- BADGE LOGIC ---
                              const pointIdx = pointLog.findIndex(p => p.id === point.id)
                              const badge = getPointBadgeForLogIndex(pointIdx, pointLog)
                              return (
                                <div
                                  key={point.id}
                                  className="w-full md:grid md:grid-cols-4 md:gap-2 flex flex-col items-center md:items-stretch text-sm py-1 border-b border-border/30 last:border-b-0"
                                >
                                  {/* Score + badge */}
                                  <div className="font-mono min-w-[40px] text-xs text-muted-foreground md:text-left w-full text-left md:col-span-1 flex-shrink-0 flex items-center gap-1">
                                    {point.gameScore.replace(/-/g, ':')}
                                    {badge && (
                                      <Badge className={badge.className}>{badge.label}</Badge>
                                    )}
                                  </div>
                                  {/* Name */}
                                  <div className={`font-semibold ${getPlayerColor(point.winner)} w-full text-center md:text-center md:col-span-1 md:whitespace-nowrap md:overflow-x-auto`}>
                                    {/* For mobile, render doubles names stacked with <br /> */}
                                    <span dangerouslySetInnerHTML={{ __html: displayName }} />
                                  </div>
                                  {/* Serve type */}
                                  <div className="text-xs text-muted-foreground w-full text-right md:text-right md:col-span-1">
                                    {serveTypeShort}
                                  </div>
                                  {/* Outcome */}
                                  <div className="text-xs font-medium w-full text-right md:text-right md:col-span-1">
                                    {outcome}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )
                  }
                })}
            </TabsContent>
          )})}
      </Tabs>
    </div>
  )
} 