"use client"

import { useState } from "react"
import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Player, MatchStats } from "@/lib/types"
import { Target, Zap, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "@/i18n"
import { PointDetail } from "@/lib/types"
import { calculateDetailedMatchStats, calculateMatchStatsByLevel } from "@/lib/utils/match-stats"
import { formatPlayerFromObject } from "@/lib/utils"
// import { EnhancedStatsDisplay } from "@/components/features/enhanced-stats-display"

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

// Expandable stat row component
function StatRow({ 
  label, 
  value1, 
  value2, 
  format = "number",
  showProgress = true,
  onClick,
  isExpanded = false,
  expandedContent
}: { 
  label: string
  value1: number
  value2: number
  format?: "number" | "percentage"
  showProgress?: boolean
  onClick?: () => void
  isExpanded?: boolean
  expandedContent?: React.ReactNode
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
      layout
    >
      <motion.div 
        className={`space-y-2 ${onClick ? 'cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors' : ''}`}
        onClick={onClick}
        layout
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
      
      {/* Expandable content */}
      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        {isExpanded && expandedContent && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="mt-3 pl-4 border-l-2 border-muted space-y-2"
          >
            {expandedContent}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

export function MatchStatsComponent({ stats, playerOne, playerTwo }: MatchStatsComponentProps) {
  const t = useTranslations('common')
  
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
            {t('points')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow 
            label={t('totalPointsWon')} 
            value1={stats.player1.totalPointsWon} 
            value2={stats.player2.totalPointsWon} 
          />
          <StatRow 
            label={t('winners')} 
            value1={stats.player1.winners} 
            value2={stats.player2.winners} 
          />
          <StatRow 
            label={t('unforcedErrors')} 
            value1={stats.player1.unforcedErrors} 
            value2={stats.player2.unforcedErrors} 
          />
          <StatRow 
            label={t('forcedErrors')} 
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
            {t('serviceStatistics')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatRow 
            label={t('aces')} 
            value1={stats.player1.aces} 
            value2={stats.player2.aces} 
          />
          <StatRow 
            label={t('doubleFaults')} 
            value1={stats.player1.doubleFaults} 
            value2={stats.player2.doubleFaults} 
          />
          <StatRow 
            label={t('firstServePercentage')} 
            value1={Math.round(
              stats.player1.firstServesAttempted > 0 
                ? (stats.player1.firstServesMade / stats.player1.firstServesAttempted) * 100 
                : 0
            )} 
            value2={Math.round(
              stats.player2.firstServesAttempted > 0 
                ? (stats.player2.firstServesMade / stats.player2.firstServesAttempted) * 100 
                : 0
            )}
            format="percentage"
          />
          <StatRow 
            label={t('firstServePointsWonPercentage')} 
            value1={Math.round(
              stats.player1.firstServesMade > 0 
                ? (stats.player1.firstServePointsWon / stats.player1.firstServesMade) * 100 
                : 0
            )} 
            value2={Math.round(
              stats.player2.firstServesMade > 0 
                ? (stats.player2.firstServePointsWon / stats.player2.firstServesMade) * 100 
                : 0
            )}
            format="percentage"
          />
        </CardContent>
      </Card>

      {/* Break Points Section */}
      {(stats.player1.breakPointsFaced > 0 || stats.player2.breakPointsFaced > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('breakPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label={t('breakPointsWon')} 
              value1={stats.player1.breakPointsWon} 
              value2={stats.player2.breakPointsWon} 
            />
            <StatRow 
              label={t('breakPointConversion')} 
              value1={Math.round(
                stats.player1.breakPointsFaced > 0 
                  ? (stats.player1.breakPointsWon / stats.player1.breakPointsFaced) * 100 
                  : 0
              )} 
              value2={Math.round(
                stats.player2.breakPointsFaced > 0 
                  ? (stats.player2.breakPointsWon / stats.player2.breakPointsFaced) * 100 
                  : 0
              )}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Player Names Footer */}
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          {formatPlayerFromObject(playerOne)}
        </span>
        <span className="flex items-center gap-2">
          {formatPlayerFromObject(playerTwo)}
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
  detailLevel: "points" | "simple" | "complex" | "detailed"
}) {
  const t = useTranslations('common')

  const hasPoints = stats.totalPoints > 0
  
  // Debug log to check what's happening
  console.log('MatchStatsComponentSimple - detailLevel:', detailLevel, 'hasPoints:', hasPoints, 'totalPoints:', stats.totalPoints)

  if (!hasPoints) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('statsWillAppearDescription')}</p>
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
            {detailLevel === "points" ? t('points') : t('pointsAndOutcomes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailLevel === "points" ? (
            // Points-only scoring: Show total points and serve/receive stats
            <>
              <StatRow 
                label={t('totalPoints')} 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label={t('servicePoints')} 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label={t('receivingPoints')} 
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
                label={t('totalPoints')} 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label={t('servicePoints')} 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label={t('receivingPoints')} 
                value1={stats.receivingPointsWonPercentageByPlayer[0]} 
                value2={stats.receivingPointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              
              {/* Detailed stats */}
              <StatRow 
                label={t('winners')} 
                value1={stats.winnersByPlayer[0]} 
                value2={stats.winnersByPlayer[1]} 
              />
              <StatRow 
                label={t('unforcedErrors')} 
                value1={stats.unforcedErrorsByPlayer[0]} 
                value2={stats.unforcedErrorsByPlayer[1]} 
              />
              <StatRow 
                label={t('forcedErrors')} 
                value1={stats.forcedErrorsByPlayer[0]} 
                value2={stats.forcedErrorsByPlayer[1]} 
              />
              <StatRow 
                label={t('aces')} 
                value1={stats.acesByPlayer[0]} 
                value2={stats.acesByPlayer[1]} 
              />
              <StatRow 
                label={t('doubleFaults')} 
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
              {t('breakPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label={t('breakPointsFaced')} 
              value1={stats.breakPointsByPlayer.faced[0]} 
              value2={stats.breakPointsByPlayer.faced[1]} 
            />
            <StatRow 
              label={t('breakPointsConverted')} 
              value1={stats.breakPointsByPlayer.converted[0]} 
              value2={stats.breakPointsByPlayer.converted[1]} 
            />
            <StatRow 
              label={t('breakPointsSaved')} 
              value1={stats.breakPointsByPlayer.saved[0]} 
              value2={stats.breakPointsByPlayer.saved[1]} 
            />
            <StatRow 
              label={t('conversionRatePercent')} 
              value1={stats.breakPointsByPlayer.conversionRate[0]} 
              value2={stats.breakPointsByPlayer.conversionRate[1]}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Service Section (Simple, Detailed and Complex Stats) - ALWAYS SHOW FOR SIMPLE/DETAILED/COMPLEX */}
      {(detailLevel === 'simple' || detailLevel === 'detailed' || detailLevel === 'complex') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('serviceStatistics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label={t('firstServePercentage')} 
              value1={stats.firstServePercentageByPlayer[0]} 
              value2={stats.firstServePercentageByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label={t('firstServePointsWonPercentage')} 
              value1={stats.firstServePointsWonByPlayer[0]} 
              value2={stats.firstServePointsWonByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label={t('secondServePointsWonPercentage')} 
              value1={Math.round(
                stats.secondServePointsPlayedByPlayer[0] > 0 
                  ? (stats.secondServePointsWonByPlayer[0] / stats.secondServePointsPlayedByPlayer[0]) * 100 
                  : 0
              )}
              value2={Math.round(
                stats.secondServePointsPlayedByPlayer[1] > 0 
                  ? (stats.secondServePointsWonByPlayer[1] / stats.secondServePointsPlayedByPlayer[1]) * 100 
                  : 0
              )}
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
  detailLevel: "points" | "simple" | "detailed" | "custom" | "complex"
  pointLog?: PointDetail[]
}) {
  const t = useTranslations('common')
  
  // State for expandable stats
  const [expandedStat, setExpandedStat] = useState<'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults' | null>(null)
  
  const handleStatClick = (statType: 'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults') => {
    if (pointLog && pointLog.length > 0) {
      setExpandedStat(expandedStat === statType ? null : statType)
    }
  }

  // Helper function to get points for a specific stat type
  const getFilteredPoints = (statType: 'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults') => {
    if (!pointLog) return []
    
    switch (statType) {
      case 'winners':
        return pointLog.filter(point => point.pointOutcome === 'winner')
      case 'unforcedErrors':
        return pointLog.filter(point => point.pointOutcome === 'unforced_error')
      case 'forcedErrors':
        return pointLog.filter(point => point.pointOutcome === 'forced_error')
      case 'aces':
        return pointLog.filter(point => point.pointOutcome === 'ace')
      case 'doubleFaults':
        return pointLog.filter(point => point.pointOutcome === 'double_fault')
      default:
        return []
    }
  }

  // Helper function to get player points
  const getPlayerPoints = (statType: 'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults', playerId: 'p1' | 'p2') => {
    const filteredPoints = getFilteredPoints(statType)
    return filteredPoints.filter(point => {
      // For errors, attribute to the player who made the error
      if (statType === 'unforcedErrors' || statType === 'forcedErrors') {
        let errorPlayer = point.lastShotPlayer;
        if (errorPlayer === point.winner) {
          errorPlayer = point.winner === 'p1' ? 'p2' : 'p1';
        }
        return errorPlayer === playerId;
      }
      // For winners, aces, double faults, attribute to the player who won
      return point.winner === playerId;
    });
  }

  // Helper function to get shot type breakdown
  const getShotTypeBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      if (point.lastShotType) {
        breakdown[point.lastShotType] = (breakdown[point.lastShotType] || 0) + 1
      }
    })
    return breakdown
  }

  // Type predicate for PointDetail with shotDirection
  function hasShotDirection(point: unknown): point is { shotDirection: string } {
    return (
      typeof point === 'object' &&
      point !== null &&
      'shotDirection' in point &&
      typeof (point as { shotDirection: unknown }).shotDirection === 'string' &&
      Boolean((point as { shotDirection: string }).shotDirection)
    )
  }

  // Helper function to get shot direction breakdown
  const getShotDirectionBreakdown = (points: unknown[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      if (hasShotDirection(point)) {
        const dir = point.shotDirection
        breakdown[dir] = (breakdown[dir] || 0) + 1
      }
    })
    return breakdown
  }

  // Generate expandable content for a stat type
  const generateExpandableContent = (statType: 'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults') => {
    const player1Points = getPlayerPoints(statType, 'p1')
    const player2Points = getPlayerPoints(statType, 'p2')
    
    const shotTypeTranslations: Record<string, string> = {
      forehand: t('forehand'),
      backhand: t('backhand'),
      volley: t('volley'),
      overhead: t('overhead'),
      serve: t('serve'),
      dropShot: t('dropShot'),
      lob: t('lob')
    }

    const shotDirectionTranslations: Record<string, string> = {
      cross: t('crossCourt'),
      line: t('downTheLine'),
      body: t('bodyShot'),
      long: t('long'),
      wide: t('wide'),
      net: t('net')
    }

    const servePlacementTranslations: Record<string, string> = {
      wide: t('wide'),
      body: t('bodyShot'),
      t: t('tDownTheMiddle')
    }

    // Special handling for Aces and Double Faults
    if (statType === 'aces' || statType === 'doubleFaults') {
      // Get serve placement breakdown
      const getServePlacementBreakdown = (points: PointDetail[]) => {
        const breakdown: Record<string, number> = {}
        points.forEach(point => {
          if (point.servePlacement) {
            breakdown[point.servePlacement] = (breakdown[point.servePlacement] || 0) + 1
          }
        })
        return breakdown
      }

      const player1ServePlacement = getServePlacementBreakdown(player1Points)
      const player2ServePlacement = getServePlacementBreakdown(player2Points)

      return (
        <div className="space-y-4">
          {/* Serve Placement */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('servePlacement')}</h4>
            <div className="space-y-1">
              {Object.entries(player1ServePlacement).map(([placement, count]) => (
                <div key={placement} className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">{count}</span>
                  <span className="text-xs text-muted-foreground">{servePlacementTranslations[placement] || placement}</span>
                  <span className="text-red-600">{player2ServePlacement[placement] || 0}</span>
                </div>
              ))}
              {Object.entries(player2ServePlacement).map(([placement, count]) => {
                if (player1ServePlacement[placement]) return null
                return (
                  <div key={placement} className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">0</span>
                    <span className="text-xs text-muted-foreground">{servePlacementTranslations[placement] || placement}</span>
                    <span className="text-red-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Special handling for Winners - include return winners
    if (statType === 'winners') {
      const player1ShotTypes = getShotTypeBreakdown(player1Points)
      const player2ShotTypes = getShotTypeBreakdown(player2Points)
      
      const player1ShotDirections = getShotDirectionBreakdown(player1Points)
      const player2ShotDirections = getShotDirectionBreakdown(player2Points)

      // Get return winner breakdown
      const getReturnWinnerBreakdown = (points: PointDetail[]) => {
        const breakdown: Record<string, number> = { regular: 0, return: 0 }
        points.forEach(point => {
          if (point.winnerType) {
            breakdown[point.winnerType] = (breakdown[point.winnerType] || 0) + 1
          } else {
            // If no winnerType is specified, assume regular
            breakdown.regular += 1
          }
        })
        return breakdown
      }

      const player1ReturnWinners = getReturnWinnerBreakdown(player1Points)
      const player2ReturnWinners = getReturnWinnerBreakdown(player2Points)

      return (
        <div className="space-y-4">
          {/* Return Winners */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('winnerType')}</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">{player1ReturnWinners.regular}</span>
                <span className="text-xs text-muted-foreground">{t('regular')}</span>
                <span className="text-red-600">{player2ReturnWinners.regular}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">{player1ReturnWinners.return}</span>
                <span className="text-xs text-muted-foreground">{t('return')}</span>
                <span className="text-red-600">{player2ReturnWinners.return}</span>
              </div>
            </div>
          </div>

          {/* Shot Types */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('shotTypes')}</h4>
            <div className="space-y-1">
              {Object.entries(player1ShotTypes).map(([shotType, count]) => (
                <div key={shotType} className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">{count}</span>
                  <span className="text-xs text-muted-foreground">{shotTypeTranslations[shotType] || shotType}</span>
                  <span className="text-red-600">{player2ShotTypes[shotType] || 0}</span>
                </div>
              ))}
              {Object.entries(player2ShotTypes).map(([shotType, count]) => {
                if (player1ShotTypes[shotType]) return null
                return (
                  <div key={shotType} className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">0</span>
                    <span className="text-xs text-muted-foreground">{shotTypeTranslations[shotType] || shotType}</span>
                    <span className="text-red-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shot Directions */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('shotDirections')}</h4>
            <div className="space-y-1">
              {Object.entries(player1ShotDirections).map(([direction, count]) => (
                <div key={direction} className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">{count}</span>
                  <span className="text-xs text-muted-foreground">{shotDirectionTranslations[direction] || direction}</span>
                  <span className="text-red-600">{player2ShotDirections[direction] || 0}</span>
                </div>
              ))}
              {Object.entries(player2ShotDirections).map(([direction, count]) => {
                if (player1ShotDirections[direction]) return null
                return (
                  <div key={direction} className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">0</span>
                    <span className="text-xs text-muted-foreground">{shotDirectionTranslations[direction] || direction}</span>
                    <span className="text-red-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // Default handling for other stats (unforcedErrors, forcedErrors)
    const player1ShotTypes = getShotTypeBreakdown(player1Points)
    const player2ShotTypes = getShotTypeBreakdown(player2Points)
    
    const player1ShotDirections = getShotDirectionBreakdown(player1Points)
    const player2ShotDirections = getShotDirectionBreakdown(player2Points)

    return (
      <div className="space-y-4">
        {/* Shot Types */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t('shotTypes')}</h4>
          <div className="space-y-1">
            {Object.entries(player1ShotTypes).map(([shotType, count]) => (
              <div key={shotType} className="flex items-center justify-between text-sm">
                <span className="text-blue-600">{count}</span>
                <span className="text-xs text-muted-foreground">{shotTypeTranslations[shotType] || shotType}</span>
                <span className="text-red-600">{player2ShotTypes[shotType] || 0}</span>
              </div>
            ))}
            {Object.entries(player2ShotTypes).map(([shotType, count]) => {
              if (player1ShotTypes[shotType]) return null
              return (
                <div key={shotType} className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">0</span>
                  <span className="text-xs text-muted-foreground">{shotTypeTranslations[shotType] || shotType}</span>
                  <span className="text-red-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Shot Directions */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t('shotDirections')}</h4>
          <div className="space-y-1">
            {Object.entries(player1ShotDirections).map(([direction, count]) => (
              <div key={direction} className="flex items-center justify-between text-sm">
                <span className="text-blue-600">{count}</span>
                <span className="text-xs text-muted-foreground">{shotDirectionTranslations[direction] || direction}</span>
                <span className="text-red-600">{player2ShotDirections[direction] || 0}</span>
              </div>
            ))}
            {Object.entries(player2ShotDirections).map(([direction, count]) => {
              if (player1ShotDirections[direction]) return null
              return (
                <div key={direction} className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">0</span>
                  <span className="text-xs text-muted-foreground">{shotDirectionTranslations[direction] || direction}</span>
                  <span className="text-red-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  // Calculate enhanced analytics if we have point log
  // const advancedStats = pointLog && pointLog.length > 0 
  //   ? calculateAdvancedMatchStats(pointLog) 
  //   : null
    
  // Calculate detailed stats for detailed mode
  const detailedStats = pointLog && pointLog.length > 0 && detailLevel === 'detailed'
    ? calculateDetailedMatchStats(pointLog)
    : null
  
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
    
    // Calculate stats for each set using the appropriate detail level
    setNumbers.forEach(setNumber => {
      setStats[setNumber] = calculateMatchStatsByLevel(pointsBySets[setNumber], detailLevel)
    })
  }

  const hasPoints = overallStats.totalPoints > 0
  
  if (!hasPoints) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>{t('statsWillAppearDescription')}</p>
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
            {detailLevel === "points" ? t('points') : t('pointsAndOutcomes')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailLevel === "points" ? (
            // Points-only scoring: Show total points and serve/receive stats
            <>
              <StatRow 
                label={t('totalPoints')} 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label={t('servicePoints')} 
                value1={stats.servicePointsWonPercentageByPlayer[0]} 
                value2={stats.servicePointsWonPercentageByPlayer[1]}
                format="percentage"
              />
              <StatRow 
                label={t('receivingPoints')} 
                value1={stats.receivingPointsWonPercentageByPlayer[0]} 
                value2={stats.receivingPointsWonPercentageByPlayer[1]}
                format="percentage"
              />
            </>
          ) : (
            // Simple/Detailed/Custom scoring: Show all outcome stats
            <>
              <StatRow 
                label={t('totalPoints')} 
                value1={stats.totalPointsWonByPlayer[0]} 
                value2={stats.totalPointsWonByPlayer[1]} 
              />
              <StatRow 
                label={t('winners')} 
                value1={stats.winnersByPlayer[0]} 
                value2={stats.winnersByPlayer[1]}
                onClick={() => handleStatClick('winners')}
                isExpanded={expandedStat === 'winners'}
                expandedContent={generateExpandableContent('winners')}
              />
              <StatRow 
                label={t('unforcedErrors')} 
                value1={stats.unforcedErrorsByPlayer[0]} 
                value2={stats.unforcedErrorsByPlayer[1]}
                onClick={() => handleStatClick('unforcedErrors')}
                isExpanded={expandedStat === 'unforcedErrors'}
                expandedContent={generateExpandableContent('unforcedErrors')}
              />
              <StatRow 
                label={t('forcedErrors')} 
                value1={stats.forcedErrorsByPlayer[0]} 
                value2={stats.forcedErrorsByPlayer[1]}
                onClick={() => handleStatClick('forcedErrors')}
                isExpanded={expandedStat === 'forcedErrors'}
                expandedContent={generateExpandableContent('forcedErrors')}
              />
              <StatRow 
                label={t('aces')} 
                value1={stats.acesByPlayer[0]} 
                value2={stats.acesByPlayer[1]}
                onClick={() => handleStatClick('aces')}
                isExpanded={expandedStat === 'aces'}
                expandedContent={generateExpandableContent('aces')}
              />
              <StatRow 
                label={t('doubleFaults')} 
                value1={stats.doubleFaultsByPlayer[0]} 
                value2={stats.doubleFaultsByPlayer[1]}
                onClick={() => handleStatClick('doubleFaults')}
                isExpanded={expandedStat === 'doubleFaults'}
                expandedContent={generateExpandableContent('doubleFaults')}
              />
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Service Section - Progressive detail levels */}
      {(detailLevel === 'simple' || detailLevel === 'detailed' || detailLevel === 'complex' || detailLevel === 'custom') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('serviceStatistics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailLevel === 'simple' ? (
              // Simple: Just basic serve percentages
              <>
                <StatRow 
                  label={t('firstServePercentage')} 
                  value1={stats.firstServePercentageByPlayer[0]} 
                  value2={stats.firstServePercentageByPlayer[1]}
                  format="percentage"
                />
                <StatRow 
                  label={t('servicePoints')} 
                  value1={stats.servicePointsWonPercentageByPlayer[0]} 
                  value2={stats.servicePointsWonPercentageByPlayer[1]}
                  format="percentage"
                />
              </>
            ) : (
              // Detailed/Complex/Custom: Full service breakdown
              <>
                <StatRow 
                  label={t('firstServePercentage')} 
                  value1={stats.firstServePercentageByPlayer[0]} 
                  value2={stats.firstServePercentageByPlayer[1]}
                  format="percentage"
                />
                <StatRow 
                  label={t('firstServePointsWonPercentage')} 
                  value1={stats.firstServePointsWonByPlayer[0]} 
                  value2={stats.firstServePointsWonByPlayer[1]}
                  format="percentage"
                />
                <StatRow 
                  label={t('secondServePointsWonPercentage')} 
                  value1={Math.round(
                    stats.secondServePointsPlayedByPlayer[0] > 0 
                      ? (stats.secondServePointsWonByPlayer[0] / stats.secondServePointsPlayedByPlayer[0]) * 100 
                      : 0
                  )}
                  value2={Math.round(
                    stats.secondServePointsPlayedByPlayer[1] > 0 
                      ? (stats.secondServePointsWonByPlayer[1] / stats.secondServePointsPlayedByPlayer[1]) * 100 
                      : 0
                  )}
                  format="percentage"
                />
                <StatRow 
                  label={t('totalServicePoints')} 
                  value1={stats.servicePointsPlayedByPlayer[0]} 
                  value2={stats.servicePointsPlayedByPlayer[1]} 
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Return Statistics - Only for Complex and Detailed */}
      {(detailLevel === 'complex' || detailLevel === 'detailed') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('returnStatistics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label={t('receivingPoints')} 
              value1={stats.receivingPointsWonPercentageByPlayer[0]} 
              value2={stats.receivingPointsWonPercentageByPlayer[1]}
              format="percentage"
            />
            <StatRow 
              label={t('totalReturnPoints')} 
              value1={stats.receivingPointsPlayedByPlayer[0]} 
              value2={stats.receivingPointsPlayedByPlayer[1]} 
            />
            <StatRow 
              label={t('returnPointsWon')} 
              value1={stats.receivingPointsWonByPlayer[0]} 
              value2={stats.receivingPointsWonByPlayer[1]} 
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
              {t('breakPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatRow 
              label={t('breakPointsFaced')}
              value1={stats.breakPointsByPlayer.faced[0]} 
              value2={stats.breakPointsByPlayer.faced[1]} 
            />
            <StatRow 
              label={t('breakPointsConverted')}
              value1={stats.breakPointsByPlayer.converted[0]} 
              value2={stats.breakPointsByPlayer.converted[1]} 
            />
            <StatRow 
              label={t('conversionRatePercent')}
              value1={stats.breakPointsByPlayer.conversionRate[0]} 
              value2={stats.breakPointsByPlayer.conversionRate[1]}
              format="percentage"
            />
          </CardContent>
        </Card>
      )}

      {/* Detailed Mode Enhanced Statistics */}
      {detailLevel === 'detailed' && detailedStats && detailedStats.hasDetailedData && (
        <>
          {/* Serve Direction Analysis */}
          {(detailedStats.serveDirectionStats.playerOne.totalAttempts > 0 || detailedStats.serveDirectionStats.playerTwo.totalAttempts > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Serve Direction Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm font-medium mb-2">Wide Serves</div>
                <StatRow 
                  label="Success Rate"
                  value1={detailedStats.serveDirectionStats.playerOne.wide.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerOne.wide.successful / detailedStats.serveDirectionStats.playerOne.wide.attempts) * 100) : 0}
                  value2={detailedStats.serveDirectionStats.playerTwo.wide.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerTwo.wide.successful / detailedStats.serveDirectionStats.playerTwo.wide.attempts) * 100) : 0}
                  format="percentage"
                />
                <StatRow 
                  label="Aces Wide"
                  value1={detailedStats.serveDirectionStats.playerOne.wide.aces}
                  value2={detailedStats.serveDirectionStats.playerTwo.wide.aces}
                />
                
                <div className="text-sm font-medium mb-2 mt-4">Body Serves</div>
                <StatRow 
                  label="Success Rate"
                  value1={detailedStats.serveDirectionStats.playerOne.body.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerOne.body.successful / detailedStats.serveDirectionStats.playerOne.body.attempts) * 100) : 0}
                  value2={detailedStats.serveDirectionStats.playerTwo.body.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerTwo.body.successful / detailedStats.serveDirectionStats.playerTwo.body.attempts) * 100) : 0}
                  format="percentage"
                />
                <StatRow 
                  label="Aces Body"
                  value1={detailedStats.serveDirectionStats.playerOne.body.aces}
                  value2={detailedStats.serveDirectionStats.playerTwo.body.aces}
                />

                <div className="text-sm font-medium mb-2 mt-4">T Serves (Center)</div>
                <StatRow 
                  label="Success Rate"
                  value1={detailedStats.serveDirectionStats.playerOne.t.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerOne.t.successful / detailedStats.serveDirectionStats.playerOne.t.attempts) * 100) : 0}
                  value2={detailedStats.serveDirectionStats.playerTwo.t.attempts > 0 ? 
                    Math.round((detailedStats.serveDirectionStats.playerTwo.t.successful / detailedStats.serveDirectionStats.playerTwo.t.attempts) * 100) : 0}
                  format="percentage"
                />
                <StatRow 
                  label="Aces T"
                  value1={detailedStats.serveDirectionStats.playerOne.t.aces}
                  value2={detailedStats.serveDirectionStats.playerTwo.t.aces}
                />
              </CardContent>
            </Card>
          )}

          {/* Shot Direction Analysis */}
          {(detailedStats.shotDirectionStats.playerOne.totalShots > 0 || detailedStats.shotDirectionStats.playerTwo.totalShots > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Shot Direction Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label="Long Winners"
                  value1={detailedStats.shotDirectionStats.playerOne.long.winners}
                  value2={detailedStats.shotDirectionStats.playerTwo.long.winners}
                />
                <StatRow 
                  label="Wide Winners"
                  value1={detailedStats.shotDirectionStats.playerOne.wide.winners}
                  value2={detailedStats.shotDirectionStats.playerTwo.wide.winners}
                />
                <StatRow 
                  label="Net Winners"
                  value1={detailedStats.shotDirectionStats.playerOne.net.winners}
                  value2={detailedStats.shotDirectionStats.playerTwo.net.winners}
                />
                
                <div className="text-sm font-medium mb-2 mt-4">Error Distribution</div>
                <StatRow 
                  label="Long Errors"
                  value1={detailedStats.shotDirectionStats.playerOne.long.errors}
                  value2={detailedStats.shotDirectionStats.playerTwo.long.errors}
                />
                <StatRow 
                  label="Wide Errors"
                  value1={detailedStats.shotDirectionStats.playerOne.wide.errors}
                  value2={detailedStats.shotDirectionStats.playerTwo.wide.errors}
                />
                <StatRow 
                  label="Net Errors"
                  value1={detailedStats.shotDirectionStats.playerOne.net.errors}
                  value2={detailedStats.shotDirectionStats.playerTwo.net.errors}
                />
              </CardContent>
            </Card>
          )}

          {/* Pressure Point Performance */}
          {detailedStats.contextualStats.pressurePointPerformance.breakPoints.total > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Pressure Point Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow 
                  label="Break Point Success"
                  value1={detailedStats.contextualStats.pressurePointPerformance.breakPoints.percentage}
                  value2={100 - detailedStats.contextualStats.pressurePointPerformance.breakPoints.percentage}
                  format="percentage"
                />
                {detailedStats.contextualStats.pressurePointPerformance.setPoints.total > 0 && (
                  <StatRow 
                    label="Set Point Success"
                    value1={detailedStats.contextualStats.pressurePointPerformance.setPoints.percentage}
                    value2={100 - detailedStats.contextualStats.pressurePointPerformance.setPoints.percentage}
                    format="percentage"
                  />
                )}
                {detailedStats.contextualStats.pressurePointPerformance.matchPoints.total > 0 && (
                  <StatRow 
                    label="Match Point Success"
                    value1={detailedStats.contextualStats.pressurePointPerformance.matchPoints.percentage}
                    value2={100 - detailedStats.contextualStats.pressurePointPerformance.matchPoints.percentage}
                    format="percentage"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  )

  // If no sets (shouldn't happen), just show overall stats
  if (setNumbers.length === 0) {
    return (
      <>
        {renderStatsContent(overallStats)}
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
      </>
    )
  }

  // Calculate tab count excluding enhanced stats
  const tabCount = setNumbers.length + 1
  
  // Render with tabs
  return (
    <div className="space-y-4">
      <Tabs defaultValue="match" className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabCount}, 1fr)` }}>
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