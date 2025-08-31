// Tennis Context Types for Enhanced Analytics

export interface PressureContext {
  level: 1 | 2 | 3 | 4 | 5
  type: 'break_point' | 'set_point' | 'match_point' | 'game_point' | 'normal'
  description: string
  importance: number // 0-100
  servingToStayInSet?: boolean
  servingToStayInMatch?: boolean
}

export interface ClutchSituation {
  level: 1 | 2 | 3 | 4 | 5
  type: 'tiebreak' | 'deciding_set' | 'match_point_save' | 'break_point_save'
  pressure: number // 0-100
  stakes: 'low' | 'medium' | 'high' | 'critical'
}

export interface MomentumContext {
  value: number // -100 to 100
  trend: 'rising' | 'falling' | 'stable'
  streakLength: number
  lastShift?: {
    point: number
    reason: string
  }
}

export interface ServeEnhancement {
  firstServePercentage: number
  secondServePointsWon: number
  acesPerSet: number
  doubleFaultsPerSet: number
  serveSpeed?: {
    first: number
    second: number
  }
}

export interface RallyCharacteristics {
  length: number
  type: 'baseline' | 'net_play' | 'serve_volley' | 'mixed'
  winnerType?: 'forehand' | 'backhand' | 'volley' | 'overhead' | 'drop_shot'
  errorType?: 'unforced' | 'forced'
}

export interface EnhancedPoint {
  winner: 'player1' | 'player2'
  server: 'player1' | 'player2'
  timestamp: number
  duration?: number
  pressureContext?: PressureContext
  clutchSituation?: ClutchSituation
  momentum?: MomentumContext
  serveData?: ServeEnhancement
  rallyData?: RallyCharacteristics
}

// Tennis Statistical Types
export interface TennisStatistics {
  pointsWon: number
  totalPoints: number
  gamesWon: number
  totalGames: number
  setsWon: number
  totalSets: number
  firstServePercentage: number
  firstServePointsWon: number
  secondServePointsWon: number
  breakPointsConverted: number
  breakPointsTotal: number
  aces: number
  doubleFaults: number
  winners: number
  unforcedErrors: number
  forcedErrors: number
}

export interface PerformanceMetrics {
  pressurePointsWon: number
  pressurePointsTotal: number
  clutchPerformance: number // 0-100
  momentum: MomentumContext
  consistencyRating: number // 0-100
  powerRating: number // 0-100
  tacticalRating: number // 0-100
}

// Type guards for enhanced points
export function hasPressureContext(point: any): point is any & { pressureContext: PressureContext } {
  return point && point.pressureContext !== undefined
}

export function hasClutchSituation(point: any): point is any & { clutchSituation: ClutchSituation } {
  return point && point.clutchSituation !== undefined
}

export function hasMomentumData(point: any): point is any & { momentum: MomentumContext } {
  return point && point.momentum !== undefined
}

export function hasServeData(point: any): point is any & { serveData: ServeEnhancement } {
  return point && point.serveData !== undefined
}

export function hasRallyData(point: any): point is any & { rallyData: RallyCharacteristics } {
  return point && point.rallyData !== undefined
}

// Utility functions for statistics calculation
export function calculatePressureRating(stats: PerformanceMetrics): number {
  if (stats.pressurePointsTotal === 0) return 0
  return (stats.pressurePointsWon / stats.pressurePointsTotal) * 100
}

export function calculateOverallPerformance(
  tennisStats: TennisStatistics,
  performanceMetrics: PerformanceMetrics
): number {
  const basePerformance = (tennisStats.pointsWon / tennisStats.totalPoints) * 100
  const pressureBonus = calculatePressureRating(performanceMetrics) * 0.2
  const clutchBonus = performanceMetrics.clutchPerformance * 0.1
  
  return Math.min(100, basePerformance + pressureBonus + clutchBonus)
}

// Type for match analysis context
export interface MatchAnalysisContext {
  player1Stats: TennisStatistics
  player2Stats: TennisStatistics
  player1Performance: PerformanceMetrics
  player2Performance: PerformanceMetrics
  enhancedPoints: EnhancedPoint[]
  matchDuration: number
  courtSurface?: 'hard' | 'clay' | 'grass' | 'carpet'
  weather?: {
    temperature: number
    humidity: number
    windSpeed: number
  }
}