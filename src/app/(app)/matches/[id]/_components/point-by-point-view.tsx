"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PointDetail } from "@/lib/types"

interface PointByPointViewProps {
  pointLog: string[] | PointDetail[]
  playerNames: { p1: string; p2: string }
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const [selectedSet, setSelectedSet] = useState<number | null>(null)
  
  // Parse point log if it's an array of strings
  const parsedPoints: PointDetail[] = pointLog.map(point => {
    if (typeof point === 'string') {
      try {
        return JSON.parse(point)
      } catch {
        return null
      }
    }
    return point
  }).filter(Boolean) as PointDetail[]

  if (parsedPoints.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No point data available</p>
        </CardContent>
      </Card>
    )
  }

  const sets = Array.from(new Set(parsedPoints.map(p => p.setNumber))).sort()
  const filteredPoints = selectedSet 
    ? parsedPoints.filter(p => p.setNumber === selectedSet)
    : parsedPoints

  // Group points by games
  const gameGroups = filteredPoints.reduce((acc, point) => {
    const key = `${point.setNumber}-${point.gameNumber}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(point)
    return acc
  }, {} as Record<string, PointDetail[]>)

  const getPointDisplay = (point: PointDetail) => {
    const winner = point.winner === "p1" ? playerNames.p1.split(' ')[0] : playerNames.p2.split(' ')[0]
    let display = point.gameScore
    
    // Add outcome indicator
    if (point.pointOutcome === "ace") return `${display} (ACE)`
    if (point.pointOutcome === "double_fault") return `${display} (DF)`
    if (point.pointOutcome === "winner") return `${display} (W)`
    if (point.pointOutcome === "unforced_error") return `${display} (UE)`
    
    return display
  }

  const getPointColor = (point: PointDetail) => {
    if (point.pointOutcome === "ace") return "text-green-600"
    if (point.pointOutcome === "double_fault") return "text-red-600"
    if (point.pointOutcome === "winner") return "text-blue-600"
    if (point.pointOutcome === "unforced_error") return "text-orange-600"
    return "text-gray-700"
  }

  return (
    <div className="space-y-4">
      {/* Set Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSet === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSet(null)}
        >
          All Sets
        </Button>
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

      {/* Summary Header */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
        <div>{playerNames.p1.split(' ')[0]}</div>
        <div>Score</div>
        <div>{playerNames.p2.split(' ')[0]}</div>
      </div>

      {/* Point by Point Display */}
      <div className="space-y-6">
        {Object.entries(gameGroups).map(([gameKey, gamePoints]) => {
          const [setNum, gameNum] = gameKey.split('-')
          const lastPoint = gamePoints[gamePoints.length - 1]
          
          return (
            <Card key={gameKey} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Set {setNum}, Game {gameNum}</span>
                  <div className="flex items-center gap-2">
                    {lastPoint.isBreakPoint && (
                      <Badge variant="destructive" className="text-xs">BP</Badge>
                    )}
                    {lastPoint.isSetPoint && (
                      <Badge variant="secondary" className="text-xs">SP</Badge>
                    )}
                    {lastPoint.isMatchPoint && (
                      <Badge variant="default" className="text-xs">MP</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {lastPoint.server === "p1" ? `${playerNames.p1.split(' ')[0]} serves` : `${playerNames.p2.split(' ')[0]} serves`}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {gamePoints.map((point, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-4 items-center py-1 text-sm border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                      <div className="text-center">
                        {point.winner === "p1" && (
                          <div className={`font-mono ${getPointColor(point)}`}>
                            {getPointDisplay(point)}
                          </div>
                        )}
                      </div>
                      <div className="text-center text-xs text-muted-foreground">
                        {point.gameScore}
                      </div>
                      <div className="text-center">
                        {point.winner === "p2" && (
                          <div className={`font-mono ${getPointColor(point)}`}>
                            {getPointDisplay(point)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Point Count Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Total Points: {filteredPoints.length}
        {selectedSet && ` in Set ${selectedSet}`}
      </div>
    </div>
  )
} 