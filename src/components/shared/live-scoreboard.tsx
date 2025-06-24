"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { TennisBallIcon } from "./tennis-ball-icon"
import { Score } from "@/stores/matchStore"
import { cn } from "@/lib/utils"
import { isBreakPoint } from "@/lib/utils/tennis-scoring"

interface LiveScoreboardProps {
  playerOneName: string
  playerTwoName: string
  playerThreeName?: string  // For doubles
  playerFourName?: string   // For doubles
  playerOneAvatar?: React.ReactNode
  playerTwoAvatar?: React.ReactNode
  playerOneYearOfBirth?: number
  playerTwoYearOfBirth?: number
  playerThreeYearOfBirth?: number
  playerFourYearOfBirth?: number
  playerOneRating?: string
  playerTwoRating?: string
  playerThreeRating?: string
  playerFourRating?: string
  score: Score
  currentServer?: "p1" | "p2" | null
  status?: string
  winnerId?: string
  playerOneId?: string
  playerTwoId?: string
  isInGame?: boolean
  onSetServer?: (server: 'p1' | 'p2') => void
  className?: string
  matchFormat?: { noAd?: boolean }
}

export function LiveScoreboard({
  playerOneName,
  playerTwoName,
  playerThreeName,
  playerFourName,
  playerOneAvatar,
  playerTwoAvatar,
  playerOneYearOfBirth,
  playerTwoYearOfBirth,
  playerThreeYearOfBirth,
  playerFourYearOfBirth,
  playerOneRating,
  playerTwoRating,
  playerThreeRating,
  playerFourRating,
  score,
  currentServer,
  status = "In Progress",
  winnerId,
  playerOneId,
  playerTwoId,
  isInGame = false,
  onSetServer,
  className,
  matchFormat
}: LiveScoreboardProps) {
  const isTiebreak = score.isTiebreak || false
  const server = currentServer
  
  // Check if this is a doubles match
  const isDoubles = !!(playerThreeName && playerFourName)
  
  // Format team names for doubles - use initial + last name for doubles
  const formatPlayerName = (fullName: string) => {
    const parts = fullName.split(' ')
    if (parts.length < 2) return fullName
    return `${parts[0][0]}. ${parts[parts.length - 1]}`
  }
  
  const teamOneName = isDoubles 
    ? `${formatPlayerName(playerOneName)} / ${formatPlayerName(playerThreeName!)}`
    : playerOneName
  const teamTwoName = isDoubles 
    ? `${formatPlayerName(playerTwoName)} / ${formatPlayerName(playerFourName!)}`
    : playerTwoName
  
  // Calculate sets won
  const setsWon = [
    score.sets.filter(set => set[0] > set[1]).length,
    score.sets.filter(set => set[1] > set[0]).length
  ]
  
  // Calculate current breakpoint status
  const getBreakPointStatus = () => {
    if (status !== "In Progress" || isTiebreak || !server) return { isBreakPoint: false, facingBreakPoint: null }
    
    const serverPoints = server === 'p1' ? score.points[0] : score.points[1]
    const returnerPoints = server === 'p1' ? score.points[1] : score.points[0]
    
    const isCurrentlyBreakPoint = isBreakPoint(serverPoints, returnerPoints, matchFormat?.noAd || false)
    
    // The RETURNER has the breakpoint opportunity (should get the BP badge)
    const returner = server === 'p1' ? 'p2' : 'p1'
    
    return {
      isBreakPoint: isCurrentlyBreakPoint,
      facingBreakPoint: isCurrentlyBreakPoint ? returner : null  // RETURNER gets the BP badge
    }
  }
  
  const breakPointStatus = getBreakPointStatus()
  
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

  const isWinner = (playerId?: string) => winnerId && playerId && winnerId === playerId

  return (
    <div className={cn("bg-card rounded-lg border shadow-sm", className)}>
      <div className="divide-y">
        {/* Player 1 */}
        <div 
          className={cn(
            "p-4 transition-colors",
            isWinner(playerOneId) && "bg-primary/5",
            breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' && "bg-orange-50 dark:bg-orange-950/20",
            onSetServer && !isInGame && "cursor-pointer hover:bg-muted"
          )}
          onClick={!isInGame ? () => onSetServer?.('p1') : undefined}
          role={!isInGame ? "button" : undefined}
          aria-label={!isInGame ? `Set ${teamOneName} as server` : undefined}
          tabIndex={!isInGame ? 0 : -1}
        >
          {/* Mobile-First Layout: Stacked on small screens, side-by-side on larger screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left: Player info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {/* Serving Indicator */}
                <div className="flex items-center justify-center w-7 h-7">
                  {(server === "p1" || (onSetServer && !isInGame)) && (
                    <TennisBallIcon
                      className="w-5 h-5"
                      isServing={server === "p1"}
                    />
                  )}
                </div>
                {playerOneAvatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg sm:text-xl truncate">
                    {teamOneName}
                  </h3>
                  {breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600">
                        BREAK POINT
                      </Badge>
                    </motion.div>
                  )}
                </div>
                {/* Player details */}
                <div className="flex items-center gap-2 mt-1">
                  {playerOneYearOfBirth && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {playerOneYearOfBirth}
                    </span>
                  )}
                  {playerOneRating && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      ({playerOneRating})
                    </span>
                  )}
                  {isDoubles && playerThreeYearOfBirth && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      / {playerThreeYearOfBirth}
                    </span>
                  )}
                  {isDoubles && playerThreeRating && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      ({playerThreeRating})
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Score Section - Clean horizontal layout */}
            <div className="flex items-center justify-end gap-4 sm:gap-6">
              {/* Sets Won */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">SETS</div>
                <div className="text-2xl font-bold font-mono">
                  {setsWon[0]}
                </div>
              </div>
              
              {/* Individual Set Scores */}
              {score.sets.length > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">SETS</div>
                  <div className="flex gap-1">
                    {score.sets.map((set, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-sm font-medium min-w-[24px] h-8 flex items-center justify-center rounded border",
                          set[0] > set[1] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {set[0]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current Games */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">GAMES</div>
                <div className="text-2xl font-bold font-mono">
                  {score.games[0]}
                </div>
              </div>
              
              {/* Current Points */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {isTiebreak ? "POINTS" : "SCORE"}
                </div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' 
                    ? "text-orange-600 dark:text-orange-400"
                    : ""
                )}>
                  {getPointDisplay(0) || "0"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div 
          className={cn(
            "p-4 transition-colors",
            isWinner(playerTwoId) && "bg-primary/5",
            breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' && "bg-orange-50 dark:bg-orange-950/20",
            onSetServer && !isInGame && "cursor-pointer hover:bg-muted"
          )}
          onClick={!isInGame ? () => onSetServer?.('p2') : undefined}
          role={!isInGame ? "button" : undefined}
          aria-label={!isInGame ? `Set ${teamTwoName} as server` : undefined}
          tabIndex={!isInGame ? 0 : -1}
        >
          {/* Mobile-First Layout: Stacked on small screens, side-by-side on larger screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left: Player info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {/* Serving Indicator */}
                <div className="flex items-center justify-center w-7 h-7">
                  {(server === "p2" || (onSetServer && !isInGame)) && (
                    <TennisBallIcon
                      className="w-5 h-5"
                      isServing={server === "p2"}
                    />
                  )}
                </div>
                {playerTwoAvatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg sm:text-xl truncate">
                    {teamTwoName}
                  </h3>
                  {breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600">
                        BREAK POINT
                      </Badge>
                    </motion.div>
                  )}
                </div>
                {/* Player details */}
                <div className="flex items-center gap-2 mt-1">
                  {playerTwoYearOfBirth && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {playerTwoYearOfBirth}
                    </span>
                  )}
                  {playerTwoRating && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      ({playerTwoRating})
                    </span>
                  )}
                  {isDoubles && playerFourYearOfBirth && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      / {playerFourYearOfBirth}
                    </span>
                  )}
                  {isDoubles && playerFourRating && (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      ({playerFourRating})
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Score Section - Clean horizontal layout */}
            <div className="flex items-center justify-end gap-4 sm:gap-6">
              {/* Sets Won */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">SETS</div>
                <div className="text-2xl font-bold font-mono">
                  {setsWon[1]}
                </div>
              </div>
              
              {/* Individual Set Scores */}
              {score.sets.length > 0 && (
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">SETS</div>
                  <div className="flex gap-1">
                    {score.sets.map((set, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-sm font-medium min-w-[24px] h-8 flex items-center justify-center rounded border",
                          set[1] > set[0] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {set[1]}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Current Games */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">GAMES</div>
                <div className="text-2xl font-bold font-mono">
                  {score.games[1]}
                </div>
              </div>
              
              {/* Current Points */}
              <div className="flex flex-col items-center">
                <div className="text-xs text-muted-foreground mb-1">
                  {isTiebreak ? "POINTS" : "SCORE"}
                </div>
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' 
                    ? "text-orange-600 dark:text-orange-400"
                    : ""
                )}>
                  {getPointDisplay(1) || "0"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 