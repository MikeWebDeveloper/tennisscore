"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PointDetail } from "@/lib/types"

interface PointByPointViewProps {
  pointLog: string[] | PointDetail[]
}

export function PointByPointView({ pointLog }: PointByPointViewProps) {
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

  const getPointTypeIcon = (point: PointDetail) => {
    if (point.serveOutcome === "ace") return "🎯"
    if (point.pointOutcome === "winner") return "⚡"
    if (point.pointOutcome === "double_fault") return "❌"
    if (point.isBreakPoint) return "🔥"
    return "🎾"
  }

  const getWinnerColor = (winner: string) => {
    return winner === "p1" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
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

      {/* Points Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Point-by-Point Timeline
            <Badge variant="secondary">
              {filteredPoints.length} Points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredPoints.map((point, index) => (
              <Dialog key={point.id}>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getPointTypeIcon(point)}</span>
                      <div>
                        <div className="font-mono text-sm">
                          Point {point.pointNumber} • Set {point.setNumber}, Game {point.gameNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {point.gameScore}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {point.isBreakPoint && (
                        <Badge variant="destructive" className="text-xs">
                          Break Point
                        </Badge>
                      )}
                      {point.isSetPoint && (
                        <Badge variant="secondary" className="text-xs">
                          Set Point
                        </Badge>
                      )}
                      {point.isMatchPoint && (
                        <Badge variant="default" className="text-xs">
                          Match Point
                        </Badge>
                      )}
                      <Badge className={getWinnerColor(point.winner)}>
                        {point.winner === "p1" ? "P1" : "P2"}
                      </Badge>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Point {point.pointNumber} Details
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Set:</strong> {point.setNumber}
                      </div>
                      <div>
                        <strong>Game:</strong> {point.gameNumber}
                      </div>
                      <div>
                        <strong>Score:</strong> {point.gameScore}
                      </div>
                      <div>
                        <strong>Winner:</strong> {point.winner === "p1" ? "Player 1" : "Player 2"}
                      </div>
                      <div>
                        <strong>Server:</strong> {point.server === "p1" ? "Player 1" : "Player 2"}
                      </div>
                      <div>
                        <strong>Serve Type:</strong> {point.serveType}
                      </div>
                    </div>
                    
                    {point.serveOutcome && (
                      <div>
                        <strong>Serve Outcome:</strong> {point.serveOutcome}
                      </div>
                    )}
                    
                    {point.pointOutcome && (
                      <div>
                        <strong>Point Outcome:</strong> {point.pointOutcome}
                      </div>
                    )}
                    
                    {point.rallyLength && (
                      <div>
                        <strong>Rally Length:</strong> {point.rallyLength} shots
                      </div>
                    )}
                    
                    {point.notes && (
                      <div>
                        <strong>Notes:</strong> {point.notes}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {point.isBreakPoint && (
                        <Badge variant="destructive">Break Point</Badge>
                      )}
                      {point.isSetPoint && (
                        <Badge variant="secondary">Set Point</Badge>
                      )}
                      {point.isMatchPoint && (
                        <Badge variant="default">Match Point</Badge>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 