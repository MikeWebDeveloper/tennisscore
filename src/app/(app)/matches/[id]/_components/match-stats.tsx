"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Player, MatchStats } from "@/lib/types"
import { Target, Zap, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/hooks/use-translations"
import { PointDetail } from "@/lib/types"
import { calculateMatchStats } from "@/lib/utils/match-stats"

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
          <StatRow 
            label="Forced Errors" 
            value1={stats.player1.forcedErrors} 
            value2={stats.player2.forcedErrors} 
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
  stats: import("@/lib/utils/match-stats").EnhancedMatchStats
  playerNames: { p1: string; p2: string }
  detailLevel: "points" | "simple" | "complex"
}) {

  const hasPoints = stats.totalPoints > 0
  
  // Debug log to check what's happening
  console.log('MatchStatsComponentSimple - detailLevel:', detailLevel, 'hasPoints:', hasPoints, 'totalPoints:', stats.totalPoints)

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
      {/* Points Section - Different content based on detail level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            {detailLevel === "points" ? "Points" : "Points & Outcomes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailLevel === "points" ? (
            // Points-only scoring: Show total points and serve/receive stats
            <>
              <StatRow 
                label="Total Points" 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label="Service Points %" 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label="Receiving Points %" 
                value1={stats.receivingPointsWonPercentageByPlayer[0]} 
                value2={stats.receivingPointsWonPercentageByPlayer[1]}
                format="percentage"
              />
            </>
          ) : (
            // Simple/Complex scoring: Show both points-only stats AND detailed stats
            <>
              {/* Points-only stats (from "points" level) */}
              <StatRow 
                label="Total Points" 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label="Service Points %" 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label="Receiving Points %" 
                value1={stats.receivingPointsWonPercentageByPlayer[0]} 
                value2={stats.receivingPointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              
              {/* Detailed stats */}
              <StatRow 
                label="Winners" 
                value1={stats.winnersByPlayer[0]} 
                value2={stats.winnersByPlayer[1]} 
              />
              <StatRow 
                label="Unforced Errors" 
                value1={stats.unforcedErrorsByPlayer[0]} 
                value2={stats.unforcedErrorsByPlayer[1]} 
              />
              <StatRow 
                label="Forced Errors" 
                value1={stats.forcedErrorsByPlayer[0]} 
                value2={stats.forcedErrorsByPlayer[1]} 
              />
              <StatRow 
                label="Aces" 
                value1={stats.acesByPlayer[0]} 
                value2={stats.acesByPlayer[1]} 
              />
              <StatRow 
                label="Double Faults" 
                value1={stats.doubleFaultsByPlayer[0]} 
                value2={stats.doubleFaultsByPlayer[1]} 
              />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Break Points Section */}
      {(stats.breakPointsByPlayer.faced[0] > 0 || stats.breakPointsByPlayer.faced[1] > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Break Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="Break Points Faced" 
              value1={stats.breakPointsByPlayer.faced[0]} 
              value2={stats.breakPointsByPlayer.faced[1]} 
            />
            <StatRow 
              label="Break Points Converted" 
              value1={stats.breakPointsByPlayer.converted[0]} 
              value2={stats.breakPointsByPlayer.converted[1]} 
            />
            <StatRow 
              label="Break Points Saved" 
              value1={stats.breakPointsByPlayer.saved[0]} 
              value2={stats.breakPointsByPlayer.saved[1]} 
            />
            <StatRow 
              label="Conversion Rate" 
              value1={stats.breakPointsByPlayer.conversionRate[0]} 
              value2={stats.breakPointsByPlayer.conversionRate[1]}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Service Section (Simple and Complex Stats) - ALWAYS SHOW FOR SIMPLE/COMPLEX */}
      {(detailLevel === 'simple' || detailLevel === 'complex') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Service Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="1st Serve %" 
              value1={stats.firstServePercentageByPlayer[0]} 
              value2={stats.firstServePercentageByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label="1st Serve Points Won %" 
              value1={stats.firstServePointsWonByPlayer[0]} 
              value2={stats.firstServePointsWonByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label="2nd Serve Points Won %" 
              value1={stats.secondServePointsWonByPlayer[0]} 
              value2={stats.secondServePointsWonByPlayer[1]}
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

// Enhanced version with tabs for match and per-set stats
export function MatchStatsComponentSimpleFixed({ 
  stats: overallStats, 
  playerNames,
  detailLevel,
  pointLog
}: { 
  stats: import("@/lib/utils/match-stats").EnhancedMatchStats
  playerNames: { p1: string; p2: string }
  detailLevel: "points" | "simple" | "complex"
  pointLog?: PointDetail[]
}) {
  const t = useTranslations()
  
  // Calculate per-set stats if we have point log
  const setStats: Record<number, import("@/lib/utils/match-stats").EnhancedMatchStats> = {}
  let setNumbers: number[] = []
  
  if (pointLog && pointLog.length > 0) {
    // Group points by set
    const pointsBySets = pointLog.reduce((acc, point) => {
      const setNumber = point.setNumber
      if (!acc[setNumber]) acc[setNumber] = []
      acc[setNumber].push(point)
      return acc
    }, {} as Record<number, PointDetail[]>)
    
    setNumbers = Object.keys(pointsBySets).map(Number).sort((a, b) => a - b)
    
    // Calculate stats for each set
    setNumbers.forEach(setNumber => {
      setStats[setNumber] = calculateMatchStats(pointsBySets[setNumber])
    })
  }

  const hasPoints = overallStats.totalPoints > 0
  
  if (!hasPoints) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Stats will appear here once the first point is played.</p>
      </div>
    )
  }

  // Helper function to render stats content
  const renderStatsContent = (stats: import("@/lib/utils/match-stats").EnhancedMatchStats) => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Points Section - Different content based on detail level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            {detailLevel === "points" ? "Points" : "Points & Outcomes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailLevel === "points" ? (
            // Points-only scoring: Show total points and serve/receive stats
            <>
              <StatRow 
                label="Total Points" 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label="Service Points %" 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label="Receiving Points %" 
                value1={stats.receivingPointsWonPercentageByPlayer[0]} 
                value2={stats.receivingPointsWonPercentageByPlayer[1]}
                format="percentage"
              />
            </>
          ) : (
            // Simple/Complex scoring: Show detailed stats
            <>
              <StatRow 
                label="Total Points" 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label="Winners" 
                value1={stats.winnersByPlayer[0]} 
                value2={stats.winnersByPlayer[1]} 
              />
              <StatRow 
                label="Unforced Errors" 
                value1={stats.unforcedErrorsByPlayer[0]} 
                value2={stats.unforcedErrorsByPlayer[1]} 
              />
              <StatRow 
                label="Aces" 
                value1={stats.acesByPlayer[0]} 
                value2={stats.acesByPlayer[1]} 
              />
              <StatRow 
                label="Double Faults" 
                value1={stats.doubleFaultsByPlayer[0]} 
                value2={stats.doubleFaultsByPlayer[1]} 
              />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Service Section */}
      {(detailLevel === 'simple' || detailLevel === 'complex') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Service Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="1st Serve %" 
              value1={stats.firstServePercentageByPlayer[0]} 
              value2={stats.firstServePercentageByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label="1st Serve Points Won %" 
              value1={stats.firstServePointsWonByPlayer[0]} 
              value2={stats.firstServePointsWonByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label="2nd Serve Points Won %" 
              value1={stats.secondServePointsWonByPlayer[0]} 
              value2={stats.secondServePointsWonByPlayer[1]}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}
      
      {/* Break Points Section */}
      {(stats.breakPointsByPlayer.faced[0] > 0 || stats.breakPointsByPlayer.faced[1] > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Break Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label="Break Points Converted" 
              value1={stats.breakPointsByPlayer.converted[0]} 
              value2={stats.breakPointsByPlayer.converted[1]} 
            />
            <StatRow 
              label="Conversion Rate" 
              value1={stats.breakPointsByPlayer.conversionRate[0]} 
              value2={stats.breakPointsByPlayer.conversionRate[1]}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}
    </motion.div>
  )

  // If no sets (shouldn't happen), just show overall stats
  if (setNumbers.length === 0) {
    return (
      <>
        {renderStatsContent(overallStats)}
        <div className="flex justify-between text-sm text-muted-foreground px-2 mt-4">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            {playerNames.p1}
          </span>
          <span className="flex items-center gap-2">
            {playerNames.p2}
            <div className="w-3 h-3 bg-red-500 rounded" />
          </span>
        </div>
      </>
    )
  }

  // Render with tabs
  return (
    <div className="space-y-4">
      <Tabs defaultValue="match" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${setNumbers.length + 1}, 1fr)` }}>
          <TabsTrigger value="match">{t('match')}</TabsTrigger>
          {setNumbers.map(setNumber => (
            <TabsTrigger key={setNumber} value={`set-${setNumber}`}>
              {t('set')} {setNumber}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="match" className="mt-4">
          {renderStatsContent(overallStats)}
        </TabsContent>
        
        {setNumbers.map(setNumber => (
          <TabsContent key={setNumber} value={`set-${setNumber}`} className="mt-4">
            {renderStatsContent(setStats[setNumber])}
          </TabsContent>
        ))}
      </Tabs>
      
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
    </div>
  )
} 