"use client"

import { Player } from "@/lib/types"

interface PlayerRatingDisplayProps {
  player: Player
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function PlayerRatingDisplay({ player, className = "", size = 'md' }: PlayerRatingDisplayProps) {
  const { bhRating, czRanking } = player
  
  // If neither rating is available, return null
  if (!bhRating && !czRanking) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  }

  return (
    <div className={`inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/30 ${sizeClasses[size]} ${className}`}>
      {bhRating && (
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {bhRating}
        </span>
      )}
      {bhRating && czRanking && (
        <span className="text-muted-foreground">•</span>
      )}
      {czRanking && (
        <span className="font-medium text-purple-600 dark:text-purple-400">
          CŽ {czRanking}
        </span>
      )}
    </div>
  )
}

// Utility function for legacy components that expect a single rating string
export function formatPlayerRating(player: Player): string {
  const { bhRating, czRanking } = player
  
  if (bhRating && czRanking) {
    return `${bhRating} CŽ ${czRanking}`
  } else if (bhRating) {
    return bhRating
  } else if (czRanking) {
    return `CŽ ${czRanking}`
  }
  
  return ''
}