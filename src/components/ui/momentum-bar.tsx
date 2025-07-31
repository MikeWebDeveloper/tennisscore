"use client"

import { motion, AnimatePresence } from '@/lib/framer-motion-config'
import { cn } from "@/lib/utils"
import { TrendingUp, Minus, VolumeX, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { playSound } from "@/lib/sounds"

interface PointDetail {
  winner: 'p1' | 'p2'
  pointNumber: number
  timestamp: string
}

interface MomentumBarProps {
  pointLog: PointDetail[]
  playerNames: { p1: string; p2: string }
  className?: string
  maxPoints?: number
  compact?: boolean
}

export function MomentumBar({ 
  pointLog, 
  playerNames, 
  className = "", 
  maxPoints = 12,
  compact = false
}: MomentumBarProps) {
  const [isMuted, setIsMuted] = useState(true) // Start muted by default
  const [lastPointCount, setLastPointCount] = useState(0)

  // Get the last N points for momentum calculation
  const recentPoints = pointLog.slice(-maxPoints)
  
  // Play sound effect when momentum shifts significantly
  useEffect(() => {
    if (recentPoints.length > lastPointCount && recentPoints.length >= 3 && !isMuted) {
      const lastThree = recentPoints.slice(-3)
      const p1Recent = lastThree.filter(p => p.winner === 'p1').length
      const p2Recent = lastThree.filter(p => p.winner === 'p2').length
      
      // Play sound when someone gets momentum (wins 2+ of last 3 points)
      if (p1Recent >= 2 || p2Recent >= 2) {
        playSound('point-won')
      }
    }
    setLastPointCount(recentPoints.length)
  }, [recentPoints.length, lastPointCount, isMuted, recentPoints])
  
  if (recentPoints.length === 0) {
    return null
  }

  // Calculate momentum trend over the last few points
  const getMomentumTrend = () => {
    if (recentPoints.length < 3) return "neutral"
    
    const lastThreePoints = recentPoints.slice(-3)
    const p1Points = lastThreePoints.filter(p => p.winner === 'p1').length
    const p2Points = lastThreePoints.filter(p => p.winner === 'p2').length
    
    if (p1Points >= 2) return "p1-up"
    if (p2Points >= 2) return "p2-up"
    return "neutral"
  }

  // Calculate overall momentum percentage
  const getMomentumPercentage = () => {
    const p1Points = recentPoints.filter(p => p.winner === 'p1').length
    const totalPoints = recentPoints.length
    return totalPoints > 0 ? (p1Points / totalPoints) * 100 : 50
  }

  const momentumTrend = getMomentumTrend()
  const momentumPercentage = getMomentumPercentage()
  
  // Determine which player has momentum
  const leadingPlayer = momentumPercentage > 60 ? 'p1' : momentumPercentage < 40 ? 'p2' : null

  const getTrendIcon = () => {
    switch (momentumTrend) {
      case "p1-up":
        return <TrendingUp className="h-3 w-3 text-blue-500" />
      case "p2-up":
        return <TrendingUp className="h-3 w-3 text-red-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const getMomentumText = () => {
    if (leadingPlayer === 'p1') {
      return `${playerNames.p1.split(' ')[0]} has momentum`
    } else if (leadingPlayer === 'p2') {
      return `${playerNames.p2.split(' ')[0]} has momentum`
    }
    return "Even momentum"
  }

  return (
    <div className={cn(
      "bg-card rounded-lg border space-y-2", 
      compact ? "p-2" : "p-3 space-y-3", 
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            {compact ? "Momentum" : "Match Momentum"}
          </span>
          {getTrendIcon()}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              compact ? "h-5 w-5 p-0" : "h-6 w-6 p-0"
            )}
          >
            {isMuted ? (
              <VolumeX className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            ) : (
              <Volume2 className={cn(compact ? "h-3 w-3" : "h-4 w-4")} />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {compact ? `${recentPoints.length}pts` : `Last ${recentPoints.length} points`}
          </span>
        </div>
      </div>

      {/* Momentum Bar */}
      <div className={cn(compact ? "space-y-1" : "space-y-2")}>
        <div className={cn(
          "relative bg-muted rounded-full overflow-hidden",
          compact ? "h-3" : "h-6"
        )}>
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-gray-100 to-red-100 dark:from-blue-950 dark:via-gray-800 dark:to-red-950" />
          
          {/* Momentum indicator */}
          <motion.div
            className={cn(
              "absolute top-0 h-full transition-colors duration-500",
              leadingPlayer === 'p1' ? "bg-gradient-to-r from-blue-500 to-blue-400" :
              leadingPlayer === 'p2' ? "bg-gradient-to-r from-red-400 to-red-500" :
              "bg-gradient-to-r from-gray-400 to-gray-500"
            )}
            initial={{ width: "50%" }}
            animate={{ width: `${momentumPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          
          {/* Center line */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-border transform -translate-x-px" />
        </div>

        {/* Point indicators */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "font-medium text-blue-600 dark:text-blue-400",
            compact ? "text-xs" : "text-xs"
          )}>
            {playerNames.p1.split(' ')[0]}
          </span>
          <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-0.5")}>
            <AnimatePresence mode="popLayout">
              {recentPoints.map((point, index) => (
                <motion.div
                  key={`${point.pointNumber}-${point.timestamp}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300
                  }}
                  className={cn(
                    "rounded-full border",
                    compact ? "w-1.5 h-1.5" : "w-2 h-2",
                    point.winner === 'p1' 
                      ? "bg-blue-500 border-blue-600" 
                      : "bg-red-500 border-red-600"
                  )}
                />
              ))}
            </AnimatePresence>
          </div>
          <span className={cn(
            "font-medium text-red-600 dark:text-red-400",
            compact ? "text-xs" : "text-xs"
          )}>
            {playerNames.p2.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Momentum text - Hide in compact mode */}
      {!compact && (
        <div className="text-center">
          <motion.p 
            key={leadingPlayer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-xs font-medium",
              leadingPlayer === 'p1' ? "text-blue-600 dark:text-blue-400" :
              leadingPlayer === 'p2' ? "text-red-600 dark:text-red-400" :
              "text-muted-foreground"
            )}
          >
            {getMomentumText()}
          </motion.p>
        </div>
      )}
    </div>
  )
} 