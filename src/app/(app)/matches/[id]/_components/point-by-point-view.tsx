"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PointDetail } from "@/lib/types"
import { reconstructMatchScore } from "@/lib/utils/tennis-scoring"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
  matchFormat?: {
    noAd?: boolean
    tiebreak?: boolean
    shortSets?: boolean
  }
}

interface FormattedPoint {
  pointNumber: number
  setGame: string
  server: string
  pointScore: string
  outcome: string
  winner: string
  isBreakPoint?: boolean
  setPoint?: boolean
  matchPoint?: boolean
}

export function PointByPointView({ pointLog, playerNames }: PointByPointViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pointsPerPage = 15
  
  // Format points for display in professional tennis broadcast style
  const formatPointsForDisplay = (): FormattedPoint[] => {
    return pointLog.map((point, index) => {
      const pointNumber = index + 1
      const setGame = `${point.setNumber}-${point.gameNumber}`
      const server = point.server === "p1" ? playerNames.p1 : playerNames.p2
      const winner = point.winner === "p1" ? playerNames.p1 : playerNames.p2
      
      // Format point score based on tennis scoring
      let pointScore = ""
      if (point.gameScore) {
        pointScore = point.gameScore
      } else {
        // Fallback to basic score if gameScore not available
        pointScore = `${point.setNumber}-${point.gameNumber}`
      }
      
             // Format outcome with professional terminology
       let outcome = ""
       switch (point.pointOutcome) {
         case "ace":
           outcome = "Ace"
           break
         case "winner":
           if (point.lastShotType) {
             outcome = `${point.lastShotType.charAt(0).toUpperCase() + point.lastShotType.slice(1)} Winner`
           } else {
             outcome = "Winner"
           }
           break
         case "unforced_error":
           if (point.lastShotType) {
             outcome = `${point.lastShotType.charAt(0).toUpperCase() + point.lastShotType.slice(1)} UE`
           } else {
             outcome = "Unforced Error"
           }
           break
         case "forced_error":
           if (point.lastShotType) {
             outcome = `${point.lastShotType.charAt(0).toUpperCase() + point.lastShotType.slice(1)} FE`
           } else {
             outcome = "Forced Error"
           }
           break
         case "double_fault":
           outcome = "Double Fault"
           break
         default:
           // Handle any additional point outcomes
           outcome = String(point.pointOutcome).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
       }

      return {
        pointNumber,
        setGame,
        server,
        pointScore,
        outcome,
        winner,
                 isBreakPoint: point.isBreakPoint,
         setPoint: point.isSetPoint,
         matchPoint: point.isMatchPoint
      }
    }).reverse() // Show most recent points first like in broadcast
  }

  const formattedPoints = formatPointsForDisplay()
  const totalPages = Math.ceil(formattedPoints.length / pointsPerPage)
  const startIndex = (currentPage - 1) * pointsPerPage
  const endIndex = startIndex + pointsPerPage
  const currentPoints = formattedPoints.slice(startIndex, endIndex)

  // Reconstruct the final match score
  const matchScore = reconstructMatchScore(pointLog.map(p => ({
    winner: p.winner,
    setNumber: p.setNumber,
    gameNumber: p.gameNumber
  })))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Point by Point</CardTitle>
          <div className="text-lg font-bold text-primary">
            {matchScore.finalScore || "Match in Progress"}
          </div>
          <div className="text-sm text-muted-foreground">
            {playerNames.p1} vs {playerNames.p2}
          </div>
        </CardHeader>
      </Card>

      {/* Professional Table View */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 border-b font-semibold text-sm">
            <div className="text-center">SET-GAME</div>
            <div className="text-center">SERVER</div>
            <div className="text-center">SCORE</div>
            <div className="text-center">OUTCOME</div>
            <div className="text-center">POINT TO</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {currentPoints.map((point, index) => (
              <motion.div
                key={point.pointNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-5 gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Set-Game */}
                <div className="text-center font-mono text-sm">
                  {point.setGame}
                </div>

                {/* Server */}
                <div className="text-center text-sm">
                  <span className="font-medium">{point.server}</span>
                </div>

                {/* Score */}
                <div className="text-center font-mono text-sm font-semibold">
                  {point.pointScore}
                </div>

                {/* Outcome */}
                <div className="text-center text-sm">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium">{point.outcome}</span>
                    {/* Special point indicators */}
                    <div className="flex gap-1">
                      {point.isBreakPoint && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">
                          BP
                        </Badge>
                      )}
                      {point.setPoint && (
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          SP
                        </Badge>
                      )}
                      {point.matchPoint && (
                        <Badge variant="default" className="text-xs px-1 py-0">
                          MP
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Winner */}
                <div className="text-center text-sm">
                  <span className={`font-semibold ${
                    point.winner === playerNames.p1 ? "text-blue-600" : "text-red-600"
                  }`}>
                    {point.winner}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty state */}
          {formattedPoints.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg font-medium mb-2">No points logged yet</div>
              <div className="text-sm">Start scoring to see the point-by-point breakdown</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <span className="text-xs text-muted-foreground">
              ({formattedPoints.length} points total)
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="font-medium">Legend:</div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">BP</Badge>
                <span>Break Point</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">SP</Badge>
                <span>Set Point</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">MP</Badge>
                <span>Match Point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">UE</span>
                <span>Unforced Error</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">FE</span>
                <span>Forced Error</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 