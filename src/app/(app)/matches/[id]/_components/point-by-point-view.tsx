"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { PointDetail } from "@/lib/types"
import { reconstructGameProgression, getServer, reconstructMatchScore } from "@/lib/utils/tennis-scoring"
// Removed unused imports

interface PointByPointViewProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
  matchFormat?: {
    noAd?: boolean
    tiebreak?: boolean
    shortSets?: boolean
  }
}

interface PointPopupProps {
  score: string
  serveType: string
  pointOutcome: string
  winnerName: string
  setNumber: number
  gameNumber: number
  server: "p1" | "p2"
  playerNames: { p1: string; p2: string }
}

function PointPopup({ 
  score, 
  serveType, 
  pointOutcome, 
  winnerName, 
  setNumber, 
  gameNumber, 
  server,
  playerNames 
}: PointPopupProps) {
  const serverName = server === "p1" ? playerNames.p1 : playerNames.p2
  
  const getPointOutcomeText = () => {
    switch (pointOutcome) {
      case "ace": return "Ace"
      case "winner": return "Winner"
      case "unforced_error": return "Unforced Error"
      case "forced_error": return "Forced Error"
      case "double_fault": return "Double Fault"
      default: return pointOutcome.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-md">
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">{score}</div>
        <p className="text-sm text-muted-foreground">
          Set {setNumber}, Game {gameNumber}
        </p>
      </div>
      
      <div className="space-y-2 text-center">
        <div className="text-lg font-semibold text-blue-500">
          {serveType === "first" ? "1st Serve" : "2nd Serve"}
        </div>
        
        <div className="text-lg font-semibold text-green-500">
          {getPointOutcomeText()}
        </div>
        
        <div className="text-lg font-semibold text-orange-500">
          {winnerName}
        </div>
        
        <div className="text-base text-muted-foreground">
          {serverName} serving
        </div>
      </div>
    </div>
  )
}

// Tennis Ball SVG Component
function TennisBall({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" fill="#9ACD32" stroke="#228B22" strokeWidth="1"/>
      <path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12s-2 4.5-4.5 4.5S2 14.5 2 12z" fill="none" stroke="#228B22" strokeWidth="1.5"/>
      <path d="M22 12c0 2.5-2 4.5-4.5 4.5S13 14.5 13 12s2-4.5 4.5-4.5S22 9.5 22 12z" fill="none" stroke="#228B22" strokeWidth="1.5"/>
    </svg>
  )
}

export function PointByPointView({ pointLog, playerNames, matchFormat = {} }: PointByPointViewProps) {
  // Reconstruct the final match score from point log
  const matchScore = reconstructMatchScore(pointLog.map(p => ({
    winner: p.winner,
    setNumber: p.setNumber,
    gameNumber: p.gameNumber
  })))

  // Group points by sets and games
  const setGroups = pointLog.reduce((sets, point) => {
    const setKey = point.setNumber
    if (!sets[setKey]) {
      sets[setKey] = {}
    }
    
    const gameKey = point.gameNumber
    if (!sets[setKey][gameKey]) {
      sets[setKey][gameKey] = []
    }
    
    sets[setKey][gameKey].push(point)
    return sets
  }, {} as Record<number, Record<number, PointDetail[]>>)

  const [selectedSet, setSelectedSet] = useState(1)
  const availableSets = Object.keys(setGroups).map(Number).sort()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-lg p-4 md:p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Point by Point</h2>
          <div className="text-2xl font-bold text-primary">
            {matchScore.finalScore || "No score available"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {playerNames.p1} vs {playerNames.p2}
          </div>
        </div>

        {/* Set switcher */}
        {availableSets.length > 1 && (
          <div className="flex justify-center mb-6">
            <div className="flex bg-muted rounded-lg p-1">
              {availableSets.map((setNum) => (
                <Button
                  key={setNum}
                  variant={selectedSet === setNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSet(setNum)}
                  className="text-xs"
                >
                  {setNum}. SET
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Games for selected set */}
        {setGroups[selectedSet] && (
          <div className="space-y-3 md:space-y-4">
            {Object.entries(setGroups[selectedSet]).map(([gameNum, gamePoints]) => {
              const gameNumber = Number(gameNum)
              const server = getServer(gameNumber)
              
              // Reconstruct the score progression for this game
              const scoreProgression = reconstructGameProgression(gamePoints, matchFormat.noAd)
              
              // Get the game winner from the last point
              const lastPoint = gamePoints[gamePoints.length - 1]
              const gameWinner = lastPoint.winner
              
              // Calculate game score after this game completed
              const thisSetGames = Object.entries(setGroups[selectedSet])
                .filter(([gNum]) => Number(gNum) <= gameNumber)
                .reduce((acc, [, gPoints]) => {
                  const gWinner = gPoints[gPoints.length - 1].winner
                  if (gWinner === "p1") acc.p1++
                  else acc.p2++
                  return acc
                }, { p1: 0, p2: 0 })

              const gameScore = `${thisSetGames.p1}-${thisSetGames.p2}`
              
              // Check if serve was broken
              const serveWasBroken = gameWinner !== server
              
              return (
                <motion.div 
                  key={`${selectedSet}-${gameNumber}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gameNumber * 0.05 }}
                  className="bg-muted/50 rounded-lg p-3 md:p-4"
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      SET {selectedSet} • GAME {gameNumber}
                      <span className="inline-flex items-center ml-2">
                        {server === "p1" ? playerNames.p1 : playerNames.p2} serving
                        <TennisBall className="h-3 w-3 inline-block ml-1 text-primary" />
                      </span>
                    </div>
                    
                    {/* Point progression timeline - show intermediate scores */}
                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                      {scoreProgression.slice(1, -1).map((score, index) => {
                        const point = gamePoints[index]
                        if (!point) return null
                        
                        return (
                          <Dialog key={`${gameNumber}-${index}`}>
                            <DialogTrigger asChild>
                              <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-2 py-1 bg-background hover:bg-primary/10 rounded text-sm font-mono cursor-pointer transition-colors border text-foreground"
                              >
                                {score}
                              </motion.button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm">
                              <PointPopup 
                                score={score}
                                serveType={point.serveType}
                                pointOutcome={point.pointOutcome}
                                winnerName={point.winner === "p1" ? playerNames.p1 : playerNames.p2}
                                setNumber={point.setNumber}
                                gameNumber={point.gameNumber}
                                server={server}
                                playerNames={playerNames}
                              />
                            </DialogContent>
                          </Dialog>
                        )
                      })}
                    </div>
                    
                    {/* Final game score */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xl font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors mb-2"
                        >
                          {gameScore}
                        </motion.button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm">
                        <PointPopup 
                          score={gameScore}
                          serveType={lastPoint.serveType}
                          pointOutcome={lastPoint.pointOutcome}
                          winnerName={lastPoint.winner === "p1" ? playerNames.p1 : playerNames.p2}
                          setNumber={lastPoint.setNumber}
                          gameNumber={lastPoint.gameNumber}
                          server={server}
                          playerNames={playerNames}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    {/* Serve broken indicator */}
                    {serveWasBroken && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="text-xs text-red-500 font-semibold uppercase tracking-wider"
                      >
                        Serve Broken!
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!setGroups[selectedSet] && pointLog.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No games found for this set.
          </div>
        )}

        {pointLog.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No points logged yet. Start scoring to see the point-by-point breakdown.
          </div>
        )}
      </div>
    </div>
  )
} 