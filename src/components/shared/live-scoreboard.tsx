"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { TennisBallIcon } from "./tennis-ball-icon"
import { Score, MatchFormat } from "@/stores/matchStore"
import { cn } from "@/lib/utils"
import { isBreakPoint, isSetPoint, isMatchPoint } from "@/lib/utils/tennis-scoring"
import { useEffect } from "react"

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
  playerOneClub?: string
  playerTwoClub?: string
  playerThreeClub?: string
  playerFourClub?: string
  score: Score
  currentServer?: "p1" | "p2" | null
  status?: string
  winnerId?: string
  playerOneId?: string
  playerTwoId?: string
  isInGame?: boolean
  onSetServer?: (server: 'p1' | 'p2') => void
  className?: string
  matchFormat?: MatchFormat
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
  playerOneClub,
  playerTwoClub,
  playerThreeClub,
  playerFourClub,
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
  useEffect(() => {
    // Force layout recalculation after mount to fix mobile alignment issues
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('resize'))
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])
  
  const isTiebreak = score.isTiebreak || false
  const server = currentServer
  
  // Check if this is a doubles match
  const isDoubles = !!(playerThreeName && playerFourName)
  
  // Use names directly as they come already formatted from formatPlayerFromObject
  const teamOneName = isDoubles 
    ? `${playerOneName} / ${playerThreeName}`
    : playerOneName
  const teamTwoName = isDoubles 
    ? `${playerTwoName} / ${playerFourName}`
    : playerTwoName

  // Dynamic font sizing based on name length
  const getNameFontSize = (name: string) => {
    const length = name.length
    if (length > 40) return "text-[10px] sm:text-xs"
    if (length > 30) return "text-[11px] sm:text-xs lg:text-sm"
    if (length > 20) return "text-xs sm:text-sm lg:text-base"
    return "text-xs sm:text-sm lg:text-base"
  }
  
  // Calculate sets won
  const setsWon = [
    score.sets.filter(set => set[0] > set[1]).length,
    score.sets.filter(set => set[1] > set[0]).length
  ]
  
  // Calculate current game situation status (BP, SP, MP)
  const getGameSituationStatus = () => {
    // Create a default match format if none provided
    const defaultFormat = {
      sets: 3 as const,
      noAd: false,
      tiebreak: true,
      finalSetTiebreak: "standard" as const,
      ...matchFormat
    }
    
    if (status !== "In Progress") {
      return { 
        isBreakPoint: false, 
        facingBreakPoint: null,
        isSetPoint: false,
        setPointPlayer: null,
        isMatchPoint: false,
        matchPointPlayer: null
      }
    }
    
    // Block BP/SP/MP at 40:40 in standard scoring
    if (!defaultFormat.noAd && score.points[0] === 3 && score.points[1] === 3 && !isTiebreak) {
      return {
        isBreakPoint: false,
        facingBreakPoint: null,
        isSetPoint: false,
        setPointPlayer: null,
        isMatchPoint: false,
        matchPointPlayer: null
      }
    }

    let breakPointInfo: { isBreakPoint: boolean; facingBreakPoint: "p1" | "p2" | null } = { isBreakPoint: false, facingBreakPoint: null }
    
    // Break point only applies in regular games (not tiebreaks)
    if (!isTiebreak && server) {
      const serverPoints = server === 'p1' ? score.points[0] : score.points[1]
      const returnerPoints = server === 'p1' ? score.points[1] : score.points[0]
      
      const isCurrentlyBreakPoint = isBreakPoint(serverPoints, returnerPoints, defaultFormat.noAd)
      const returner = server === 'p1' ? 'p2' : 'p1'
      
      breakPointInfo = {
        isBreakPoint: isCurrentlyBreakPoint,
        facingBreakPoint: isCurrentlyBreakPoint ? returner : null
      }
    }
    
    // Set point check
    const setPointInfo = isSetPoint(
      score.games[0], 
      score.games[1], 
      isTiebreak ? (score.tiebreakPoints?.[0] || 0) : score.points[0], 
      isTiebreak ? (score.tiebreakPoints?.[1] || 0) : score.points[1],
      defaultFormat,
      isTiebreak,
      score.sets
    )
    
    // Match point check
    const matchPointInfo = isMatchPoint(
      score.games[0], 
      score.games[1], 
      isTiebreak ? (score.tiebreakPoints?.[0] || 0) : score.points[0], 
      isTiebreak ? (score.tiebreakPoints?.[1] || 0) : score.points[1],
      score.sets,
      defaultFormat,
      isTiebreak
    )
    
    return {
      ...breakPointInfo,
      isSetPoint: setPointInfo.isSetPoint,
      setPointPlayer: setPointInfo.player,
      isMatchPoint: matchPointInfo.isMatchPoint,
      matchPointPlayer: matchPointInfo.player
    }
  }
  
  const gameStatus = getGameSituationStatus()
  
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
    <div 
      className={cn("bg-card rounded-lg border shadow-sm", className)}
      suppressHydrationWarning={true}
    >
      <div className="divide-y">
        {/* Player 1 */}
        <div 
          className={cn(
            "p-2 sm:p-4 transition-colors",
            isWinner(playerOneId) && "bg-primary/5",
            gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p1' && "bg-orange-50 dark:bg-orange-950/20",
            gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p1' && "bg-blue-50 dark:bg-blue-950/20",
            gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p1' && "bg-red-50 dark:bg-red-950/20",
            onSetServer && !isInGame && "cursor-pointer hover:bg-muted"
          )}
          onClick={!isInGame ? () => onSetServer?.('p1') : undefined}
          role={!isInGame ? "button" : undefined}
          aria-label={!isInGame ? `Set ${teamOneName} as server` : undefined}
          tabIndex={!isInGame ? 0 : -1}
          suppressHydrationWarning={true}
        >
          {/* SIMPLIFIED MOBILE-FIRST LAYOUT: Clean flexbox for iOS Safari compatibility */}
          <div className="ios-safe-layout">
            {/* Left: Player info - Always takes available space */}
            <div className="player-names-section">
              {playerOneAvatar || (
                <div className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0"></div>
              )}
              <div className="player-text-content">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h3 
                    className={cn(
                      "font-semibold player-name-text",
                      getNameFontSize(teamOneName)
                    )}
                  >
                    {teamOneName}
                  </h3>
                  {/* Game situation badges with priority: MP > SP > BP */}
                  {gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p1' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-[10px] font-bold bg-red-500 hover:bg-red-600 px-1 py-0.5">
                        MP
                      </Badge>
                    </motion.div>
                  )}
                  {gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p1' && !gameStatus.isMatchPoint && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="secondary" className="text-[10px] font-bold bg-blue-500 hover:bg-blue-600 text-white px-1 py-0.5">
                        SP
                      </Badge>
                    </motion.div>
                  )}
                  {gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p1' && !gameStatus.isSetPoint && !gameStatus.isMatchPoint && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 px-1 py-0.5">
                        BP
                      </Badge>
                    </motion.div>
                  )}
                </div>
                {/* Tiny player details */}
                <div className="space-y-0.5">
                  <div className="player-details-line">
                    {playerOneYearOfBirth && (
                      <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        {playerOneYearOfBirth}
                      </span>
                    )}
                    {playerOneRating && (
                      <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        ({playerOneRating})
                      </span>
                    )}
                    {isDoubles && playerThreeYearOfBirth && (
                      <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        / {playerThreeYearOfBirth}
                      </span>
                    )}
                    {isDoubles && playerThreeRating && (
                      <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        ({playerThreeRating})
                      </span>
                    )}
                  </div>
                  {(playerOneClub || (isDoubles && playerThreeClub)) && (
                    <div className="player-details-line">
                      {playerOneClub && (
                        <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium">
                          {playerOneClub}
                        </span>
                      )}
                      {isDoubles && playerThreeClub && (
                        <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium">
                          {playerOneClub ? " / " : ""}{playerThreeClub}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Score - Fixed width, always right */}
            <div className="score-section">
              {/* Serving Indicator */}
              <div 
                className={cn(
                  "flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6",
                  onSetServer && !isInGame && "cursor-pointer hover:bg-muted rounded-full transition-colors"
                )}
                onClick={onSetServer && !isInGame ? () => onSetServer('p1') : undefined}
                role={onSetServer && !isInGame ? "button" : undefined}
                aria-label={onSetServer && !isInGame ? `Set ${teamOneName} as server` : undefined}
                tabIndex={onSetServer && !isInGame ? 0 : -1}
              >
                {(server === "p1" || (onSetServer && !isInGame)) && (
                  <TennisBallIcon
                    className="w-2.5 h-2.5 sm:w-4 sm:h-4"
                    isServing={server === "p1"}
                  />
                )}
              </div>
              
              {/* Sets Won Count */}
              <div className="text-center min-w-[14px] sm:min-w-[20px]">
                <div className="text-xs sm:text-sm font-medium font-mono">
                  {setsWon[0]}
                </div>
              </div>
              
              {/* Individual Set Scores */}
              <div className="flex gap-0.5">
                {score.sets.length > 0 ? (
                  score.sets.map((set, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "text-[9px] sm:text-[10px] font-medium min-w-[12px] sm:min-w-[16px] h-3 sm:h-4 flex items-center justify-center rounded border",
                        set[0] > set[1] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {set[0]}
                    </div>
                  ))
                ) : (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground min-w-[12px] sm:min-w-[16px] text-center">-</div>
                )}
              </div>
              
              {/* Current Games */}
              <div className="text-center min-w-[14px] sm:min-w-[20px]">
                <div className="text-sm sm:text-base font-medium font-mono">
                  {score.games[0]}
                </div>
              </div>
              
              {/* Current Points - Larger font as requested */}
              <div className="text-center min-w-[20px] sm:min-w-[28px]">
                <div className={cn(
                  "text-sm sm:text-lg lg:text-xl font-medium font-mono",
                  gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p1' 
                    ? "text-red-600 dark:text-red-400"
                    : gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p1'
                    ? "text-blue-600 dark:text-blue-400"
                    : gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p1' 
                    ? "text-orange-600 dark:text-orange-400"
                    : ""
                )}>
                  {getPointDisplay(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 */}
        <div 
          className={cn(
            "p-2 sm:p-4 transition-colors",
            isWinner(playerTwoId) && "bg-primary/5",
            gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p2' && "bg-orange-50 dark:bg-orange-950/20",
            gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p2' && "bg-blue-50 dark:bg-blue-950/20",
            gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p2' && "bg-red-50 dark:bg-red-950/20",
            onSetServer && !isInGame && "cursor-pointer hover:bg-muted"
          )}
          onClick={!isInGame ? () => onSetServer?.('p2') : undefined}
          role={!isInGame ? "button" : undefined}
          aria-label={!isInGame ? `Set ${teamTwoName} as server` : undefined}
          tabIndex={!isInGame ? 0 : -1}
          suppressHydrationWarning={true}
        >
          {/* SIMPLIFIED MOBILE-FIRST LAYOUT: Clean flexbox for iOS Safari compatibility */}
          <div className="ios-safe-layout">
            {/* Left: Player info - Always takes available space */}
            <div className="player-names-section">
              {playerTwoAvatar || (
                <div className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0"></div>
              )}
              <div className="player-text-content">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h3 
                    className={cn(
                      "font-semibold player-name-text",
                      getNameFontSize(teamTwoName)
                    )}
                  >
                    {teamTwoName}
                  </h3>
                  {/* Game situation badges with priority: MP > SP > BP */}
                  {gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p2' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-[10px] font-bold bg-red-500 hover:bg-red-600 px-1 py-0.5">
                        MP
                      </Badge>
                    </motion.div>
                  )}
                  {gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p2' && !gameStatus.isMatchPoint && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="secondary" className="text-[10px] font-bold bg-blue-500 hover:bg-blue-600 text-white px-1 py-0.5">
                        SP
                      </Badge>
                    </motion.div>
                  )}
                  {gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p2' && !gameStatus.isSetPoint && !gameStatus.isMatchPoint && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-shrink-0"
                    >
                      <Badge variant="destructive" className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 px-1 py-0.5">
                        BP
                      </Badge>
                    </motion.div>
                  )}
                </div>
                {/* Tiny player details */}
                <div className="space-y-0.5">
                  <div className="player-details-line">
                    {playerTwoYearOfBirth && (
                      <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        {playerTwoYearOfBirth}
                      </span>
                    )}
                    {playerTwoRating && (
                      <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        ({playerTwoRating})
                      </span>
                    )}
                    {isDoubles && playerFourYearOfBirth && (
                      <span className="text-[9px] sm:text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        / {playerFourYearOfBirth}
                      </span>
                    )}
                    {isDoubles && playerFourRating && (
                      <span className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        ({playerFourRating})
                      </span>
                    )}
                  </div>
                  {(playerTwoClub || (isDoubles && playerFourClub)) && (
                    <div className="player-details-line">
                      {playerTwoClub && (
                        <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium">
                          {playerTwoClub}
                        </span>
                      )}
                      {isDoubles && playerFourClub && (
                        <span className="text-[9px] sm:text-[10px] text-green-600 dark:text-green-400 font-medium">
                          {playerTwoClub ? " / " : ""}{playerFourClub}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Score - Fixed width, always right */}
            <div className="score-section">
              {/* Serving Indicator */}
              <div 
                className={cn(
                  "flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6",
                  onSetServer && !isInGame && "cursor-pointer hover:bg-muted rounded-full transition-colors"
                )}
                onClick={onSetServer && !isInGame ? () => onSetServer('p2') : undefined}
                role={onSetServer && !isInGame ? "button" : undefined}
                aria-label={onSetServer && !isInGame ? `Set ${teamTwoName} as server` : undefined}
                tabIndex={onSetServer && !isInGame ? 0 : -1}
              >
                {(server === "p2" || (onSetServer && !isInGame)) && (
                  <TennisBallIcon
                    className="w-2.5 h-2.5 sm:w-4 sm:h-4"
                    isServing={server === "p2"}
                  />
                )}
              </div>
              
              {/* Sets Won Count */}
              <div className="text-center min-w-[14px] sm:min-w-[20px]">
                <div className="text-xs sm:text-sm font-medium font-mono">
                  {setsWon[1]}
                </div>
              </div>
              
              {/* Individual Set Scores */}
              <div className="flex gap-0.5">
                {score.sets.length > 0 ? (
                  score.sets.map((set, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "text-[9px] sm:text-[10px] font-medium min-w-[12px] sm:min-w-[16px] h-3 sm:h-4 flex items-center justify-center rounded border",
                        set[1] > set[0] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {set[1]}
                    </div>
                  ))
                ) : (
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground min-w-[12px] sm:min-w-[16px] text-center">-</div>
                )}
              </div>
              
              {/* Current Games */}
              <div className="text-center min-w-[14px] sm:min-w-[20px]">
                <div className="text-sm sm:text-base font-medium font-mono">
                  {score.games[1]}
                </div>
              </div>
              
              {/* Current Points - Larger font as requested */}
              <div className="text-center min-w-[20px] sm:min-w-[28px]">
                <div className={cn(
                  "text-sm sm:text-lg lg:text-xl font-medium font-mono",
                  gameStatus.isMatchPoint && gameStatus.matchPointPlayer === 'p2' 
                    ? "text-red-600 dark:text-red-400"
                    : gameStatus.isSetPoint && gameStatus.setPointPlayer === 'p2'
                    ? "text-blue-600 dark:text-blue-400"
                    : gameStatus.isBreakPoint && gameStatus.facingBreakPoint === 'p2' 
                    ? "text-orange-600 dark:text-orange-400"
                    : ""
                )}>
                  {getPointDisplay(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 