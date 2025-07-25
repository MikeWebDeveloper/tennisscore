"use client"

import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Zap, AlertTriangle, Trophy, X } from "lucide-react"
import { PointDetail } from "@/lib/types"

// Extended type for enhanced point details with additional analytics
interface EnhancedPointDetail extends PointDetail {
  serveStats?: {
    speed?: number
    placement?: string
    spin?: string
    netClearance?: number
    quality?: number
  }
  returnStats?: {
    placement?: string
    depth?: string
    direction?: string
    quality?: string
    type?: string
  }
  tacticalContext?: {
    rallyType?: string
    approachShot?: boolean
    netPosition?: boolean
    pressureSituation?: boolean
  }
}
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"

interface StatsDrilldownDialogProps {
  isOpen: boolean
  onClose: () => void
  statType: 'winners' | 'unforcedErrors' | 'forcedErrors' | 'aces' | 'doubleFaults' | null
  playerNames: { p1: string; p2: string }
  pointLog: PointDetail[]
}

export function StatsDrilldownDialog({
  isOpen,
  onClose,
  statType,
  playerNames,
  pointLog
}: StatsDrilldownDialogProps) {
  const t = useTranslations('common')

  if (!statType || !pointLog) return null

  // Filter points based on the stat type
  const getFilteredPoints = () => {
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

  const filteredPoints = getFilteredPoints()

  // Group points by player (correctly attributed)
  const getPlayerPoints = (playerId: 'p1' | 'p2') => {
    return filteredPoints.filter(point => {
      // For errors, attribute to the player who made the error (lastShotPlayer)
      if (statType === 'unforcedErrors' || statType === 'forcedErrors') {
        // Fix buggy data: if lastShotPlayer equals winner for errors, correct it
        let errorPlayer = point.lastShotPlayer;
        if (errorPlayer === point.winner) {
          errorPlayer = point.winner === 'p1' ? 'p2' : 'p1';
        }
        return errorPlayer === playerId;
      }
      // For winners, aces, double faults, attribute to the player who hit the shot
      return point.winner === playerId;
    });
  };

  const player1Points = getPlayerPoints('p1');
  const player2Points = getPlayerPoints('p2');

  // Get breakdown by shot type (if available)
  const getShotTypeBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      if (point.lastShotType) {
        breakdown[point.lastShotType] = (breakdown[point.lastShotType] || 0) + 1
      } else {
        breakdown['unspecified'] = (breakdown['unspecified'] || 0) + 1
      }
    })
    return breakdown
  }

  // Get breakdown by court position
  const getCourtPositionBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      if (point.courtPosition) {
        breakdown[point.courtPosition] = (breakdown[point.courtPosition] || 0) + 1
      } else {
        breakdown['unspecified'] = (breakdown['unspecified'] || 0) + 1
      }
    })
    return breakdown
  }

  // Get serve direction breakdown (for aces/double faults)
  const getServeDirectionBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      // Try enhanced serveStats first, then fall back to basic servePlacement
      const placement = enhancedPoint.serveStats?.placement || point.servePlacement
      if (placement) {
        breakdown[placement] = (breakdown[placement] || 0) + 1
      } else {
        breakdown['unspecified'] = (breakdown['unspecified'] || 0) + 1
      }
    })
    return breakdown
  }

  // Get serve speed breakdown
  const getServeSpeedBreakdown = (points: PointDetail[]) => {
    const speeds: number[] = []
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      const speed = enhancedPoint.serveStats?.speed
      if (speed) speeds.push(speed)
    })
    if (speeds.length === 0) return null
    
    const avg = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
    const max = Math.max(...speeds)
    const min = Math.min(...speeds)
    
    return { average: avg, max, min, count: speeds.length }
  }

  // Get serve spin breakdown
  const getServeSpinBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      const spin = enhancedPoint.serveStats?.spin
      if (spin) {
        breakdown[spin] = (breakdown[spin] || 0) + 1
      }
    })
    return Object.keys(breakdown).length > 0 ? breakdown : null
  }

  // Get return direction breakdown
  const getReturnDirectionBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      const direction = enhancedPoint.returnStats?.direction
      if (direction) {
        breakdown[direction] = (breakdown[direction] || 0) + 1
      }
    })
    return Object.keys(breakdown).length > 0 ? breakdown : null
  }

  // Get return quality breakdown
  const getReturnQualityBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      const quality = enhancedPoint.returnStats?.quality
      if (quality) {
        breakdown[quality] = (breakdown[quality] || 0) + 1
      }
    })
    return Object.keys(breakdown).length > 0 ? breakdown : null
  }

  // Get rally type breakdown
  const getRallyTypeBreakdown = (points: PointDetail[]) => {
    const breakdown: Record<string, number> = {}
    points.forEach(point => {
      const enhancedPoint = point as EnhancedPointDetail
      const rallyType = enhancedPoint.tacticalContext?.rallyType
      if (rallyType) {
        breakdown[rallyType] = (breakdown[rallyType] || 0) + 1
      }
    })
    return Object.keys(breakdown).length > 0 ? breakdown : null
  }

  const getStatIcon = () => {
    switch (statType) {
      case 'winners': return <Trophy className="h-4 w-4" />
      case 'aces': return <Zap className="h-4 w-4" />
      case 'unforcedErrors':
      case 'forcedErrors': return <AlertTriangle className="h-4 w-4" />
      case 'doubleFaults': return <X className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getStatTitle = () => {
    switch (statType) {
      case 'winners': return t('winners')
      case 'unforcedErrors': return t('unforcedErrors')
      case 'forcedErrors': return t('forcedErrors')
      case 'aces': return t('aces')
      case 'doubleFaults': return t('doubleFaults')
      default: return ''
    }
  }

  const renderBreakdownCard = (title: string, breakdown: Record<string, number>) => {
    if (Object.keys(breakdown).length === 0) return null

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(breakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([key, count]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize">{key.replace(/[-_]/g, ' ')}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    )
  }

  const renderSpeedCard = (title: string, speedData: { average: number; max: number; min: number; count: number } | null) => {
    if (!speedData) return null

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Average</span>
            <Badge variant="secondary">{speedData.average} mph</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Maximum</span>
            <Badge variant="secondary">{speedData.max} mph</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Minimum</span>
            <Badge variant="secondary">{speedData.min} mph</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Data Points</span>
            <Badge variant="outline">{speedData.count}</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatIcon()}
            {getStatTitle()} Breakdown
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{filteredPoints.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{player1Points.length}</div>
                <div className="text-sm text-muted-foreground">{playerNames.p1}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{player2Points.length}</div>
                <div className="text-sm text-muted-foreground">{playerNames.p2}</div>
              </CardContent>
            </Card>
          </div>

          {/* Player Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                {playerNames.p1}
              </h3>
              
              {/* Basic breakdowns */}
              {(statType === 'aces' || statType === 'doubleFaults') && 
                renderBreakdownCard('Serve Direction', getServeDirectionBreakdown(player1Points))}
              
              {renderBreakdownCard('Shot Type', getShotTypeBreakdown(player1Points))}
              {renderBreakdownCard('Court Position', getCourtPositionBreakdown(player1Points))}

              {/* Enhanced serve analytics for aces/double faults */}
              {(statType === 'aces' || statType === 'doubleFaults') && (
                <>
                  {renderSpeedCard('Serve Speed', getServeSpeedBreakdown(player1Points))}
                  {getServeSpinBreakdown(player1Points) && 
                    renderBreakdownCard('Serve Spin', getServeSpinBreakdown(player1Points)!)}
                </>
              )}

              {/* Enhanced return analytics for return winners/errors */}
              {(statType === 'winners' || statType === 'unforcedErrors' || statType === 'forcedErrors') && (
                <>
                  {getReturnDirectionBreakdown(player1Points) && 
                    renderBreakdownCard('Return Direction', getReturnDirectionBreakdown(player1Points)!)}
                  {getReturnQualityBreakdown(player1Points) && 
                    renderBreakdownCard('Return Quality', getReturnQualityBreakdown(player1Points)!)}
                </>
              )}

              {/* Rally type analysis for all point types */}
              {getRallyTypeBreakdown(player1Points) && 
                renderBreakdownCard('Rally Type', getRallyTypeBreakdown(player1Points)!)}
            </div>

            {/* Player 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                {playerNames.p2}
              </h3>
              
              {/* Basic breakdowns */}
              {(statType === 'aces' || statType === 'doubleFaults') && 
                renderBreakdownCard('Serve Direction', getServeDirectionBreakdown(player2Points))}
              
              {renderBreakdownCard('Shot Type', getShotTypeBreakdown(player2Points))}
              {renderBreakdownCard('Court Position', getCourtPositionBreakdown(player2Points))}

              {/* Enhanced serve analytics for aces/double faults */}
              {(statType === 'aces' || statType === 'doubleFaults') && (
                <>
                  {renderSpeedCard('Serve Speed', getServeSpeedBreakdown(player2Points))}
                  {getServeSpinBreakdown(player2Points) && 
                    renderBreakdownCard('Serve Spin', getServeSpinBreakdown(player2Points)!)}
                </>
              )}

              {/* Enhanced return analytics for return winners/errors */}
              {(statType === 'winners' || statType === 'unforcedErrors' || statType === 'forcedErrors') && (
                <>
                  {getReturnDirectionBreakdown(player2Points) && 
                    renderBreakdownCard('Return Direction', getReturnDirectionBreakdown(player2Points)!)}
                  {getReturnQualityBreakdown(player2Points) && 
                    renderBreakdownCard('Return Quality', getReturnQualityBreakdown(player2Points)!)}
                </>
              )}

              {/* Rally type analysis for all point types */}
              {getRallyTypeBreakdown(player2Points) && 
                renderBreakdownCard('Rally Type', getRallyTypeBreakdown(player2Points)!)}
            </div>
          </div>

          {/* Point-by-Point List */}
          {filteredPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Point-by-Point Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredPoints.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={point.winner === 'p1' ? 'default' : 'destructive'}>
                          Set {point.setNumber} - Game {point.gameNumber}
                        </Badge>
                        <span className="text-sm">
                          Point {point.pointNumber}
                        </span>
                        {point.lastShotType && (
                          <span className="text-xs text-muted-foreground">
                            {point.lastShotType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {point.courtPosition && (
                          <Badge variant="outline" className="text-xs">
                            {point.courtPosition}
                          </Badge>
                        )}
                        {/* Enhanced serve data */}
                        {(statType === 'aces' || statType === 'doubleFaults') && (() => {
                          const enhancedPoint = point as EnhancedPointDetail
                          return (
                            <>
                              {(enhancedPoint.serveStats?.placement || point.servePlacement) && (
                                <Badge variant="outline" className="text-xs">
                                  {enhancedPoint.serveStats?.placement || point.servePlacement}
                                </Badge>
                              )}
                              {enhancedPoint.serveStats?.speed && (
                                <Badge variant="outline" className="text-xs">
                                  {enhancedPoint.serveStats.speed} mph
                                </Badge>
                              )}
                              {enhancedPoint.serveStats?.spin && (
                                <Badge variant="outline" className="text-xs">
                                  {enhancedPoint.serveStats.spin}
                                </Badge>
                              )}
                            </>
                          )
                        })()}
                        {/* Enhanced return data */}
                        {(statType === 'winners' || statType === 'unforcedErrors' || statType === 'forcedErrors') && (() => {
                          const enhancedPoint = point as EnhancedPointDetail
                          return (
                            <>
                              {enhancedPoint.returnStats?.direction && (
                                <Badge variant="outline" className="text-xs">
                                  {enhancedPoint.returnStats.direction}
                                </Badge>
                              )}
                              {enhancedPoint.returnStats?.quality && (
                                <Badge variant="outline" className="text-xs">
                                  {enhancedPoint.returnStats.quality}
                                </Badge>
                              )}
                            </>
                          )
                        })()}
                        {/* Rally type for all */}
                        {(() => {
                          const enhancedPoint = point as EnhancedPointDetail
                          return enhancedPoint.tacticalContext?.rallyType && (
                            <Badge variant="outline" className="text-xs">
                              {enhancedPoint.tacticalContext.rallyType} rally
                            </Badge>
                          )
                        })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredPoints.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for this statistic</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}