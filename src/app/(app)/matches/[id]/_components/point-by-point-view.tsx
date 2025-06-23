"use client"

import { Badge } from "@/components/ui/badge"
import React from "react"
import { PointDetail } from "@/lib/types"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useTranslations } from "@/hooks/use-translations"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    return <div className="text-center text-muted-foreground p-8">No point data available.</div>
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
            {Object.entries(pointsByGame).map(([gameKey, pointsInGame]) => {
              const firstPoint = pointsInGame[0];
              if (!firstPoint) return null;

              const lastPoint = pointsInGame[pointsInGame.length - 1];
              const isBreak = lastPoint.isGameWinning && lastPoint.server !== lastPoint.winner;
              const finalGameScore = getGameScoreAfterGame(pointsInGame, pointLog);
              
              // Determine the correct server for this game based on tennis rules
              // Server alternates every game, starting with whoever served first in the match
              const currentGameNumber = firstPoint.gameNumber;
              
              // Use the same logic as getServerWithStartingChoice function in match store
              const totalGamesPlayed = currentGameNumber - 1
              
              const correctServer = matchStartingServer === 'p1' 
                ? (totalGamesPlayed % 2 === 0 ? 'p1' : 'p2')  // P1 started: P1 serves games 1,3,5... P2 serves games 2,4,6...
                : (totalGamesPlayed % 2 === 0 ? 'p2' : 'p1')  // P2 started: P2 serves games 1,3,5... P1 serves games 2,4,6...

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
                    {pointsInGame
                      .filter(point => !point.isGameWinning)
                      .map((point) => (
                      <div key={point.id} className="inline-flex items-center gap-1">
                        <span className="text-xs">
                          {point.gameScore.replace(/-/g, ':')}
                        </span>
                        {point.isBreakPoint && <Badge className="text-xs p-1 bg-orange-500 text-white hover:bg-orange-600">{t('breakPoint')}</Badge>}
                        {point.isSetPoint && <Badge className="text-xs p-1 bg-blue-500 text-white hover:bg-blue-600">{t('setPoint')}</Badge>}
                        {point.isMatchPoint && <Badge className="text-xs p-1 bg-red-600 text-white hover:bg-red-700">{t('matchPoint')}</Badge>}
                      </div>
                    ))}
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