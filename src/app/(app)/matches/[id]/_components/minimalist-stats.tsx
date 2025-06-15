"use client"

import { motion } from "framer-motion"
import { MatchStats } from "@/lib/types"

interface MinimalistStatsProps {
  matchStats: MatchStats
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
          player1Value={matchStats.player1.aces}
          player2Value={matchStats.player2.aces}
          delay={0}
        />
        
        <StatRow
          label="Double Faults"
          player1Value={matchStats.player1.doubleFaults}
          player2Value={matchStats.player2.doubleFaults}
          delay={1}
        />
        
        <StatRow
          label="1st Serve Percentage"
          player1Value={Math.round(matchStats.player1.firstServePercentage)}
          player2Value={Math.round(matchStats.player2.firstServePercentage)}
          isPercentage={true}
          delay={2}
        />
        
        <StatRow
          label="1st Serve Points Won"
          player1Value={Math.round(matchStats.player1.firstServeWinPercentage)}
          player2Value={Math.round(matchStats.player2.firstServeWinPercentage)}
          isPercentage={true}
          player1Detail={`${Math.round(matchStats.player1.firstServePointsWon)}/${Math.round(matchStats.player1.firstServePointsPlayed)}`}
          player2Detail={`${Math.round(matchStats.player2.firstServePointsWon)}/${Math.round(matchStats.player2.firstServePointsPlayed)}`}
          delay={3}
        />
        
        <StatRow
          label="2nd Serve Points Won"
          player1Value={Math.round(matchStats.player1.secondServeWinPercentage)}
          player2Value={Math.round(matchStats.player2.secondServeWinPercentage)}
          isPercentage={true}
          player1Detail={`${Math.round(matchStats.player1.secondServePointsWon)}/${Math.round(matchStats.player1.secondServePointsPlayed)}`}
          player2Detail={`${Math.round(matchStats.player2.secondServePointsWon)}/${Math.round(matchStats.player2.secondServePointsPlayed)}`}
          delay={4}
        />
        
        <StatRow
          label="Break Points Saved"
          player1Value={Math.round(matchStats.player1.breakPointSavePercentage)}
          player2Value={Math.round(matchStats.player2.breakPointSavePercentage)}
          isPercentage={true}
          player1Detail={`${matchStats.player1.breakPointsSaved}/${matchStats.player1.breakPointsFaced}`}
          player2Detail={`${matchStats.player2.breakPointsSaved}/${matchStats.player2.breakPointsFaced}`}
          delay={5}
        />

        <StatRow
          label="1st Return Points Won"
          player1Value={Math.round(matchStats.player1.firstReturnWinPercentage)}
          player2Value={Math.round(matchStats.player2.firstReturnWinPercentage)}
          isPercentage={true}
          delay={6}
        />
        
        <StatRow
          label="2nd Return Points Won"
          player1Value={Math.round(matchStats.player1.secondReturnWinPercentage)}
          player2Value={Math.round(matchStats.player2.secondReturnWinPercentage)}
          isPercentage={true}
          delay={7}
        />
        
        <StatRow
          label="Break Points Converted"
          player1Value={Math.round(matchStats.player1.breakPointConversionPercentage)}
          player2Value={Math.round(matchStats.player2.breakPointConversionPercentage)}
          isPercentage={true}
          player1Detail={`${matchStats.player1.breakPointsWon}/${matchStats.player1.breakPointsPlayed}`}
          player2Detail={`${matchStats.player2.breakPointsWon}/${matchStats.player2.breakPointsPlayed}`}
          delay={8}
        />

        <StatRow
          label="Winners"
          player1Value={matchStats.player1.winners}
          player2Value={matchStats.player2.winners}
          delay={9}
        />
        
        <StatRow
          label="Unforced Errors"
          player1Value={matchStats.player1.unforcedErrors}
          player2Value={matchStats.player2.unforcedErrors}
          delay={10}
        />
        
        <StatRow
          label="Net Points Won"
          player1Value={Math.round(matchStats.player1.netPointWinPercentage)}
          player2Value={Math.round(matchStats.player2.netPointWinPercentage)}
          isPercentage={true}
          player1Detail={`${matchStats.player1.netPointsWon}/${matchStats.player1.netPointsPlayed}`}
          player2Detail={`${matchStats.player2.netPointsWon}/${matchStats.player2.netPointsPlayed}`}
          delay={11}
        />
      </div>
    </div>
  )
} 