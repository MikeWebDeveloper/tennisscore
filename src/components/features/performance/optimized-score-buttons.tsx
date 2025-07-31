"use client"

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n'
import { useScoreButtonFeedback } from '@/hooks/use-optimistic-scoring'
type PointWinner = 'player1' | 'player2'

interface OptimizedScoreButtonProps {
  winner: PointWinner
  playerName: string
  onScore: (winner: PointWinner) => void
  disabled?: boolean
  className?: string
}

/**
 * High-performance score button with micro-interactions
 * Target: <16ms render time, <100ms total interaction
 */
const OptimizedScoreButton = memo(function OptimizedScoreButton({
  winner,
  playerName,
  onScore,
  disabled = false,
  className
}: OptimizedScoreButtonProps) {
  const t = useTranslations('match')
  const { isPressed, triggerFeedback } = useScoreButtonFeedback()

  const handleScore = useCallback(() => {
    if (disabled) return
    
    // Immediate visual feedback
    triggerFeedback()
    
    // Score action
    onScore(winner)
  }, [winner, onScore, disabled, triggerFeedback])

  return (
    <Button
      onClick={handleScore}
      disabled={disabled}
      className={cn(
        // Base styles
        'relative h-16 text-lg font-semibold transition-all duration-150',
        'active:scale-95 hover:scale-105',
        
        // Performance optimizations
        'will-change-transform transform-gpu',
        
        // Pressed state with immediate feedback
        isPressed && [
          'scale-95 bg-primary/80',
          'shadow-inner shadow-primary/50',
          'duration-0' // Instant feedback
        ],
        
        // Player-specific styling
        winner === 'player1' && 'bg-blue-600 hover:bg-blue-700 text-white',
        winner === 'player2' && 'bg-green-600 hover:bg-green-700 text-white',
        
        className
      )}
      // Performance attributes
      suppressHydrationWarning
      style={{
        // Hardware acceleration hints
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {/* Visual feedback overlay */}
      {isPressed && (
        <div className="absolute inset-0 bg-white/20 rounded-md animate-pulse" />
      )}
      
      <span className="relative z-10">
        {t('scorePoint', { player: playerName })}
      </span>
    </Button>
  )
})

interface ScoreButtonPairProps {
  player1Name: string
  player2Name: string
  onScore: (winner: PointWinner) => void
  disabled?: boolean
}

/**
 * Optimized button pair for tennis scoring
 * Uses React.memo and efficient event handling
 */
export const ScoreButtonPair = memo(function ScoreButtonPair({
  player1Name,
  player2Name,
  onScore,
  disabled = false
}: ScoreButtonPairProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-lg mx-auto">
      <OptimizedScoreButton
        winner="player1"
        playerName={player1Name}
        onScore={onScore}
        disabled={disabled}
        className="rounded-l-lg"
      />
      <OptimizedScoreButton
        winner="player2"
        playerName={player2Name}
        onScore={onScore}
        disabled={disabled}
        className="rounded-r-lg"
      />
    </div>
  )
})

export default OptimizedScoreButton