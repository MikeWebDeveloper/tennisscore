"use client"

import { Player } from "@/lib/types"

interface PlayerRatingDisplayProps {
  player: Player
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Always "12 BH": the profile field may hold "12" or an older "12BH", and older profiles kept it in the combined rating text. */
function getBhRating(player: Player): string | undefined {
  const raw = player.bhRating || player.rating?.match(/\b\d+\s*BH\b/i)?.[0]
  const value = raw?.replace(/\s*BH\s*$/i, '').trim()
  return value ? `${value} BH` : undefined
}

/** Always "260 CŽ", matching how BH is written. */
const getCzRanking = (player: Player) => player.czRanking ? `${player.czRanking} CŽ` : undefined

export function PlayerRatingDisplay({ player, className = "", size = 'md' }: PlayerRatingDisplayProps) {
  const bhRating = getBhRating(player)
  const czRanking = getCzRanking(player)
  
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
          {czRanking}
        </span>
      )}
    </div>
  )
}

// Utility function for legacy components that expect a single rating string
export function formatPlayerRating(player: Player): string {
  return [getBhRating(player), getCzRanking(player)].filter(Boolean).join(' • ')
}
