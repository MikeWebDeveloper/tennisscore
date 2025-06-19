"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Player, MatchStats } from "@/lib/types"
import { Target, Zap, Shield } from "lucide-react"

interface MatchStatsComponentProps {
  stats: MatchStats
  playerOne: Player
  playerTwo: Player
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

// Stat row component
function StatRow({ 
  label, 
  value1, 
  value2, 
  format = "number",
  showProgress = true 
}: { 
  label: string
  value1: number
  value2: number
  format?: "number" | "percentage"
  showProgress?: boolean
}) {
  const total = value1 + value2
  const percentage1 = total > 0 ? (value1 / total) * 100 : 50
  const percentage2 = total > 0 ? (value2 / total) * 100 : 50

  const formatValue = (value: number) => {
    if (format === "percentage") {
      return `${value.toFixed(0)}%`
    }
    return value.toString()
  }

  return (
    <motion.div 
      variants={itemVariants}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-sm">
        <motion.span 
          className="font-mono font-semibold"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        >
          {formatValue(value1)}
        </motion.span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <motion.span 
          className="font-mono font-semibold"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
        >
          {formatValue(value2)}
        </motion.span>
      </div>
      {showProgress && (
        <div className="flex gap-1 h-2">
          <motion.div
            className="bg-blue-500 rounded-l"
            initial={{ width: 0 }}
            animate={{ width: `${percentage1}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className="bg-red-500 rounded-r"
            initial={{ width: 0 }}
            animate={{ width: `${percentage2}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  )
}

export function MatchStatsComponent({ stats, playerOne, playerTwo }: MatchStatsComponentProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Points Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow 
            label="Total Points Won" 
            value1={stats.player1.totalPointsWon} 
            value2={stats.player2.totalPointsWon} 
          />
          <StatRow 
            label="Winners" 
            value1={stats.player1.winners} 
            value2={stats.player2.winners} 
          />
          <StatRow 
            label="Unforced Errors" 
            value1={stats.player1.unforcedErrors} 
            value2={stats.player2.unforcedErrors} 
          />
        </CardContent>
      </Card>

      {/* Service Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow 
            label="Aces" 
            value1={stats.player1.aces} 
            value2={stats.player2.aces} 
          />
          <StatRow 
            label="Double Faults" 
            value1={stats.player1.doubleFaults} 
            value2={stats.player2.doubleFaults} 
          />
          <StatRow 
            label="1st Serve %" 
            value1={Math.round(stats.player1.firstServePercentage)} 
            value2={Math.round(stats.player2.firstServePercentage)}
            format="percentage"
          />
          <StatRow 
            label="1st Serve Points Won" 
            value1={Math.round(stats.player1.firstServeWinPercentage)} 
            value2={Math.round(stats.player2.firstServeWinPercentage)}
            format="percentage"
          />
        </CardContent>
      </Card>

      {/* Break Points Section */}
      {(stats.player1.breakPointsPlayed > 0 || stats.player2.breakPointsPlayed > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Break Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="Break Points Won" 
              value1={stats.player1.breakPointsWon} 
              value2={stats.player2.breakPointsWon} 
            />
            <StatRow 
              label="Break Point Conversion" 
              value1={Math.round(stats.player1.breakPointConversionPercentage)} 
              value2={Math.round(stats.player2.breakPointConversionPercentage)}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Player Names Footer */}
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          {playerOne.firstName} {playerOne.lastName}
        </span>
        <span className="flex items-center gap-2">
          {playerTwo.firstName} {playerTwo.lastName}
          <div className="w-3 h-3 bg-red-500 rounded" />
        </span>
      </div>
    </motion.div>
  )
}

// Export a version without player objects for live scoring
export function MatchStatsComponentSimple({ 
  stats, 
  playerNames,
  detailLevel
}: { 
  stats: MatchStats
  playerNames: { p1: string; p2: string }
  detailLevel: "points" | "simple" | "complex"
}) {

  const hasPoints = stats.player1.totalPointsWon > 0 || stats.player2.totalPointsWon > 0

  if (!hasPoints) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Stats will appear here once the first point is played.</p>
      </div>
    )
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Points Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow 
            label="Total Points Won" 
            value1={stats.player1.totalPointsWon} 
            value2={stats.player2.totalPointsWon} 
          />
           <StatRow 
            label="Service Points Won" 
            value1={stats.player1.servicePointsWon} 
            value2={stats.player2.servicePointsWon} 
          />
           <StatRow 
            label="Receiving Points Won" 
            value1={stats.player1.returnPointsWon} 
            value2={stats.player2.returnPointsWon} 
          />
        </CardContent>
      </Card>
      
      {/* Break Points Section (Always shown for both modes if available) */}
      {(stats.player1.breakPointsPlayed > 0 || stats.player2.breakPointsPlayed > 0 || 
        stats.player1.breakPointsFaced > 0 || stats.player2.breakPointsFaced > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Break Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="Break Points Won" 
              value1={stats.player1.breakPointsWon} 
              value2={stats.player2.breakPointsWon} 
            />
            <StatRow 
              label="Break Points Saved" 
              value1={stats.player1.breakPointsSaved} 
              value2={stats.player2.breakPointsSaved} 
            />
            {detailLevel === 'simple' && (
              <>
                <StatRow 
                  label="Break Point Conversion %" 
                  value1={Math.round(stats.player1.breakPointConversionPercentage)} 
                  value2={Math.round(stats.player2.breakPointConversionPercentage)}
                  format="percentage"
                />
                <StatRow 
                  label="Break Point Save %" 
                  value1={Math.round(stats.player1.breakPointSavePercentage)} 
                  value2={Math.round(stats.player2.breakPointSavePercentage)}
                  format="percentage"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Service Section (Simple Stats Only) */}
      {detailLevel === 'simple' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Service & Point Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="Aces" 
              value1={stats.player1.aces} 
              value2={stats.player2.aces} 
            />
            <StatRow 
              label="Double Faults" 
              value1={stats.player1.doubleFaults} 
              value2={stats.player2.doubleFaults} 
            />
             <StatRow 
              label="Winners" 
              value1={stats.player1.winners} 
              value2={stats.player2.winners} 
            />
            <StatRow 
              label="Unforced Errors" 
              value1={stats.player1.unforcedErrors} 
              value2={stats.player2.unforcedErrors} 
            />
            <StatRow 
              label="1st Serve %" 
              value1={Math.round(stats.player1.firstServePercentage)} 
              value2={Math.round(stats.player2.firstServePercentage)}
              format="percentage"
            />
            <StatRow 
              label="2nd Serve %" 
              value1={Math.round(stats.player1.secondServePercentage)} 
              value2={Math.round(stats.player2.secondServePercentage)}
              format="percentage"
            />
            <StatRow 
              label="1st Serve Points Won %" 
              value1={Math.round(stats.player1.firstServeWinPercentage)} 
              value2={Math.round(stats.player2.firstServeWinPercentage)}
              format="percentage"
            />
            <StatRow 
              label="2nd Serve Points Won %" 
              value1={Math.round(stats.player1.secondServeWinPercentage)} 
              value2={Math.round(stats.player2.secondServeWinPercentage)}
              format="percentage"
            />
            <StatRow 
              label="Total Return Points Won %" 
              value1={Math.round(stats.player1.totalReturnWinPercentage)} 
              value2={Math.round(stats.player2.totalReturnWinPercentage)}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Player Names Footer */}
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          {playerNames.p1}
        </span>
        <span className="flex items-center gap-2">
          {playerNames.p2}
          <div className="w-3 h-3 bg-red-500 rounded" />
        </span>
      </div>
    </motion.div>
  )
} 