import { z } from "zod"

// Match format schema
export const matchFormatSchema = z.object({
  sets: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  gamesPerSet: z.number().default(6),
  tiebreakAt: z.number().default(6),
  finalSetTiebreak: z.enum(["standard", "super", "none"]).default("standard"),
  noAd: z.boolean(),
  detailLevel: z.enum(["points", "simple", "detailed", "complex"]).default("simple"),
  // Custom mode configuration
  customModeConfig: z.object({
    enabled: z.boolean().default(false),
    categories: z.array(z.enum([
      'serve-placement',
      'serve-speed', 
      'serve-spin',
      'return-quality',
      'return-placement',
      'rally-type',
      'shot-tracking',
      'tactical-context',
      'pressure-situations'
    ])).default([]),
    level: z.enum(['1', '2', '3']).default('1')
  }).optional(),
})

// Match creation schema
export const createMatchSchema = z.object({
  playerOneId: z.string().min(1, "Player 1 is required"),
  playerTwoId: z.string().min(1, "Player 2 is required"),
  playerThreeId: z.string().optional(),
  playerFourId: z.string().optional(),
  tournamentName: z.string().optional(),
  matchFormat: matchFormatSchema,
}).refine(
  (data) => data.playerOneId !== data.playerTwoId,
  {
    message: "Players must be different",
    path: ["playerTwoId"]
  }
)

// Point outcome schema
export const pointOutcomeSchema = z.enum([
  "ace",
  "winner", 
  "unforced_error",
  "forced_error",
  "double_fault",
  "net"
])

// Serve type schema
export const serveTypeSchema = z.enum([
  "first",
  "second"
])

// Enhanced statistics schemas
export const serveStatsSchema = z.object({
  speed: z.number().optional(),
  placement: z.enum(['long', 'wide', 'net']).optional(),
  spin: z.enum(['flat', 'slice', 'kick', 'twist']).optional(),
  netClearance: z.number().optional(),
  quality: z.number().min(1).max(10).optional()
}).optional()

export const returnStatsSchema = z.object({
  placement: z.enum(['deuce-deep', 'center-deep', 'ad-deep', 'deuce-mid', 'center-mid', 'ad-mid', 'deuce-short', 'center-short', 'ad-short']).optional(),
  depth: z.enum(['short', 'medium', 'deep']).optional(),
  direction: z.enum(['long', 'wide', 'net']).optional(),
  quality: z.enum(['defensive', 'neutral', 'offensive']).optional(),
  type: z.enum(['block', 'swing', 'slice', 'defensive']).optional()
}).optional()

export const tacticalContextSchema = z.object({
  rallyType: z.enum(['baseline', 'approach', 'net', 'defensive']).optional(),
  approachShot: z.boolean().optional(),
  netPosition: z.boolean().optional(),
  pressureSituation: z.boolean().optional()
}).optional()

// Base point detail schema - common to all detail levels
export const basePointDetailSchema = z.object({
  // Core identification
  id: z.string(),
  timestamp: z.string().datetime(),
  pointNumber: z.number().min(1),
  setNumber: z.number().min(1),
  gameNumber: z.number().min(1),
  gameScore: z.string(),
  
  // Point outcome
  winner: z.enum(["p1", "p2"]),
  server: z.enum(["p1", "p2"]),
  
  // Context flags
  isBreakPoint: z.boolean().default(false),
  isSetPoint: z.boolean().default(false),
  isMatchPoint: z.boolean().default(false),
  isGameWinning: z.boolean().default(false),
  isSetWinning: z.boolean().default(false),
  isMatchWinning: z.boolean().default(false),
  isTiebreak: z.boolean().default(false),
  
  // Data collection level
  loggingLevel: z.enum(['points', 'simple', 'detailed', 'complex']).default('points'),
})

// Points-only mode schema - minimal data
export const pointsOnlyDetailSchema = basePointDetailSchema.extend({
  loggingLevel: z.literal('points'),
  // No additional fields - just the base data
})

// Simple mode schema - adds point outcomes and serve types
export const simplePointDetailSchema = basePointDetailSchema.extend({
  loggingLevel: z.literal('simple'),
  
  // Serve information
  serveType: serveTypeSchema,
  
  // Point outcome classification
  pointOutcome: pointOutcomeSchema,
  
  // Estimated rally length
  rallyLength: z.number().min(0).default(1),
  
  // Basic shot information
  lastShotType: z.enum(['serve', 'forehand', 'backhand', 'volley', 'overhead']).optional(),
  lastShotPlayer: z.enum(['p1', 'p2']).optional(),
})

// Detailed mode schema - adds positioning and enhanced data
export const detailedPointDetailSchema = simplePointDetailSchema.extend({
  loggingLevel: z.literal('detailed'),
  
  // Enhanced serve information
  serveOutcome: pointOutcomeSchema.optional(),
  servePlacement: z.enum(['wide', 'body', 't']).optional(),
  
  // Shot direction
  shotDirection: z.enum(['long', 'wide', 'net']).optional(),
  
  // More precise rally length
  rallyLength: z.number().min(0).default(3),
})

// Complex mode schema - includes all advanced statistics  
export const complexPointDetailSchema = detailedPointDetailSchema.extend({
  loggingLevel: z.literal('complex'),
  
  // Advanced serve statistics
  serveStats: serveStatsSchema,
  
  // Return statistics
  returnStats: returnStatsSchema,
  
  // Tactical context
  tacticalContext: tacticalContextSchema,
  
  // Custom fields for user-defined data
  customFields: z.record(z.any()).optional(),
})

// Union type for all point detail schemas
export const pointDetailSchema = z.discriminatedUnion('loggingLevel', [
  pointsOnlyDetailSchema,
  simplePointDetailSchema,
  detailedPointDetailSchema,
  complexPointDetailSchema,
])

// Score schema
export const scoreSchema = z.object({
  sets: z.array(z.tuple([z.number(), z.number()])),
  games: z.tuple([z.number(), z.number()]),
  points: z.tuple([z.number(), z.number()])
})

// Export types
export type MatchFormat = z.infer<typeof matchFormatSchema>
export type CreateMatchData = z.infer<typeof createMatchSchema>
export type PointOutcome = z.infer<typeof pointOutcomeSchema>
export type ServeType = z.infer<typeof serveTypeSchema>
// Export individual types
export type BasePointDetail = z.infer<typeof basePointDetailSchema>
export type PointsOnlyDetail = z.infer<typeof pointsOnlyDetailSchema>
export type SimplePointDetail = z.infer<typeof simplePointDetailSchema>
export type DetailedPointDetail = z.infer<typeof detailedPointDetailSchema>
export type ComplexPointDetail = z.infer<typeof complexPointDetailSchema>

// Main point detail type (discriminated union)
export type PointDetail = z.infer<typeof pointDetailSchema>

// Backward compatibility
export type EnhancedPointDetail = ComplexPointDetail
export type ServeStats = z.infer<typeof serveStatsSchema>
export type ReturnStats = z.infer<typeof returnStatsSchema>
export type TacticalContext = z.infer<typeof tacticalContextSchema>
export type Score = z.infer<typeof scoreSchema> 