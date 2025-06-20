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
      {/* Minimalist layout */}
      <div className="divide-y">
        {/* Player 1 */}
        <div className={cn(
          "p-2 sm:p-3 transition-colors",
          isWinner(playerOneId) && "bg-primary/5"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Always show tennis ball icon, colored for server, grayed for non-server */}
              <motion.button 
                layoutId="tennis-ball-p1" 
                onClick={onServerClick} 
                className={cn(
                  "flex-shrink-0 p-1 rounded-full transition-colors",
                  onServerClick && !isInGame && "hover:bg-muted cursor-pointer",
                  server === "p1" ? "text-primary" : "text-muted-foreground/40"
                )}
                disabled={!onServerClick || isInGame}
                whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                title={server === "p1" ? "Currently serving" : "Click to change server"}
              >
                <TennisBallIcon className={cn(
                  "w-4 h-4 transition-colors",
                  server === "p1" ? "fill-current" : "stroke-current fill-transparent"
                )} />
              </motion.button>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {playerOneName}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                {setsWon[0]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Set scores - show on larger screens */}
              {score.sets.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {score.sets.map((set, idx) => (
                    <div key={idx} className="text-xs font-mono w-4 text-center">
                      {set[0]}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current game score */}
              <div className="text-sm sm:text-base font-mono font-semibold w-4 text-center">
                {score.games[0]}
              </div>
              
              {/* Current point */}
              <div className="text-base sm:text-lg font-mono font-bold text-primary w-8 text-center">
                {getPointDisplay(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div className={cn(
          "p-2 sm:p-3 transition-colors",
          isWinner(playerTwoId) && "bg-primary/5"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Always show tennis ball icon, colored for server, grayed for non-server */}
              <motion.button 
                layoutId="tennis-ball-p2" 
                onClick={onServerClick} 
                className={cn(
                  "flex-shrink-0 p-1 rounded-full transition-colors",
                  onServerClick && !isInGame && "hover:bg-muted cursor-pointer",
                  server === "p2" ? "text-primary" : "text-muted-foreground/40"
                )}
                disabled={!onServerClick || isInGame}
                whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                title={server === "p2" ? "Currently serving" : "Click to change server"}
              >
                <TennisBallIcon className={cn(
                  "w-4 h-4 transition-colors",
                  server === "p2" ? "fill-current" : "stroke-current fill-transparent"
                )} />
              </motion.button>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {playerTwoName}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                {setsWon[1]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Set scores - show on larger screens */}
              {score.sets.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {score.sets.map((set, idx) => (
                    <div key={idx} className="text-xs font-mono w-4 text-center">
                      {set[1]}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Current game score */}
              <div className="text-sm sm:text-base font-mono font-semibold w-4 text-center">
                {score.games[1]}
              </div>
              
              {/* Current point */}
              <div className="text-base sm:text-lg font-mono font-bold text-primary w-8 text-center">
                {getPointDisplay(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Set scores for mobile when sets exist */}
      {score.sets.length > 0 && (
        <div className="border-t p-2 sm:hidden">
          <div className="text-xs text-muted-foreground text-center mb-1">Sets</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
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