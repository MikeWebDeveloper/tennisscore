"use client"

import { motion } from "framer-motion"
import { EnhancedMatchStats } from "@/lib/utils/match-stats"

interface MinimalistStatsProps {
  matchStats: EnhancedMatchStats
  playerNames: {
    p1: string
    p2: string
  }
}

interface StatRowProps {
  label: string
  player1Value: number | string
  player2Value: number | string
  isPercentage?: boolean
  player1Detail?: string
  player2Detail?: string
  delay?: number
}

function StatRow({ 
  label, 
  player1Value, 
  player2Value, 
  isPercentage = false,
  player1Detail,
  player2Detail,
  delay = 0
}: StatRowProps) {
  // Calculate percentages for the progress bars
  const p1Num = typeof player1Value === 'string' ? parseFloat(player1Value) : player1Value
  const p2Num = typeof player2Value === 'string' ? parseFloat(player2Value) : player2Value
  
  let p1Percentage = 50
  let p2Percentage = 50
  
  if (isPercentage) {
    // For percentage values, use them directly (capped at 100)
    p1Percentage = Math.min(Math.max(p1Num, 0), 100)
    p2Percentage = Math.min(Math.max(p2Num, 0), 100)
  } else if (p1Num + p2Num > 0) {
    // For absolute values, calculate relative percentages
    const total = p1Num + p2Num
    p1Percentage = (p1Num / total) * 100
    p2Percentage = (p2Num / total) * 100
  }

  const displayValue1 = isPercentage ? `${p1Num}%` : player1Value.toString()
  const displayValue2 = isPercentage ? `${p2Num}%` : player2Value.toString()

  // Check if either value is 100% to add extra spacing
  const hasMaxValue = (isPercentage && (p1Num === 100 || p2Num === 100)) || 
                     (!isPercentage && (p1Percentage === 100 || p2Percentage === 100))

  return (
    <motion.div 
      className="py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.15, duration: 0.4 }}
    >
      {/* Category label */}
      <div className="text-center mb-1.5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {/* Progress bars with values at the ends */}
      <div className="relative flex items-center">
        {/* Player 1 value (left) */}
        <div className={`text-right pr-3 ${hasMaxValue ? 'w-14' : 'w-12'}`}>
          <div className="text-base font-bold text-gray-900">{displayValue1}</div>
          {player1Detail && (
            <div className="text-xs text-gray-500">({player1Detail})</div>
          )}
        </div>
        
        {/* Progress bar container */}
        <div className="flex-1 flex items-center">
          {/* Player 1 bar (left side, grows from center) */}
          <div className="flex-1 h-1 bg-gray-200 overflow-hidden rounded-l-sm">
            <motion.div 
              className="h-full bg-primary origin-right"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: p1Percentage / 100 }}
              transition={{ 
                delay: delay * 0.15 + 0.4, 
                duration: 1.0, 
                ease: "easeOut" 
              }}
            />
          </div>
          
          {/* Center divider */}
          <div className="w-px h-3 bg-gray-400 mx-1" />
          
          {/* Player 2 bar (right side, grows from center) */}
          <div className="flex-1 h-1 bg-gray-200 overflow-hidden rounded-r-sm">
            <motion.div 
              className="h-full bg-blue-500 origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: p2Percentage / 100 }}
              transition={{ 
                delay: delay * 0.15 + 0.4, 
                duration: 1.0, 
                ease: "easeOut" 
              }}
            />
          </div>
        </div>

        {/* Player 2 value (right) */}
        <div className={`text-left pl-3 ${hasMaxValue ? 'w-14' : 'w-12'}`}>
          <div className="text-base font-bold text-gray-900">{displayValue2}</div>
          {player2Detail && (
            <div className="text-xs text-gray-500">({player2Detail})</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function MinimalistStats({ matchStats, playerNames }: MinimalistStatsProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <motion.div 
        className="text-center mb-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-1">Match Statistics</h2>
        <p className="text-sm text-gray-500">
          {playerNames.p1} vs {playerNames.p2}
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="space-y-0.5">
        <StatRow
          label="Aces"
          player1Value={matchStats.acesByPlayer[0]}
          player2Value={matchStats.acesByPlayer[1]}
          delay={0}
        />
        
        <StatRow
          label="Double Faults"
          player1Value={matchStats.doubleFaultsByPlayer[0]}
          player2Value={matchStats.doubleFaultsByPlayer[1]}
          delay={1}
        />
        
        <StatRow
          label="1st Serve Percentage"
          player1Value={matchStats.firstServePercentageByPlayer[0]}
          player2Value={matchStats.firstServePercentageByPlayer[1]}
          isPercentage={true}
          delay={2}
        />
        
        <StatRow
          label="1st Serve Points Won"
          player1Value={matchStats.firstServePointsWonByPlayer[0]}
          player2Value={matchStats.firstServePointsWonByPlayer[1]}
          isPercentage={true}
          delay={3}
        />
        
        <StatRow
          label="2nd Serve Points Won"
          player1Value={matchStats.secondServePointsWonByPlayer[0]}
          player2Value={matchStats.secondServePointsWonByPlayer[1]}
          isPercentage={true}
          delay={4}
        />
        
        {/* Break Points Section - only show if there are break points */}
        {(matchStats.breakPointsByPlayer.faced[0] > 0 || matchStats.breakPointsByPlayer.faced[1] > 0) && (
          <>
            <StatRow
              label="Break Points Saved"
              player1Value={matchStats.breakPointsByPlayer.faced[0] > 0 ? 
                Math.round((matchStats.breakPointsByPlayer.saved[0] / matchStats.breakPointsByPlayer.faced[0]) * 100) : 0}
              player2Value={matchStats.breakPointsByPlayer.faced[1] > 0 ? 
                Math.round((matchStats.breakPointsByPlayer.saved[1] / matchStats.breakPointsByPlayer.faced[1]) * 100) : 0}
              isPercentage={true}
              player1Detail={`${matchStats.breakPointsByPlayer.saved[0]}/${matchStats.breakPointsByPlayer.faced[0]}`}
              player2Detail={`${matchStats.breakPointsByPlayer.saved[1]}/${matchStats.breakPointsByPlayer.faced[1]}`}
              delay={5}
            />

            <StatRow
              label="Break Points Converted"
              player1Value={`${matchStats.breakPointsByPlayer.converted[0]}/${matchStats.breakPointsByPlayer.faced[1]}`}
              player2Value={`${matchStats.breakPointsByPlayer.converted[1]}/${matchStats.breakPointsByPlayer.faced[0]}`}
              player1Detail={`${matchStats.breakPointsByPlayer.conversionRate[0]}%`}
              player2Detail={`${matchStats.breakPointsByPlayer.conversionRate[1]}%`}
              delay={6}
            />
          </>
        )}

        <StatRow
          label="Total Points Won"
          player1Value={matchStats.totalPointsWonByPlayer[0]}
          player2Value={matchStats.totalPointsWonByPlayer[1]}
          delay={7}
        />
        
        <StatRow
          label="Unforced Errors"
          player1Value={matchStats.unforcedErrorsByPlayer[0]}
          player2Value={matchStats.unforcedErrorsByPlayer[1]}
          delay={8}
        />
      </div>
    </div>
  )
} 