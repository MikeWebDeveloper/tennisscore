"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PointDetail } from "@/lib/types"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const [selectedSet, setSelectedSet] = useState<number>(1)
  
  // Group points by set and game
  const pointsBySet = pointLog.reduce((acc, point) => {
    if (!acc[point.setNumber]) acc[point.setNumber] = {}
    if (!acc[point.setNumber][point.gameNumber]) acc[point.setNumber][point.gameNumber] = []
    acc[point.setNumber][point.gameNumber].push(point)
    return acc
  }, {} as Record<number, Record<number, PointDetail[]>>)

  const sets = Object.keys(pointsBySet).map(Number).sort()
  const currentSetGames = pointsBySet[selectedSet] || {}
  const games = Object.keys(currentSetGames).map(Number).sort()

  const getPointOutcomeDisplay = (point: PointDetail) => {
    if (point.pointOutcome === "ace") return "A"
    if (point.pointOutcome === "double_fault") return "DF"
    if (point.pointOutcome === "winner") return "W"
    if (point.pointOutcome === "unforced_error") return "UE"
    if (point.pointOutcome === "forced_error") return "FE"
    return "•"
  }

  const getPointBadgeVariant = (point: PointDetail) => {
    if (point.isMatchPoint) return "destructive"
    if (point.isSetPoint) return "secondary"
    if (point.isBreakPoint) return "outline"
    return "default"
  }

  const getPointBadgeText = (point: PointDetail) => {
    if (point.isMatchPoint) return "MP"
    if (point.isSetPoint) return "SP"
    if (point.isBreakPoint) return "BP"
    return ""
  }

  return (
    <div className="space-y-4">
      {/* Set Selector */}
      {sets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sets.map(setNum => (
            <Button
              key={setNum}
              variant={selectedSet === setNum ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSet(setNum)}
            >
              Set {setNum}
            </Button>
          ))}
        </div>
      )}

      {/* Point-by-Point Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Set {selectedSet} - Point by Point
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {playerNames.p1} vs {playerNames.p2}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {games.map(gameNum => {
              const gamePoints = currentSetGames[gameNum] || []
              const server = gamePoints[0]?.server
              const serverName = server === "p1" ? playerNames.p1 : playerNames.p2
              
              return (
                <div key={gameNum} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium text-sm">
                      Game {gameNum}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {serverName} serving
                    </div>
                  </div>
                  
                  {/* Points in this game */}
                  <div className="space-y-2">
                    {gamePoints.map((point, idx) => {
                      const isWinner = point.winner === "p1"
                      const outcomeDisplay = getPointOutcomeDisplay(point)
                      const badgeText = getPointBadgeText(point)
                      
                      return (
                        <div 
                          key={idx}
                          className="flex items-center justify-between py-1 px-2 rounded border-l-4 bg-muted/30"
                          style={{
                            borderLeftColor: isWinner ? "hsl(var(--primary))" : "hsl(var(--destructive))"
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-xs font-mono w-8">
                              {point.pointNumber}
                            </div>
                            <div className="text-sm font-medium w-16">
                              {point.gameScore}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {isWinner ? playerNames.p1 : playerNames.p2}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-1 py-0 h-5"
                              >
                                {outcomeDisplay}
                              </Badge>
                              {badgeText && (
                                <Badge 
                                  variant={getPointBadgeVariant(point)}
                                  className="text-xs px-1 py-0 h-5"
                                >
                                  {badgeText}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {point.notes && (
                            <div className="text-xs text-muted-foreground max-w-32 truncate">
                              {point.notes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Game Summary */}
                  <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Points: {gamePoints.length}</span>
                      <span>
                        Winner: {gamePoints[gamePoints.length - 1]?.winner === "p1" ? playerNames.p1 : playerNames.p2}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">A</Badge>
              <span>Ace</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">W</Badge>
              <span>Winner</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">UE</Badge>
              <span>Unforced Error</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">DF</Badge>
              <span>Double Fault</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs px-1 py-0 h-5">MP</Badge>
              <span>Match Point</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">SP</Badge>
              <span>Set Point</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-1 py-0 h-5">BP</Badge>
              <span>Break Point</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-1 py-0 h-5">FE</Badge>
              <span>Forced Error</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 