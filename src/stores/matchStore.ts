import { create } from 'zustand'
import { 
  isGameWon, 
  isSetWon, 
  isTiebreakWon,
  getTiebreakServer,
  getTennisScore,
  calculateScoreFromPointLog,
  isBreakPoint,
  getPressureLevel,
  isClutchSituation,
  calculateMomentumShift,
  detectComebackSituation,
  calculateCurrentStreak,
  type PressureAnalysis,
  type ClutchSituation,
  type MomentumShift,
  type ComebackSituation,
  type StreakAnalysis
} from '@/lib/utils/tennis-scoring'
import { CourtPosition } from '@/lib/types'

export interface MatchFormat {
  sets: 1 | 3 | 5
  noAd: boolean
  tiebreak: boolean
  finalSetTiebreak: "standard" | "super" | "none"
  finalSetTiebreakAt?: number
  shortSets?: boolean
  detailLevel?: "points" | "simple" | "complex"
}

export interface Score {
  sets: Array<[number, number]>;
  games: [number, number];
  points: [number, number];
  isTiebreak?: boolean;
  tiebreakPoints?: [number, number];
  initialTiebreakServer?: 'p1' | 'p2';
}

// Enhanced serve placement and quality tracking
export interface EnhancedServeData {
  placement?: 'wide' | 'body' | 't' | 'long' | 'net'
  quality?: 1 | 2 | 3 | 4 | 5 // 1=poor, 5=excellent
  spin?: 'flat' | 'slice' | 'kick' | 'twist'
  speed?: number // mph or km/h
  bounceHeight?: 'low' | 'medium' | 'high'
  effectiveness?: 'weak' | 'neutral' | 'strong'
}

// Enhanced return analysis
export interface EnhancedReturnData {
  quality?: 'defensive' | 'neutral' | 'offensive'
  placement?: 'deuce-deep' | 'center-deep' | 'ad-deep' | 'deuce-mid' | 'center-mid' | 'ad-mid' | 'deuce-short' | 'center-short' | 'ad-short'
  type?: 'block' | 'swing' | 'slice' | 'defensive' | 'attack'
  depth?: 'short' | 'medium' | 'deep'
  direction?: 'cross-court' | 'down-the-line' | 'inside-out' | 'inside-in'
  effectiveness?: 'weak' | 'neutral' | 'strong'
}

// Rally characteristics and context
export interface RallyCharacteristics {
  type?: 'baseline' | 'serve-and-volley' | 'net-play' | 'defensive' | 'power-baseline' | 'mixed'
  character?: 'aggressive' | 'defensive' | 'neutral' | 'counter-attacking' | 'grinding'
  keyShots?: Array<{
    shotNumber: number
    shotType: 'forehand' | 'backhand' | 'volley' | 'overhead' | 'drop-shot' | 'lob' | 'slice'
    player: 'p1' | 'p2'
    effectiveness: 'poor' | 'good' | 'excellent'
    turning_point?: boolean
  }>
  dominantPlayer?: 'p1' | 'p2' | 'balanced'
  netApproaches?: number
  changeOfPace?: boolean
}

// Momentum context and indicators
export interface MomentumContext {
  shift?: MomentumShift
  currentStreak?: {
    player: 'p1' | 'p2' | null
    length: number
    type: 'points' | 'games' | 'sets'
  }
  isGameChanger?: boolean
  momentumDirection?: 'p1' | 'p2' | 'neutral'
  emotionalTone?: 'high-energy' | 'tense' | 'routine' | 'deflating' | 'momentum-shifting'
}

// Enhanced match conditions
export interface MatchConditions {
  fatigue?: {
    p1Level: 1 | 2 | 3 | 4 | 5 // 1=fresh, 5=exhausted
    p2Level: 1 | 2 | 3 | 4 | 5
  }
  weather?: {
    condition?: 'sunny' | 'cloudy' | 'windy' | 'hot' | 'cold' | 'humid'
    windStrength?: 'none' | 'light' | 'moderate' | 'strong'
    windDirection?: 'behind-server' | 'against-server' | 'cross-court' | 'variable'
  }
  surface?: {
    type?: 'hard' | 'clay' | 'grass' | 'carpet' | 'synthetic'
    speed?: 'slow' | 'medium' | 'fast'
    condition?: 'good' | 'worn' | 'slippery' | 'rough'
  }
  time?: {
    matchDuration?: number // minutes elapsed
    setDuration?: number // minutes for current set
    gameTime?: number // minutes for current game
  }
}

// Store point detail type - compatible with both schema and legacy types
export interface PointDetail {
  id: string
  timestamp: string
  pointNumber: number
  setNumber: number
  gameNumber: number
  gameScore: string
  winner: 'p1' | 'p2'
  server: 'p1' | 'p2'
  isBreakPoint: boolean
  isSetPoint: boolean
  isMatchPoint: boolean
  isGameWinning: boolean
  isSetWinning: boolean
  isMatchWinning: boolean
  isTiebreak: boolean
  
  // Basic fields for compatibility
  serveType: 'first' | 'second'
  pointOutcome: 'winner' | 'ace' | 'unforced_error' | 'forced_error' | 'double_fault' | 'net'
  serveOutcome?: 'winner' | 'ace' | 'unforced_error' | 'forced_error' | 'double_fault' | 'net'
  rallyLength: number
  lastShotType?: 'forehand' | 'backhand' | 'serve' | 'volley' | 'overhead' | 'other'
  lastShotPlayer?: 'p1' | 'p2'
  notes?: string
  courtPosition?: CourtPosition
  
  // ===== ENHANCED CONTEXTUAL FIELDS =====
  
  // Pressure and clutch analysis
  pressureContext?: PressureAnalysis
  clutchSituation?: ClutchSituation
  comebackContext?: ComebackSituation
  
  // Enhanced serve data
  enhancedServeData?: EnhancedServeData
  
  // Return analysis
  enhancedReturnData?: EnhancedReturnData
  
  // Rally characteristics
  rallyCharacteristics?: RallyCharacteristics
  
  // Momentum indicators
  momentumContext?: MomentumContext
  
  // Match conditions (optional, for progressive enhancement)
  matchConditions?: MatchConditions
  
  // Streak analysis at point of play
  streakAnalysis?: StreakAnalysis
  
  // Additional tactical context
  tacticalContext?: {
    approachShot?: boolean
    netPosition?: boolean
    pressureSituation?: boolean
    tacticalImportance?: 1 | 2 | 3 | 4 | 5 // How tactically important was this point
    gameState?: 'routine' | 'important' | 'crucial' | 'decisive'
    setContext?: 'early' | 'middle' | 'late' | 'decisive'
    matchContext?: 'early' | 'middle' | 'late' | 'decisive'
  }
}

export interface Match {
  $id: string
  playerOneId: string
  playerTwoId: string
  matchDate: string
  matchFormat: MatchFormat
  status: 'In Progress' | 'Completed'
  winnerId?: string
  score: Score
  pointLog: PointDetail[]
  startTime?: string       // When first point was played
  endTime?: string         // When match ended
  setDurations?: number[]  // Duration of each completed set in milliseconds
  retirementReason?: string // Reason if match was retired
  events: Array<{
    type: 'comment' | 'photo'
    content: string
    timestamp: string
  }>
  userId: string
}

// Custom mode configuration interface
export interface CustomModeConfig {
  enabled: boolean
  level: 1 | 2 | 3
  selectedCategories: string[]
}

interface MatchState {
  // Current match being scored
  currentMatch: Match | null
  setCurrentMatch: (match: Match | null) => void
  
  // Live scoring state
  score: Score
  pointLog: PointDetail[]
  currentServer: 'p1' | 'p2' | null
  startingServer: 'p1' | 'p2' | null  // Track who was chosen to serve first
  matchFormat: MatchFormat | null
  initialTiebreakServer: 'p1' | 'p2' | null
  
  // Match state
  isMatchComplete: boolean
  winnerId: string | null
  
  // Streak tracking
  p1Streak: number
  p2Streak: number
  
  // Timing
  startTime: string | null
  endTime: string | null
  setDurations: number[]  // Duration of each completed set in milliseconds
  currentSetStartTime: string | null  // When current set started
  
  // Detailed logging mode
  detailedLoggingEnabled: boolean
  setDetailedLoggingEnabled: (enabled: boolean) => void
  
  // Custom mode for advanced statistics
  customMode: CustomModeConfig
  setCustomMode: (config: CustomModeConfig) => void
  toggleCustomMode: () => void
  
  // Match events (comments, photos)
  events: Array<{ type: 'comment' | 'photo'; content: string; timestamp: string }>
  addEvent: (event: { type: 'comment' | 'photo'; content: string }) => void
  
  // Core actions
  initializeMatch: (match: Match) => void
  awardPoint: (winner: 'p1' | 'p2', details: Partial<PointDetail>) => { 
    newScore: Score
    pointDetail: PointDetail
    isMatchComplete: boolean
    winnerId?: string | null
    startTime?: string
    endTime?: string
    setDurations?: number[]
  }
  undoLastPoint: () => { newScore: Score; newPointLog: PointDetail[] }
  setServer: (server: 'p1' | 'p2') => void
  
  // Reset function for new match
  resetMatch: () => void
}

const initialScore: Score = {
  sets: [],
  games: [0, 0],
  points: [0, 0],
  isTiebreak: false,
  tiebreakPoints: [0, 0],
  initialTiebreakServer: undefined,
}

// Helper function to calculate server based on starting server choice
const getServerWithStartingChoice = (gameNumber: number, startingServer: 'p1' | 'p2'): 'p1' | 'p2' => {
  // gameNumber is 1-indexed (1st game, 2nd game, etc.)
  // Server alternates every game
  const totalGamesPlayed = gameNumber - 1
  
  if (startingServer === 'p1') {
    // P1 serves first: P1 serves games 1,3,5... P2 serves games 2,4,6...
    return totalGamesPlayed % 2 === 0 ? 'p1' : 'p2'
  } else {
    // P2 serves first: P2 serves games 1,3,5... P1 serves games 2,4,6...
    return totalGamesPlayed % 2 === 0 ? 'p2' : 'p1'
  }
}

// Helper function to calculate enhanced contextual data for a point
const calculateEnhancedContext = (
  pointLog: PointDetail[],
  currentScore: Score,
  format: MatchFormat,
  details: Partial<PointDetail>
): {
  pressureContext: PressureAnalysis
  clutchSituation: ClutchSituation
  momentumContext: MomentumContext
  comebackContext: ComebackSituation
  streakAnalysis: StreakAnalysis
  tacticalContext: PointDetail['tacticalContext']
} => {
  // Calculate pressure level
  const pressureContext = getPressureLevel(pointLog, currentScore, format)
  
  // Detect clutch situations
  const clutchSituation = isClutchSituation(pointLog, currentScore, format)
  
  // Calculate momentum shift
  const momentumShift = calculateMomentumShift(pointLog)
  
  // Analyze current streaks
  const streakAnalysis = calculateCurrentStreak(pointLog)
  
  // Detect comeback situations
  const comebackContext = detectComebackSituation(pointLog, currentScore, format)
  
  // Determine if this is a game changer
  const isGameChanger = pressureContext.level >= 4 || 
                       clutchSituation.level >= 4 || 
                       momentumShift.intensity >= 4
  
  // Create momentum context
  const momentumContext: MomentumContext = {
    shift: momentumShift.hasShifted ? momentumShift : undefined,
    currentStreak: streakAnalysis.currentStreak,
    isGameChanger,
    momentumDirection: momentumShift.direction || 'neutral',
    emotionalTone: pressureContext.level >= 4 ? 'tense' : 
                   isGameChanger ? 'momentum-shifting' :
                   pressureContext.level >= 3 ? 'high-energy' : 'routine'
  }
  
  // Calculate tactical importance and context
  const totalPoints = pointLog.length + 1
  const setsPlayed = currentScore.sets.length
  const gamesInCurrentSet = currentScore.games[0] + currentScore.games[1]
  
  const tacticalImportance = Math.min(5, Math.max(1, 
    pressureContext.level + (clutchSituation.level - 1)
  )) as 1 | 2 | 3 | 4 | 5
  
  const gameState: 'routine' | 'important' | 'crucial' | 'decisive' = 
    tacticalImportance >= 4 ? 'decisive' :
    tacticalImportance >= 3 ? 'crucial' :
    tacticalImportance >= 2 ? 'important' : 'routine'
  
  const setContext: 'early' | 'middle' | 'late' | 'decisive' = 
    gamesInCurrentSet <= 2 ? 'early' :
    gamesInCurrentSet >= 10 ? 'decisive' :
    gamesInCurrentSet >= 8 ? 'late' : 'middle'
  
  const matchContext: 'early' | 'middle' | 'late' | 'decisive' = 
    totalPoints <= 20 ? 'early' :
    (setsPlayed >= Math.ceil(format.sets / 2) - 1) ? 'decisive' :
    totalPoints >= 100 ? 'late' : 'middle'
  
  const tacticalContext = {
    approachShot: details.rallyCharacteristics?.netApproaches ? details.rallyCharacteristics.netApproaches > 0 : false,
    netPosition: details.courtPosition === 'net',
    pressureSituation: pressureContext.level >= 3,
    tacticalImportance,
    gameState,
    setContext,
    matchContext
  }
  
  return {
    pressureContext,
    clutchSituation,
    momentumContext,
    comebackContext,
    streakAnalysis,
    tacticalContext
  }
}

// Helper function to enhance serve data based on basic serve info
const enhanceServeData = (
  serveType: 'first' | 'second',
  pointOutcome: string,
  details: Partial<PointDetail>
): EnhancedServeData | undefined => {
  if (!details.enhancedServeData && !details.serveOutcome) {
    // If no enhanced data provided, create basic enhancement based on outcomes
    const isAce = pointOutcome === 'ace'
    const isDoubleFault = pointOutcome === 'double_fault'
    const isWinner = pointOutcome === 'winner'
    
    let quality: 1 | 2 | 3 | 4 | 5 = 3 // default neutral
    let effectiveness: 'weak' | 'neutral' | 'strong' = 'neutral'
    
    if (isAce) {
      quality = 5
      effectiveness = 'strong'
    } else if (isDoubleFault) {
      quality = 1
      effectiveness = 'weak'
    } else if (isWinner && serveType === 'first') {
      quality = 4
      effectiveness = 'strong'
    } else if (details.pointOutcome === 'forced_error') {
      quality = 4
      effectiveness = 'strong'
    } else if (details.pointOutcome === 'unforced_error') {
      quality = 2
      effectiveness = 'weak'
    }
    
    return {
      quality,
      effectiveness,
      ...(details.enhancedServeData || {})
    }
  }
  
  return details.enhancedServeData
}

// Helper function to enhance return data
const enhanceReturnData = (
  server: 'p1' | 'p2',
  winner: 'p1' | 'p2',
  pointOutcome: string,
  details: Partial<PointDetail>
): EnhancedReturnData | undefined => {
  const isReturnWinner = server !== winner
  
  if (!details.enhancedReturnData && isReturnWinner) {
    let quality: 'defensive' | 'neutral' | 'offensive' = 'neutral'
    let effectiveness: 'weak' | 'neutral' | 'strong' = 'neutral'
    
    if (pointOutcome === 'winner' || pointOutcome === 'ace') {
      quality = 'offensive'
      effectiveness = 'strong'
    } else if (pointOutcome === 'forced_error') {
      quality = 'offensive'
      effectiveness = 'strong'
    } else if (pointOutcome === 'unforced_error') {
      quality = 'defensive'
      effectiveness = 'weak'
    }
    
    return {
      quality,
      effectiveness,
      ...(details.enhancedReturnData || {})
    }
  }
  
  return details.enhancedReturnData
}

// Helper function to enhance rally characteristics
const enhanceRallyCharacteristics = (
  rallyLength: number,
  pointOutcome: string,
  lastShotType?: string,
  details?: Partial<PointDetail>
): RallyCharacteristics | undefined => {
  if (details?.rallyCharacteristics) {
    return details.rallyCharacteristics
  }
  
  // Basic rally analysis based on length and outcome
  let type: RallyCharacteristics['type'] = 'baseline'
  let character: RallyCharacteristics['character'] = 'neutral'
  
  if (rallyLength <= 2) {
    type = pointOutcome === 'ace' ? 'serve-and-volley' : 'baseline'
    character = 'aggressive'
  } else if (rallyLength >= 8) {
    character = 'grinding'
  } else if (pointOutcome === 'winner') {
    character = 'aggressive'
  } else if (pointOutcome === 'forced_error') {
    character = 'aggressive'
  } else if (pointOutcome === 'unforced_error') {
    character = 'defensive'
  }
  
  if (lastShotType === 'volley' || lastShotType === 'overhead') {
    type = 'net-play'
    character = 'aggressive'
  }
  
  return {
    type,
    character,
    netApproaches: type === 'net-play' ? 1 : 0
  }
}

// Helper function to calculate current winning streaks
const calculateStreaks = (pointLog: PointDetail[]): { p1Streak: number; p2Streak: number } => {
  if (pointLog.length === 0) return { p1Streak: 0, p2Streak: 0 }
  
  // Look at the most recent points and count consecutive wins
  let p1Streak = 0
  let p2Streak = 0
  
  // Start from the most recent point and count backwards
  for (let i = pointLog.length - 1; i >= 0; i--) {
    const point = pointLog[i]
    if (i === pointLog.length - 1) {
      // Most recent point - start the streak
      if (point.winner === 'p1') {
        p1Streak = 1
      } else {
        p2Streak = 1
      }
    } else {
      // Continue counting if same winner, otherwise break
      if (point.winner === 'p1' && p1Streak > 0) {
        p1Streak++
      } else if (point.winner === 'p2' && p2Streak > 0) {
        p2Streak++
      } else {
        break // Streak broken
      }
    }
  }
  
  return { p1Streak, p2Streak }
}

// Helper function to update match conditions over time
export const updateMatchConditions = (
  currentConditions: MatchConditions | undefined,
  matchDurationMinutes: number,
  updates: Partial<MatchConditions> = {}
): MatchConditions => {
  const baseConditions: MatchConditions = {
    time: {
      matchDuration: matchDurationMinutes,
      ...currentConditions?.time
    },
    fatigue: currentConditions?.fatigue || {
      p1Level: matchDurationMinutes > 120 ? 3 : matchDurationMinutes > 60 ? 2 : 1,
      p2Level: matchDurationMinutes > 120 ? 3 : matchDurationMinutes > 60 ? 2 : 1
    },
    weather: currentConditions?.weather,
    surface: currentConditions?.surface
  }
  
  return {
    ...baseConditions,
    ...updates
  }
}

// Helper function to ensure backward compatibility for existing PointDetail objects
export const normalizePointDetail = (point: Partial<PointDetail> & { winner: 'p1' | 'p2'; server: 'p1' | 'p2' }): PointDetail => {
  // Ensure all required fields exist with defaults
  const normalizedPoint: PointDetail = {
    // Core required fields
    id: point.id || `point-${Date.now()}`,
    timestamp: point.timestamp || new Date().toISOString(),
    pointNumber: point.pointNumber || 1,
    setNumber: point.setNumber || 1,
    gameNumber: point.gameNumber || 1,
    gameScore: point.gameScore || '0-0',
    winner: point.winner || 'p1',
    server: point.server || 'p1',
    
    // Context flags
    isBreakPoint: point.isBreakPoint || false,
    isSetPoint: point.isSetPoint || false,
    isMatchPoint: point.isMatchPoint || false,
    isGameWinning: point.isGameWinning || false,
    isSetWinning: point.isSetWinning || false,
    isMatchWinning: point.isMatchWinning || false,
    isTiebreak: point.isTiebreak || false,
    
    // Basic fields
    serveType: point.serveType || 'first',
    pointOutcome: point.pointOutcome || 'winner',
    rallyLength: point.rallyLength || 1,
    lastShotType: point.lastShotType,
    lastShotPlayer: point.lastShotPlayer,
    notes: point.notes,
    courtPosition: point.courtPosition,
    serveOutcome: point.serveOutcome,
    
    // Enhanced fields (optional, may be undefined for legacy points)
    pressureContext: point.pressureContext,
    clutchSituation: point.clutchSituation,
    momentumContext: point.momentumContext,
    comebackContext: point.comebackContext,
    streakAnalysis: point.streakAnalysis,
    tacticalContext: point.tacticalContext,
    enhancedServeData: point.enhancedServeData,
    enhancedReturnData: point.enhancedReturnData,
    rallyCharacteristics: point.rallyCharacteristics,
    matchConditions: point.matchConditions
  }
  
  return normalizedPoint
}

// Helper function to check if enhanced data is available for a point
export const hasEnhancedData = (point: PointDetail): boolean => {
  return !!(
    point.pressureContext ||
    point.clutchSituation ||
    point.momentumContext ||
    point.enhancedServeData ||
    point.enhancedReturnData ||
    point.rallyCharacteristics
  )
}

// Helper function to get the level of data enhancement for a match
export const getMatchDataEnhancementLevel = (pointLog: PointDetail[]): 'basic' | 'partial' | 'enhanced' => {
  if (pointLog.length === 0) return 'basic'
  
  const enhancedPoints = pointLog.filter(hasEnhancedData).length
  const enhancementRatio = enhancedPoints / pointLog.length
  
  if (enhancementRatio >= 0.8) return 'enhanced'
  if (enhancementRatio >= 0.3) return 'partial'
  return 'basic'
}

// This function will be the single source of truth for score calculation.
// The calculateScoreFromPointLog function is being moved to tennis-scoring.ts
// to centralize scoring logic. It will be removed from this file.

export const useMatchStore = create<MatchState>((set, get) => ({
  currentMatch: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  
  score: initialScore,
  pointLog: [],
  currentServer: null,
  startingServer: null,
  matchFormat: null,
  initialTiebreakServer: null,
  isMatchComplete: false,
  winnerId: null,
  
  p1Streak: 0,
  p2Streak: 0,
  
  startTime: null,
  endTime: null,
  setDurations: [],
  currentSetStartTime: null,
  
  detailedLoggingEnabled: false,
  setDetailedLoggingEnabled: (enabled) => set({ detailedLoggingEnabled: enabled }),
  
  customMode: {
    enabled: false,
    level: 1,
    selectedCategories: ['serve-placement', 'rally-type'],
  },
  setCustomMode: (config) => set({ customMode: config }),
  toggleCustomMode: () => set((state) => ({
    customMode: { ...state.customMode, enabled: !state.customMode.enabled }
  })),
  
  events: [],
  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, timestamp: new Date().toISOString() }]
  })),
  
  initializeMatch: (match) => {
    const score = match.score || initialScore
    const rawPointLog = match.pointLog || []
    // Normalize point log for backward compatibility
    const pointLog = rawPointLog.map(normalizePointDetail)
    let calculatedServer: 'p1' | 'p2' | null = null
    let startingServer: 'p1' | 'p2' = 'p1' // Default to p1 if not set
    
    if (pointLog.length > 0) {
      const recalculatedScore = calculateScoreFromPointLog(pointLog, match.matchFormat)
      
      // Get the starting server from the first point in the log
      startingServer = pointLog[0].server
      
      if (recalculatedScore.isTiebreak) {
        const totalTiebreakPoints = recalculatedScore.tiebreakPoints![0] + recalculatedScore.tiebreakPoints![1]
        calculatedServer = getTiebreakServer(totalTiebreakPoints, recalculatedScore.initialTiebreakServer!)
      } else {
        const totalGamesPlayed = recalculatedScore.sets.reduce((sum, set) => sum + set[0] + set[1], 0) + recalculatedScore.games[0] + recalculatedScore.games[1]
        calculatedServer = getServerWithStartingChoice(totalGamesPlayed + 1, startingServer)
      }
      
      const streaks = calculateStreaks(pointLog)
      
      set({
        currentMatch: match,
        score: recalculatedScore,
        pointLog,
        currentServer: calculatedServer,
        startingServer,
        matchFormat: match.matchFormat,
        initialTiebreakServer: recalculatedScore.initialTiebreakServer || null,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || [],
        startTime: match.startTime || null,
        endTime: match.endTime || null,
        setDurations: match.setDurations || [],
        currentSetStartTime: match.startTime || null,
        p1Streak: streaks.p1Streak,
        p2Streak: streaks.p2Streak,
      })
    } else {
      // For new matches, keep existing server or default to player 1
      const currentState = get()
      startingServer = currentState.currentServer || 'p1'
      calculatedServer = startingServer
      
      set({
        currentMatch: match,
        score,
        pointLog,
        currentServer: calculatedServer,
        startingServer,
        matchFormat: match.matchFormat,
        initialTiebreakServer: score.initialTiebreakServer || null,
        isMatchComplete: match.status === 'Completed',
        winnerId: match.winnerId || null,
        events: match.events || [],
        startTime: match.startTime || null,
        endTime: match.endTime || null,
        setDurations: match.setDurations || [],
        currentSetStartTime: match.startTime || null,
        p1Streak: 0,
        p2Streak: 0,
      })
    }
  },
  
  awardPoint: (winner, details) => {
    const state = get()
    
    if (state.isMatchComplete) throw new Error('Match is already complete.')
    if (!state.currentServer || !state.matchFormat || !state.currentMatch) throw new Error('Match not properly initialized')
    
    // Handle timing for first point
    const isFirstPoint = state.pointLog.length === 0
    const currentTime = new Date().toISOString()
    let newStartTime = state.startTime
    let newCurrentSetStartTime = state.currentSetStartTime
    
    if (isFirstPoint) {
      newStartTime = currentTime
      newCurrentSetStartTime = currentTime
    }

    const { matchFormat, currentServer, pointLog, score: previousScore } = state
    const winnerId_map = { p1: state.currentMatch.playerOneId, p2: state.currentMatch.playerTwoId }

    // --- 1. Determine point context (isBreakPoint, etc.) BEFORE adding the point ---
    const setsNeededToWin = Math.ceil(matchFormat.sets / 2)
    const currentP1SetsWon = previousScore.sets.filter((s: [number, number]) => s[0] > s[1]).length
    const currentP2SetsWon = previousScore.sets.filter((s: [number, number]) => s[1] > s[0]).length
    
    let isThisPointBreakPoint = false
    let isThisPointSetPoint = false
    let isThisPointMatchPoint = false
    let isThisPointGameWinning = false
    let isThisPointSetWinning = false
    let isThisPointMatchWinning = false
    const isDecidingSet = currentP1SetsWon === setsNeededToWin - 1 && currentP2SetsWon === setsNeededToWin - 1

    // Check if this point will win the game/set/match
    if (previousScore.isTiebreak) {
        const tiebreakTarget = (matchFormat.finalSetTiebreak && isDecidingSet) ? (matchFormat.finalSetTiebreakAt || 10) : 7
        const [p1_tb, p2_tb] = previousScore.tiebreakPoints || [0,0]
        const temp_p1 = p1_tb + (winner === 'p1' ? 1 : 0)
        const temp_p2 = p2_tb + (winner === 'p2' ? 1 : 0)
        
        // Check if this wins the tiebreak
        if (isTiebreakWon(temp_p1, temp_p2, tiebreakTarget)) {
            isThisPointGameWinning = true
            isThisPointSetWinning = true
            isThisPointSetPoint = true
            
            // Check if this wins the match
            const newP1Sets = currentP1SetsWon + (winner === 'p1' ? 1 : 0)
            const newP2Sets = currentP2SetsWon + (winner === 'p2' ? 1 : 0)
            if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
                isThisPointMatchWinning = true
                isThisPointMatchPoint = true
            }
        }
    } else {
        const [p1Score, p2Score] = previousScore.points
        const temp_p1_score = p1Score + (winner === 'p1' ? 1 : 0)
        const temp_p2_score = p2Score + (winner === 'p2' ? 1 : 0)
        
        // BREAK POINT: Use proper break point detection logic
        const serverPoints = currentServer === 'p1' ? previousScore.points[0] : previousScore.points[1]
        const returnerPoints = currentServer === 'p1' ? previousScore.points[1] : previousScore.points[0]
        
        // Check if this is a break point situation (receiver can win game with this point)
        isThisPointBreakPoint = isBreakPoint(serverPoints, returnerPoints, matchFormat.noAd)
        
        // SET POINT & MATCH POINT: Check if winning this point could win the set
        // First check if this point would win the game
        if (isGameWon(temp_p1_score, temp_p2_score, matchFormat.noAd)) {
            isThisPointGameWinning = true
            
            // Check if winning this game would win the set
            const tempGames = [...previousScore.games] as [number, number];
            tempGames[winner === 'p1' ? 0 : 1]++
            
            // Debug logging for Set Point detection
            console.log('🎾 SET POINT Detection (Game Winning):', {
                currentGames: previousScore.games,
                tempGames,
                winner,
                wouldWinSet: isSetWon(tempGames[0], tempGames[1], matchFormat),
                currentPoints: previousScore.points,
                tempPoints: [temp_p1_score, temp_p2_score],
                explanation: `${winner} wins this point → wins game → ${tempGames[0]}-${tempGames[1]} games`
            })
            
            if (isSetWon(tempGames[0], tempGames[1], matchFormat)) {
                isThisPointSetWinning = true
                isThisPointSetPoint = true
                
                console.log('✅ SET POINT DETECTED! (via game win)', { winner, games: tempGames })
                
                // MATCH POINT: Check if winning this set would win the match
                const newP1Sets = currentP1SetsWon + (winner === 'p1' ? 1 : 0)
                const newP2Sets = currentP2SetsWon + (winner === 'p2' ? 1 : 0)
                if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
                    isThisPointMatchWinning = true
                    isThisPointMatchPoint = true
                    console.log('✅ MATCH POINT DETECTED!', { winner, newP1Sets, newP2Sets, setsNeeded: setsNeededToWin })
                }
            }
        } else {
            console.log('❌ NOT Game Point:', {
                currentPoints: previousScore.points,
                tempPoints: [temp_p1_score, temp_p2_score],
                winner,
                isGameWonResult: isGameWon(temp_p1_score, temp_p2_score, matchFormat.noAd),
                reason: 'This point would not win the game'
            })
            
            // ADDITIONAL SET POINT CHECK: Even if this point doesn't win the game,
            // check if the player would be in a winning position next point
            // This handles cases where player is at 40 and could win set with next point
            const currentGames = [...previousScore.games] as [number, number]
            
            // Check if player would be close to winning set if they get to a winning position
            const p1CouldWinSetNextGame = currentGames[0] + 1 >= 6 && (currentGames[0] + 1 - currentGames[1] >= 2 || (currentGames[0] + 1 === 7 && currentGames[1] === 6))
            const p2CouldWinSetNextGame = currentGames[1] + 1 >= 6 && (currentGames[1] + 1 - currentGames[0] >= 2 || (currentGames[1] + 1 === 7 && currentGames[0] === 6))
            
            // Check if this player is at 40 (3 points) or in advantage position and opponent has fewer points
            // UPDATED: Also consider deuce situations when player could win set
            const p1AtGamePoint = (p1Score >= 3 && (p1Score > p2Score || (p1Score === 3 && p2Score < 3)))
            const p2AtGamePoint = (p2Score >= 3 && (p2Score > p1Score || (p2Score === 3 && p1Score < 3)))
            
            // DEUCE SET POINT: At deuce (40-40), if either player could win the set, it's a set point
            const isDeuceSetPoint = (p1Score === 3 && p2Score === 3) && 
                ((winner === 'p1' && p1CouldWinSetNextGame) || (winner === 'p2' && p2CouldWinSetNextGame))
            
            console.log('🎾 Additional Set Point Check:', {
                currentGames,
                currentPoints: previousScore.points,
                p1Score,
                p2Score,
                p1CouldWinSetNextGame,
                p2CouldWinSetNextGame,
                p1AtGamePoint,
                p2AtGamePoint,
                isDeuceSetPoint,
                winner,
                                    p1AtGamePointLogic: `p1Score >= 3: ${p1Score >= 3}, p1Score > p2Score: ${p1Score > p2Score}, p1Score === 3 && p2Score < 3: ${p1Score === 3 && p2Score < 3}`,
                p2AtGamePointLogic: `p2Score >= 3: ${p2Score >= 3}, p2Score > p1Score: ${p2Score > p1Score}, p2Score === 3 && p1Score < 3: ${p2Score === 3 && p1Score < 3}`,
                deuceLogic: `p1Score === 3 && p2Score === 3: ${p1Score === 3 && p2Score === 3}`,
                setPointCondition: `Regular: ${(winner === 'p1' && p1AtGamePoint && p1CouldWinSetNextGame) || (winner === 'p2' && p2AtGamePoint && p2CouldWinSetNextGame)}, Deuce: ${isDeuceSetPoint}`
            })
            
            if ((winner === 'p1' && p1AtGamePoint && p1CouldWinSetNextGame) ||
                (winner === 'p2' && p2AtGamePoint && p2CouldWinSetNextGame) ||
                isDeuceSetPoint) {
                isThisPointSetPoint = true
                console.log('✅ SET POINT DETECTED! (player at game point position)', { 
                    winner, 
                    currentGames,
                    points: previousScore.points,
                    detectionType: isDeuceSetPoint ? 'DEUCE SET POINT' : 'REGULAR SET POINT',
                    gamePointPlayer: winner === 'p1' ? 'p1AtGamePoint' : 'p2AtGamePoint',
                    gamePointValue: winner === 'p1' ? p1AtGamePoint : p2AtGamePoint
                })
                
                // Check if this would also be match point
                const newP1Sets = currentP1SetsWon + (winner === 'p1' ? 1 : 0)
                const newP2Sets = currentP2SetsWon + (winner === 'p2' ? 1 : 0)
                if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
                    isThisPointMatchPoint = true
                    console.log('✅ MATCH POINT DETECTED! (via set point)', { winner, newP1Sets, newP2Sets })
                }
            } else {
                console.log('❌ SET POINT NOT DETECTED:', {
                    winner,
                    p1AtGamePoint,
                    p2AtGamePoint, 
                    isDeuceSetPoint,
                    p1CouldWinSetNextGame,
                    p2CouldWinSetNextGame,
                    reason: winner === 'p1' ? 
                        `p1AtGamePoint: ${p1AtGamePoint}, p1CouldWinSetNextGame: ${p1CouldWinSetNextGame}, isDeuceSetPoint: ${isDeuceSetPoint}` :
                        `p2AtGamePoint: ${p2AtGamePoint}, p2CouldWinSetNextGame: ${p2CouldWinSetNextGame}, isDeuceSetPoint: ${isDeuceSetPoint}`
                })
            }
        }
    }

    // --- Create a temporary score object to find the score *after* this point ---
    const tempScore = JSON.parse(JSON.stringify(previousScore));
    const winnerIdx = winner === 'p1' ? 0 : 1;
    if (tempScore.isTiebreak) {
        if (!tempScore.tiebreakPoints) tempScore.tiebreakPoints = [0, 0];
        tempScore.tiebreakPoints[winnerIdx]++;
    } else {
        tempScore.points[winnerIdx]++;
    }

    // --- Use the temporary score to create the correct gameScore string for the log ---
    const gameScoreToStore = tempScore.isTiebreak
      ? `${tempScore.tiebreakPoints[0]}-${tempScore.tiebreakPoints[1]}`
      : getTennisScore(tempScore.points[0], tempScore.points[1]);

    // Debug log for breakpoint detection in point storage
    console.log('💾 Storing Point - BP Detection:', {
      currentServer,
      scoreBEFORE: `${previousScore.points[0]}-${previousScore.points[1]}`,
      scoreAFTER: gameScoreToStore,
      serverPoints: currentServer === 'p1' ? previousScore.points[0] : previousScore.points[1],
      returnerPoints: currentServer === 'p1' ? previousScore.points[1] : previousScore.points[0],
      noAd: matchFormat.noAd,
      isBreakPoint: isThisPointBreakPoint,
      pointWinner: winner,
      explanation: isThisPointBreakPoint ? 
        `✅ BP: Returner ${currentServer === 'p1' ? 'p2' : 'p1'} could break serve by winning this point` : 
        '❌ No BP: No break opportunity'
    })

    // Fix: Check both outcome and pointOutcome for error types
    const outcomeToCheck = details.pointOutcome;
    let correctedLastShotPlayer = details.lastShotPlayer;
    
    // If no lastShotPlayer provided, calculate it based on outcome
    if (!correctedLastShotPlayer) {
      if (outcomeToCheck === 'forced_error' || outcomeToCheck === 'unforced_error') {
        // For errors, the lastShotPlayer should be the opponent (who made the error)
        correctedLastShotPlayer = winner === 'p1' ? 'p2' : 'p1';
      } else {
        // For winners, aces, etc., the lastShotPlayer should be the winner
        correctedLastShotPlayer = winner;
      }
    }
    
    // Debug logging available for troubleshooting
    // console.log('Store: Corrected lastShotPlayer for', outcomeToCheck, 'from', details.lastShotPlayer, 'to', correctedLastShotPlayer);

    // Calculate enhanced contextual data for this point
    const enhancedContext = calculateEnhancedContext(pointLog, previousScore, matchFormat, details)
    
    // Enhance serve data
    const enhancedServeData = enhanceServeData(
      details.serveType || 'first',
      details.pointOutcome || 'winner',
      details
    )
    
    // Enhance return data
    const enhancedReturnData = enhanceReturnData(
      currentServer,
      winner,
      details.pointOutcome || 'winner',
      details
    )
    
    // Enhance rally characteristics
    const rallyCharacteristics = enhanceRallyCharacteristics(
      details.rallyLength || 1,
      details.pointOutcome || 'winner',
      details.lastShotType,
      details
    )

    const pointDetail: PointDetail = {
      ...details,
      id: `point-${pointLog.length + 1}`,
      timestamp: new Date().toISOString(),
      pointNumber: pointLog.length + 1,
      setNumber: previousScore.sets.length + 1,
      gameNumber: previousScore.games[0] + previousScore.games[1] + 1,
      gameScore: gameScoreToStore,
      winner,
      server: currentServer,
      isBreakPoint: isThisPointBreakPoint,
      isSetPoint: isThisPointSetPoint,
      isMatchPoint: isThisPointMatchPoint,
      isGameWinning: isThisPointGameWinning,
      isSetWinning: isThisPointSetWinning,
      isMatchWinning: isThisPointMatchWinning,
      isTiebreak: previousScore.isTiebreak || false,
      serveType: details.serveType || 'first',
      pointOutcome: details.pointOutcome || 'winner',
      rallyLength: details.rallyLength || 1,
      lastShotPlayer: correctedLastShotPlayer,
      
      // ===== ENHANCED CONTEXTUAL DATA =====
      pressureContext: enhancedContext.pressureContext,
      clutchSituation: enhancedContext.clutchSituation,
      momentumContext: enhancedContext.momentumContext,
      comebackContext: enhancedContext.comebackContext,
      streakAnalysis: enhancedContext.streakAnalysis,
      tacticalContext: enhancedContext.tacticalContext,
      
      // Enhanced serve, return, and rally data
      enhancedServeData,
      enhancedReturnData,
      rallyCharacteristics,
      
      // Match conditions (optional - can be populated later)
      matchConditions: details.matchConditions
    }

    const newPointLog = [...pointLog, pointDetail]
    const newScore = calculateScoreFromPointLog(newPointLog, matchFormat)
    
    // Calculate updated streaks
    const newStreaks = calculateStreaks(newPointLog)
    
    const finalP1SetsWon = newScore.sets.length > 0 ? newScore.sets.filter((set: [number, number]) => set[0] > set[1]).length : 0
    const finalP2SetsWon = newScore.sets.length > 0 ? newScore.sets.filter((set: [number, number]) => set[1] > set[0]).length : 0
    
    const isMatchComplete = finalP1SetsWon >= setsNeededToWin || finalP2SetsWon >= setsNeededToWin
    const matchWinnerId = isMatchComplete ? (finalP1SetsWon >= setsNeededToWin ? winnerId_map.p1 : winnerId_map.p2) : null
    
    // Handle set completion timing
    const newSetDurations = [...state.setDurations]
    const previousSetCount = previousScore.sets.length
    const newSetCount = newScore.sets.length
    
    if (newSetCount > previousSetCount && newCurrentSetStartTime) {
      // A new set has been completed
      const setDuration = Date.parse(currentTime) - Date.parse(newCurrentSetStartTime)
      newSetDurations.push(setDuration)
      newCurrentSetStartTime = isMatchComplete ? null : currentTime // Start timing next set unless match is over
    }
    
    // Handle match completion timing
    let newEndTime = state.endTime
    if (isMatchComplete && !newEndTime) {
      newEndTime = currentTime
    }

    let nextServer = currentServer
    if (newScore.isTiebreak) {
        const totalTbPoints = newScore.tiebreakPoints![0] + newScore.tiebreakPoints![1]
        nextServer = getTiebreakServer(totalTbPoints, newScore.initialTiebreakServer!)
    } else {
        const prevTotalGames = previousScore.games[0] + previousScore.games[1] + previousScore.sets.reduce((acc, s) => acc + s[0] + s[1], 0)
        const newTotalGames = newScore.games[0] + newScore.games[1] + newScore.sets.reduce((acc, s) => acc + s[0] + s[1], 0)
        if (newTotalGames > prevTotalGames) {
            nextServer = currentServer === 'p1' ? 'p2' : 'p1'
        }
    }
    
    set({
      score: newScore,
      pointLog: newPointLog,
      currentServer: nextServer,
      initialTiebreakServer: newScore.initialTiebreakServer || null,
      isMatchComplete: isMatchComplete,
      winnerId: matchWinnerId || null,
      startTime: newStartTime,
      endTime: newEndTime,
      setDurations: newSetDurations,
      currentSetStartTime: newCurrentSetStartTime,
      p1Streak: newStreaks.p1Streak,
      p2Streak: newStreaks.p2Streak,
    })

    return { 
      newScore, 
      pointDetail, 
      isMatchComplete, 
      winnerId: matchWinnerId,
      startTime: newStartTime || undefined,
      endTime: newEndTime || undefined,
      setDurations: newSetDurations
    }
  },
  
  undoLastPoint: () => {
    const state = get()
    if (state.pointLog.length === 0 || !state.matchFormat) {
      throw new Error('No points to undo or match not initialized')
    }
    const newPointLog = state.pointLog.slice(0, -1)
    const lastPoint = state.pointLog[state.pointLog.length -1]
    
    const recalculatedScore = calculateScoreFromPointLog(newPointLog, state.matchFormat)
    const newStreaks = calculateStreaks(newPointLog)
    
    const newServer = lastPoint.server
    
    set({
      score: recalculatedScore,
      pointLog: newPointLog,
      currentServer: newServer,
      initialTiebreakServer: recalculatedScore.initialTiebreakServer || null,
      isMatchComplete: false,
      winnerId: null,
      p1Streak: newStreaks.p1Streak,
      p2Streak: newStreaks.p2Streak,
    })
    return { newScore: recalculatedScore, newPointLog }
  },
  
  setServer: (server) => {
    const state = get()
    // If no points have been played yet, this sets the starting server
    if (state.pointLog.length === 0) {
      set({ currentServer: server, startingServer: server })
    } else {
      set({ currentServer: server })
    }
  },
  
  resetMatch: () => set({
    currentMatch: null,
    score: initialScore,
    pointLog: [],
    p1Streak: 0,
    p2Streak: 0,
    currentServer: null,
    startingServer: null,
    matchFormat: null,
    initialTiebreakServer: null,
    events: [],
    isMatchComplete: false,
    winnerId: null,
    detailedLoggingEnabled: false,
    customMode: {
      enabled: false,
      level: 1,
      selectedCategories: ['serve-placement', 'rally-type'],
    },
  }),
}))

// Test function to verify break point logic
function testBreakPointLogic() {
  console.log('=== Testing Break Point Logic ===')
  
  // Test traditional scoring
  console.log('Traditional Scoring Tests:')
  
  // Should be BP: 0-40 (server p1, receiver p2 at 3 points)
  console.log('0-40 (p1 serving):', {
    beforeP1: 0, beforeP2: 3,
    shouldBeBP: true,
    actualBP: (3 >= 3 && 0 < 3) // P2 >= 3 && P1 < 3
  })
  
  // Should be BP: 15-40 
  console.log('15-40 (p1 serving):', {
    beforeP1: 1, beforeP2: 3,
    shouldBeBP: true,
    actualBP: (3 >= 3 && 1 < 3)
  })
  
  // Should NOT be BP: 40-40 (deuce)
  console.log('40-40 (p1 serving):', {
    beforeP1: 3, beforeP2: 3,
    shouldBeBP: false,
    actualBP: (3 >= 3 && 3 < 3) || (3 >= 3 && 3 >= 3 && 3 > 3) // False
  })
  
  // Should be BP: 40-AD (receiver advantage)
  console.log('40-AD (p1 serving):', {
    beforeP1: 3, beforeP2: 4,
    shouldBeBP: true,
    actualBP: (4 >= 3 && 3 >= 3 && 4 > 3)
  })
}

// Call test function
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testBreakPointLogic = testBreakPointLogic
} 