"use client"

import { Badge } from "@/components/ui/badge"
import React from "react"
import { PointDetail } from "@/lib/types"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useTranslations } from "@/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isBreakPoint, isSetPoint, isMatchPoint } from "@/lib/utils/tennis-scoring"
import { MatchFormat } from "@/stores/matchStore"
import { Switch } from "@/components/ui/switch"
import { List } from "lucide-react"
import { Grid } from "lucide-react"
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

// Helper to check if a point has isTiebreak property
const hasIsTiebreak = (p: unknown): p is PointDetail & { isTiebreak?: boolean } => typeof p === 'object' && p !== null && 'isTiebreak' in p;

// Helper to get detailed point information for detailed mode
const getDetailedPointInfo = (point: PointDetail, t: (key: string) => string, detailLevel?: string) => {
  let outcome = ''
  switch (point.pointOutcome) {
    case 'winner': outcome = t('winner'); break
    case 'unforced_error': outcome = t('unforcedError'); break
    case 'forced_error': outcome = t('forcedError'); break
    case 'ace': outcome = t('ace'); break
    case 'double_fault': outcome = t('doubleFault'); break
    default: outcome = point.pointOutcome
  }

  // For detailed mode, add shot type and direction information
  if (detailLevel === 'detailed') {
    const details = []
    
    // Add shot type if available
    if (point.lastShotType && point.lastShotType !== 'serve') {
      let shotType = ''
      switch (point.lastShotType) {
        case 'forehand': shotType = t('forehand'); break
        case 'backhand': shotType = t('backhand'); break
        case 'volley': shotType = t('volley'); break
        case 'overhead': shotType = t('overhead'); break
        default: shotType = point.lastShotType
      }
      details.push(shotType)
    }
    
    // Add shot direction if available
    if (point.shotDirection) {
      let direction = ''
      switch (point.shotDirection) {
        case 'cross': direction = t('crossCourt'); break
        case 'line': direction = t('downTheLine'); break
        case 'body': direction = t('bodyShot'); break
        case 'long': direction = t('long'); break
        case 'wide': direction = t('wide'); break
        case 'net': direction = t('net'); break
        default: direction = point.shotDirection
      }
      details.push(direction)
    }
    
    // Add serve placement for aces and double faults
    if ((point.pointOutcome === 'ace' || point.pointOutcome === 'double_fault') && point.servePlacement) {
      let placement = ''
      switch (point.servePlacement) {
        case 'wide': placement = t('wide'); break
        case 'body': placement = t('bodyShot'); break
        case 't': placement = t('tDownTheMiddle'); break
        default: placement = point.servePlacement
      }
      details.push(placement)
    }
    
    // Combine outcome with details
    if (details.length > 0) {
      return `${outcome} (${details.join(', ')})`
    }
  }
  
  return outcome
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
  // Check if we're in a super-tiebreak by examining the context
  const firstPoint = pointLog[0]
  // const currentSetNumber = point.setNumber
  const isInTiebreak = gamePoints.some(p => hasIsTiebreak(p) && p.isTiebreak === true)
  
  // Determine if this should be a super-tiebreak based on context
  let matchFormat: MatchFormat = (firstPoint as (PointDetail & { matchFormat?: MatchFormat }))?.matchFormat || { sets: 3, noAd: false, tiebreak: true, finalSetTiebreak: "standard" }
  
  // If we're in a tiebreak, check if it should be a super-tiebreak
  if (isInTiebreak) {
    const setsNeededToWin = Math.ceil(matchFormat.sets / 2)
    const p1SetsWon = setsArr.filter(set => set[0] > set[1]).length
    const p2SetsWon = setsArr.filter(set => set[1] > set[0]).length
    const isDecidingSet = p1SetsWon === setsNeededToWin - 1 && p2SetsWon === setsNeededToWin - 1
    
    // Check if any point in this tiebreak goes beyond what a standard tiebreak allows
    const maxTiebreakPoints = Math.max(...gamePoints.map((_, idx) => {
      let p1 = 0, p2 = 0
      for (let i = 0; i <= idx; i++) {
        if (gamePoints[i].winner === 'p1') p1++
        else p2++
      }
      return Math.max(p1, p2)
    }))
    
    // Also check if games are 0-0 which indicates super-tiebreak format
    const currentP1Games = p1Games
    const currentP2Games = p2Games
    const isGamesZeroZero = currentP1Games === 0 && currentP2Games === 0
    
    // If we're in deciding set AND (points go beyond 7 OR games are 0-0), assume super-tiebreak
    if (isDecidingSet && (maxTiebreakPoints > 7 || isGamesZeroZero)) {
      matchFormat = { ...matchFormat, finalSetTiebreak: "super", finalSetTiebreakAt: 10 }
    }
  }
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
  isSP = setPointRes.isSetPoint
  // Match point
  const matchPointRes = isMatchPoint(
    p1Games, p2Games,
    isTiebreak ? tiebreakPoints[0] : p1Points,
    isTiebreak ? tiebreakPoints[1] : p2Points,
    setsArr,
    matchFormat,
    isTiebreak
  )
  isMP = matchPointRes.isMatchPoint
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
  const t = useTranslations('common')
  const [detailedView, setDetailedView] = React.useState(false)
  // Group points by set (moved up for hook order)
  const pointsBySets = pointLog.reduce((acc, point) => {
    const setNumber = point.setNumber
    if (!acc[setNumber]) acc[setNumber] = []
    acc[setNumber].push(point)
    return acc
  }, {} as Record<number, PointDetail[]>)
  const setNumbers = Object.keys(pointsBySets).map(Number).sort((a, b) => a - b)
  const defaultSet = setNumbers[setNumbers.length - 1]?.toString() || "1"
  // Add controlled state for selected set
  const [selectedSet, setSelectedSet] = React.useState(defaultSet)
  // Always keep selectedSet in sync with available setNumbers
  React.useEffect(() => {
    if (!setNumbers.map(String).includes(selectedSet)) {
      setSelectedSet(defaultSet)
    }
  }, [defaultSet, setNumbers, selectedSet])
  
  // playerNames is available for future enhancements but not currently used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = playerNames

  if (!pointLog || pointLog.length === 0) {
    return <div className="text-center text-muted-foreground p-8">{t('noPointDataAvailable')}</div>
  }

  // Points are being received and updated in real-time

  // Determine who started serving the match from the first point
  const matchStartingServer = pointLog[0]?.server || 'p1'
  
  // Group points by set
  // const pointsBySets = pointLog.reduce((acc, point) => {
  //   const setNumber = point.setNumber
  //   if (!acc[setNumber]) acc[setNumber] = []
  //   acc[setNumber].push(point)
  //   return acc
  // }, {} as Record<number, PointDetail[]>)

  // const setNumbers = Object.keys(pointsBySets).map(Number).sort((a, b) => a - b)
  // const defaultSet = setNumbers[setNumbers.length - 1]?.toString() || "1"
  // // Add controlled state for selected set
  // const [selectedSet, setSelectedSet] = React.useState(defaultSet)
  // React.useEffect(() => {
  //   setSelectedSet(defaultSet)
  // }, [defaultSet])

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
      <Tabs value={selectedSet} onValueChange={value => {
        console.log('[PointByPointView] onValueChange', { value, selectedSet, setNumbers });
        if (!value || setNumbers.length === 1) return;
        if (setNumbers.map(String).includes(value)) {
          setSelectedSet(value);
        } else {
          // fallback: always set to the only available set if invalid
          setSelectedSet(defaultSet);
        }
      }} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${setNumbers.length}, 1fr)` }}>
            {setNumbers.map(setNumber => (
              <TabsTrigger key={setNumber} value={setNumber.toString()} disabled={setNumbers.length === 1}>
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
                  const isGameComplete = lastPoint.isGameWinning;
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
                        {/* Show game header only for completed games */}
                        {isGameComplete && (
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
                        )}
                        {/* Show "Current Game" label for games in progress */}
                        {!isGameComplete && (
                          <div className="flex items-center justify-center w-full mb-2">
                            <div className="flex-1 text-right">
                              {correctServer === 'p1' && (
                                <TennisBallIcon isServing={true} className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-2 font-mono text-lg font-bold px-4 text-muted-foreground">
                              <span>{t('currentGame')}</span>
                            </div>
                            <div className="flex-1 text-left">
                              {correctServer === 'p2' && (
                                <TennisBallIcon isServing={true} className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2 font-mono">
                          {/* Show all points except game-winning points to avoid duplicate display */}
                          {pointsInGame.filter(point => !point.isGameWinning).map((point) => {
                            const pointIdx = pointLog.findIndex(p => p.id === point.id)
                            const badge = getPointBadgeForLogIndex(pointIdx, pointLog)
                            // Determine if this game is a tiebreak
                            const isTiebreak = pointsInGame.some(p => hasIsTiebreak(p) && p.isTiebreak === true)
                            let displayScore = point.gameScore.replace(/-/g, ':')
                            if (isTiebreak) {
                              // For tiebreaks, count points up to and including this point in this game
                              let p1 = 0, p2 = 0
                              const originalIdx = pointsInGame.findIndex(p => p.id === point.id)
                              for (let i = 0; i <= originalIdx; i++) {
                                if (pointsInGame[i].winner === 'p1') p1++
                                else if (pointsInGame[i].winner === 'p2') p2++
                              }
                              displayScore = `${p1}:${p2}`
                            }
                            return (
                              <div key={point.id} className={`inline-flex items-center gap-1 ${point.isGameWinning ? 'font-bold text-primary' : ''}`}>
                                <span className="text-xs">
                                  {displayScore}
                                </span>
                                {badge && (
                                  <Badge className={badge.className}>{badge.label}</Badge>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  } else {
                    // DETAILED VIEW (reverse order, full name, color)
                    return (
                      <div key={gameKey} className="py-4 px-2 border-b border-border/50 text-center">
                        {/* Show game header only for completed games */}
                        {isGameComplete && (
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
                        )}
                        {/* Show "Current Game" label for games in progress */}
                        {!isGameComplete && (
                          <div className="flex items-center justify-center w-full mb-2">
                            <div className="flex-1 text-right">
                              {correctServer === 'p1' && (
                                <TennisBallIcon isServing={true} className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-2 font-mono text-lg font-bold px-4 text-muted-foreground">
                              <span>{t('currentGame')}</span>
                            </div>
                            <div className="flex-1 text-left">
                              {correctServer === 'p2' && (
                                <TennisBallIcon isServing={true} className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        )}
                        {/* Column headers for desktop */}
                        <div className="hidden md:grid grid-cols-4 gap-2 text-xs text-muted-foreground font-semibold mb-1 px-2">
                          <div className="text-left">{t('score')}</div>
                          <div className="text-center">{t('player')}</div>
                          <div className="text-right">{t('serveType')}</div>
                          <div className="text-right">{detailLevel === 'detailed' ? t('detailedOutcome') : 'Outcome'}</div>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-2 w-full">
                          {(() => {
                            const gameWinningPoint = pointsInGame.find(point => point.isGameWinning)
                            // For completed games, show the game-winning point as header
                            if (isGameComplete && gameWinningPoint) {
                            let displayName = getPlayerName(gameWinningPoint.winner)
                            let isDoubles = false
                            if (playerObjects) {
                              isDoubles = !!(playerObjects.p3 && playerObjects.p4)
                            }
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              if (playerObjects) {
                                if (isDoubles) {
                                  if (gameWinningPoint.winner === 'p1') {
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
                                  const player = gameWinningPoint.winner === 'p1' ? playerObjects.p1 : playerObjects.p2
                                  displayName = formatPlayerName(player.firstName, player.lastName, { shortened: true })
                                }
                              }
                            }
                            const serveTypeShort = gameWinningPoint.serveType === 'first' ? '1st' : '2nd'
                            const outcome = getDetailedPointInfo(gameWinningPoint, t, detailLevel)
                            return (
                              <>
                                <div
                                  key={gameWinningPoint.id + '-game'}
                                  className="w-full md:grid md:grid-cols-4 md:gap-2 flex flex-col items-center md:items-stretch text-base py-1 border-b border-border/30 last:border-b-0 font-bold bg-muted/40"
                                >
                                  <div className="font-mono min-w-[40px] text-lg text-primary md:text-left w-full text-left md:col-span-1 flex-shrink-0 flex items-center gap-1">
                                    {finalGameScore.p1}:{finalGameScore.p2}
                                  </div>
                                  <div className={`font-semibold ${getPlayerColor(gameWinningPoint.winner)} w-full text-center md:text-center md:col-span-1 md:whitespace-nowrap md:overflow-x-auto`}>
                                    <span dangerouslySetInnerHTML={{ __html: displayName }} />
                                  </div>
                                  <div className="text-xs text-muted-foreground w-full text-right md:text-right md:col-span-1">
                                    {serveTypeShort}
                                  </div>
                                  <div className="text-xs font-medium w-full text-right md:text-right md:col-span-1">
                                    {outcome}
                                  </div>
                                </div>
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
                                    const serveTypeShort = point.serveType === 'first' ? '1st' : '2nd'
                                    const outcome = getDetailedPointInfo(point, t, detailLevel)
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
                                          {(() => {
                                            // Check if this is a tiebreak game
                                            const isTiebreak = pointsInGame.some(p => hasIsTiebreak(p) && p.isTiebreak === true)
                                            if (isTiebreak) {
                                              // For tiebreaks, count points up to this point in this game
                                              let p1 = 0, p2 = 0
                                              const pointIndex = pointsInGame.findIndex(p => p.id === point.id)
                                              for (let i = 0; i <= pointIndex; i++) {
                                                if (pointsInGame[i].winner === 'p1') p1++
                                                else if (pointsInGame[i].winner === 'p2') p2++
                                              }
                                              return `${p1}:${p2}`
                                            }
                                            return point.gameScore.replace(/-/g, ':')
                                          })()}
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
                                </>
                              )
                            }
                            // For games in progress, show all points without game-winning point header
                            return (
                              <div className="w-full">
                                {[...pointsInGame].reverse().map((point) => {
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
                                  const serveTypeShort = point.serveType === 'first' ? '1st' : '2nd'
                                  const outcome = getDetailedPointInfo(point, t, detailLevel)
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
                                        {(() => {
                                          // Check if this is a tiebreak game
                                          const isTiebreak = pointsInGame.some(p => hasIsTiebreak(p) && p.isTiebreak === true)
                                          if (isTiebreak) {
                                            // For tiebreaks, count points up to this point in this game
                                            let p1 = 0, p2 = 0
                                            const pointIndex = pointsInGame.findIndex(p => p.id === point.id)
                                            for (let i = 0; i <= pointIndex; i++) {
                                              if (pointsInGame[i].winner === 'p1') p1++
                                              else if (pointsInGame[i].winner === 'p2') p2++
                                            }
                                            return `${p1}:${p2}`
                                          }
                                          return point.gameScore.replace(/-/g, ':')
                                        })()}
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
                            )
                          })()}
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