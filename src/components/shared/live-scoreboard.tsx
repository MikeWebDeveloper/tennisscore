"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { TennisBallIcon } from "./tennis-ball-icon"
import { Score } from "@/lib/types"
import { cn } from "@/lib/utils"
import { isBreakPoint } from "@/lib/utils/tennis-scoring"
import { useTranslations } from "@/hooks/use-translations"

interface LiveScoreboardProps {
  playerOneName: string
  playerTwoName: string
  playerThreeName?: string  // For doubles
  playerFourName?: string   // For doubles
  playerOneYearOfBirth?: number
  playerTwoYearOfBirth?: number
  playerThreeYearOfBirth?: number
  playerFourYearOfBirth?: number
  playerOneRating?: string
  playerTwoRating?: string
  playerThreeRating?: string
  playerFourRating?: string
  score: Score & { server?: "p1" | "p2", isTiebreak?: boolean, tiebreakPoints?: number[] }
  currentServer?: "p1" | "p2" | null
  status?: string
  winnerId?: string
  playerOneId?: string
  playerTwoId?: string
  isInGame?: boolean
  onServerClick?: () => void
  className?: string
  matchFormat?: { noAd?: boolean }
}

export function LiveScoreboard({
  playerOneName,
  playerTwoName,
  playerThreeName,
  playerFourName,
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
  onServerClick,
  className,
  matchFormat
}: LiveScoreboardProps) {
  const t = useTranslations()
  const isTiebreak = score.isTiebreak || false
  const server = currentServer || score.server
  
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
  
  // Format year and rating display for teams
  const formatPlayerInfo = (year?: number, rating?: string) => {
    if (!year && !rating) return undefined
    if (year && rating) return `${year} (${rating})`
    if (year) return year.toString()
    if (rating) return `(${rating})`
    return undefined
  }
  
  const teamOneYear = isDoubles && (playerOneYearOfBirth || playerOneRating) && (playerThreeYearOfBirth || playerThreeRating)
    ? `${formatPlayerInfo(playerOneYearOfBirth, playerOneRating)} / ${formatPlayerInfo(playerThreeYearOfBirth, playerThreeRating)}`
    : formatPlayerInfo(playerOneYearOfBirth, playerOneRating)
  
  const teamTwoYear = isDoubles && (playerTwoYearOfBirth || playerTwoRating) && (playerFourYearOfBirth || playerFourRating)
    ? `${formatPlayerInfo(playerTwoYearOfBirth, playerTwoRating)} / ${formatPlayerInfo(playerFourYearOfBirth, playerFourRating)}`
    : formatPlayerInfo(playerTwoYearOfBirth, playerTwoRating)
  
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
          isWinner(playerOneId) && "bg-primary/5",
          breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' && "bg-orange-50 dark:bg-orange-950/20"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Tennis ball icon - shows who is serving */}
              <motion.button 
                layoutId="tennis-ball-p1" 
                onClick={onServerClick} 
                className={cn(
                  "flex-shrink-0 p-1 rounded-full transition-colors",
                  onServerClick && !isInGame && "hover:bg-muted cursor-pointer"
                )}
                disabled={!onServerClick || isInGame}
                whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                title={server === "p1" ? "Currently serving" : "Click to change server"}
              >
                <TennisBallIcon 
                  className="w-4 h-4"
                  isServing={server === "p1"}
                />
              </motion.button>
              <div className="min-w-0 flex-1">
                {teamOneYear && (
                  <div className="text-xs text-muted-foreground">
                    {teamOneYear}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm sm:text-base truncate">
                    {teamOneName}
                  </h3>
                  {/* Breakpoint indicator */}
                  {breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600 px-1.5 py-0.5">
                        {t('breakPoint')}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                {setsWon[0]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Set scores - show previous sets inline */}
              {score.sets.length > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    {score.sets.map((set, idx) => (
                      <div key={idx} className="text-xs font-mono w-4 text-center">
                        {set[0]}
                      </div>
                    ))}
                  </div>
                  {/* Divider after played sets */}
                  <div className="w-px h-4 bg-border"></div>
                </>
              )}
              
              {/* Current game score */}
              <div className="text-sm sm:text-base font-mono font-semibold w-4 text-center">
                {score.games[0]}
              </div>
              
              {/* Divider before current point */}
              <div className="w-px h-4 bg-border"></div>
              
              {/* Current point */}
              <div className={cn(
                "text-base sm:text-lg font-mono font-bold w-8 text-center",
                breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p1' 
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-primary"
              )}>
                {getPointDisplay(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div className={cn(
          "p-2 sm:p-3 transition-colors",
          isWinner(playerTwoId) && "bg-primary/5",
          breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' && "bg-orange-50 dark:bg-orange-950/20"
        )}>
          <div className="flex items-center justify-between gap-2">
            {/* Name and server indicator */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Tennis ball icon - shows who is serving */}
              <motion.button 
                layoutId="tennis-ball-p2" 
                onClick={onServerClick} 
                className={cn(
                  "flex-shrink-0 p-1 rounded-full transition-colors",
                  onServerClick && !isInGame && "hover:bg-muted cursor-pointer"
                )}
                disabled={!onServerClick || isInGame}
                whileTap={onServerClick && !isInGame ? { scale: 0.95 } : {}}
                title={server === "p2" ? "Currently serving" : "Click to change server"}
              >
                <TennisBallIcon 
                  className="w-4 h-4"
                  isServing={server === "p2"}
                />
              </motion.button>
              <div className="min-w-0 flex-1">
                {teamTwoYear && (
                  <div className="text-xs text-muted-foreground">
                    {teamTwoYear}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm sm:text-base truncate">
                    {teamTwoName}
                  </h3>
                  {/* Breakpoint indicator */}
                  {breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600 px-1.5 py-0.5">
                        {t('breakPoint')}
                      </Badge>
                    </motion.div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs flex-shrink-0 px-1.5 py-0.5">
                {setsWon[1]}
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Set scores - show previous sets inline */}
              {score.sets.length > 0 && (
                <>
                  <div className="flex items-center gap-1">
                    {score.sets.map((set, idx) => (
                      <div key={idx} className="text-xs font-mono w-4 text-center">
                        {set[1]}
                      </div>
                    ))}
                  </div>
                  {/* Divider after played sets */}
                  <div className="w-px h-4 bg-border"></div>
                </>
              )}
              
              {/* Current game score */}
              <div className="text-sm sm:text-base font-mono font-semibold w-4 text-center">
                {score.games[1]}
              </div>
              
              {/* Divider before current point */}
              <div className="w-px h-4 bg-border"></div>
              
              {/* Current point */}
              <div className={cn(
                "text-base sm:text-lg font-mono font-bold w-8 text-center",
                breakPointStatus.isBreakPoint && breakPointStatus.facingBreakPoint === 'p2' 
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-primary"
              )}>
                {getPointDisplay(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
      

    </div>
  )
} 