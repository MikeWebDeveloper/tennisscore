"use client"

import { Badge } from "@/components/ui/badge"
import React from "react"
import { PointDetail } from "@/lib/types"
import { TennisBallIcon } from "@/components/shared/tennis-ball-icon"
import { useTranslations } from "@/hooks/use-translations"

interface PointByPointViewProps {
  pointLog: PointDetail[]
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

export function PointByPointView({ pointLog }: PointByPointViewProps) {
  const t = useTranslations()

  if (!pointLog || pointLog.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No point data available.</div>
  }

  const pointsBySetAndGame = pointLog.reduce((acc, point) => {
    const setKey = `set-${point.setNumber}`
    if (!acc[setKey]) acc[setKey] = {}
    const gameKey = `game-${point.gameNumber}`
    if (!acc[setKey][gameKey]) acc[setKey][gameKey] = []
    acc[setKey][gameKey].push(point)
    return acc
  }, {} as Record<string, Record<string, PointDetail[]>>)

  return (
    <div className="space-y-1">
      {Object.entries(pointsBySetAndGame).map(([setKey, games]) => (
        <div key={setKey} className="space-y-1">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground p-2 tracking-wider">{t('set')} {setKey.split('-')[1]}</h3>
          {Object.entries(games).map(([gameKey, pointsInGame]) => {
            const firstPoint = pointsInGame[0];
            if (!firstPoint) return null;

            const lastPoint = pointsInGame[pointsInGame.length - 1];
            const isBreak = lastPoint.isGameWinning && lastPoint.server !== lastPoint.winner;
            const finalGameScore = getGameScoreAfterGame(pointsInGame, pointLog);

            return (
              <div key={gameKey} className="py-4 px-2 border-b border-border/50 text-center">
                <div className="flex items-center justify-center w-full">
                  <div className="flex-1 text-right">
                    {firstPoint.server === 'p2' && (
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
                    {firstPoint.server === 'p1' && (
                      <div className="inline-flex items-center gap-2 justify-start">
                        <TennisBallIcon isServing={true} className="w-5 h-5" />
                        {isBreak && <Badge variant="destructive" className="text-xs font-bold bg-red-600">{t('lostServe')}</Badge>}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2 font-mono">
                  {pointsInGame.map((point) => (
                    <div key={point.id} className="inline-flex items-center gap-1">
                      <span className="text-xs">
                        {point.gameScore.replace(/-/g, ':')}
                      </span>
                      {point.isBreakPoint && <Badge className="text-xs p-1 bg-orange-500 text-white hover:bg-orange-600">BP</Badge>}
                      {point.isSetPoint && <Badge className="text-xs p-1 bg-blue-500 text-white hover:bg-blue-600">SP</Badge>}
                      {point.isMatchPoint && <Badge className="text-xs p-1 bg-red-600 text-white hover:bg-red-700">MP</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
} 