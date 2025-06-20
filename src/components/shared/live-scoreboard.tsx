"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { TennisBallIcon } from "./tennis-ball-icon"
import { Score } from "@/lib/types"
import { cn } from "@/lib/utils"

interface LiveScoreboardProps {
  playerOneName: string
  playerTwoName: string
  score: Score & { server?: "p1" | "p2", isTiebreak?: boolean, tiebreakPoints?: number[] }
  currentServer?: "p1" | "p2" | null
  status?: string
  winnerId?: string
  playerOneId?: string
  playerTwoId?: string
  isInGame?: boolean
  onServerClick?: () => void
  className?: string
}

export function LiveScoreboard({
  playerOneName,
  playerTwoName,
  score,
  currentServer,
  status = "In Progress",
  winnerId,
  playerOneId,
  playerTwoId,
  isInGame = false,
  onServerClick,
  className
}: LiveScoreboardProps) {
  const isTiebreak = score.isTiebreak || false
  const server = currentServer || score.server
  
  const getPointDisplay = (playerIndex: number) => {
    if (status !== "In Progress") return ""
    
    if (isTiebreak) {
      return String(score.tiebreakPoints?.[playerIndex] || 0)
    }
    
    const p1 = score.points[0]
    const p2 = score.points[1]
    
    if (p1 >= 3 && p2 >= 3) {
      if (p1 === p2) return "40"
      if (p1 > p2 && playerIndex === 0) return "AD"
      if (p2 > p1 && playerIndex === 1) return "AD"
    }
    
    const pointMap = ["0", "15", "30", "40"]
    return pointMap[score.points[playerIndex]] || "40"
  }

  // Calculate sets won
  const setsWon = [
    score.sets.filter(set => set[0] > set[1]).length,
    score.sets.filter(set => set[1] > set[0]).length
  ]

  const isWinner = (playerId?: string) => winnerId && playerId && winnerId === playerId

  return (
    <div className={cn("bg-card rounded-lg border shadow-sm", className)}>
      {/* Mobile-optimized layout */}
      <div className="divide-y">
        {/* Player 1 */}
        <div className={cn(
          "p-3 sm:p-4 transition-colors",
          isWinner(playerOneId) && "bg-primary/5"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {server === "p1" && (
                <motion.button 
                  layoutId="tennis-ball" 
                  onClick={onServerClick} 
                  className={cn(
                    "flex-shrink-0 p-1 rounded-full transition-colors",
                    onServerClick && !isInGame && "hover:bg-muted cursor-pointer"
                  )}
                  disabled={!onServerClick || isInGame}
                  whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                >
                  <TennisBallIcon className="w-4 h-4" />
                </motion.button>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  {playerOneName}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {setsWon[0]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Set scores - hide on very small screens if more than 3 sets */}
              {score.sets.length <= 3 && (
                <div className="hidden sm:flex gap-1">
                  {score.sets.map((set, idx) => (
                    <div key={idx} className="text-sm font-mono w-5 text-center">
                      {set[0]}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current game score */}
              <div className="text-lg sm:text-xl font-mono font-bold w-6 text-center">
                {score.games[0]}
              </div>
              
              {/* Current point */}
              <div className="text-xl sm:text-2xl font-mono font-bold text-primary w-10 text-center">
                {getPointDisplay(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div className={cn(
          "p-3 sm:p-4 transition-colors",
          isWinner(playerTwoId) && "bg-primary/5"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {server === "p2" && (
                <motion.button 
                  layoutId="tennis-ball" 
                  onClick={onServerClick} 
                  className={cn(
                    "flex-shrink-0 p-1 rounded-full transition-colors",
                    onServerClick && !isInGame && "hover:bg-muted cursor-pointer"
                  )}
                  disabled={!onServerClick || isInGame}
                  whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                >
                  <TennisBallIcon className="w-4 h-4" />
                </motion.button>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base sm:text-lg truncate">
                  {playerTwoName}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {setsWon[1]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Set scores - hide on very small screens if more than 3 sets */}
              {score.sets.length <= 3 && (
                <div className="hidden sm:flex gap-1">
                  {score.sets.map((set, idx) => (
                    <div key={idx} className="text-sm font-mono w-5 text-center">
                      {set[1]}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current game score */}
              <div className="text-lg sm:text-xl font-mono font-bold w-6 text-center">
                {score.games[1]}
              </div>
              
              {/* Current point */}
              <div className="text-xl sm:text-2xl font-mono font-bold text-primary w-10 text-center">
                {getPointDisplay(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Set scores for mobile when > 3 sets */}
      {score.sets.length > 3 && (
        <div className="border-t p-2 sm:hidden">
          <div className="text-xs text-muted-foreground text-center mb-1">Set Scores</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center font-mono">
              {playerOneName.split(' ')[0]}: {score.sets.map(s => s[0]).join(' ')}
            </div>
            <div className="text-center font-mono">
              {playerTwoName.split(' ')[0]}: {score.sets.map(s => s[1]).join(' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 