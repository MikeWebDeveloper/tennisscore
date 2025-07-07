import { z } from "zod"

// Match format schema
export const matchFormatSchema = z.object({
  sets: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  gamesPerSet: z.number().default(6),
  tiebreakAt: z.number().default(6),
  finalSetTiebreak: z.enum(["standard", "super", "none"]).default("standard"),
  noAd: z.boolean(),
  detailLevel: z.enum(["points", "simple", "complex"]).default("simple"),
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
  "double_fault"
])

// Serve type schema
export const serveTypeSchema = z.enum([
  "first",
  "second"
])

// Enhanced statistics schemas
export const serveStatsSchema = z.object({
  speed: z.number().optional(),
  placement: z.enum(['deuce-wide', 'deuce-body', 'deuce-t', 'ad-wide', 'ad-body', 'ad-t', 'center-wide', 'center-body', 'center-t']).optional(),
  spin: z.enum(['flat', 'slice', 'kick', 'twist']).optional(),
  netClearance: z.number().optional(),
  quality: z.number().min(1).max(10).optional()
}).optional()

export const returnStatsSchema = z.object({
  placement: z.enum(['deuce-deep', 'center-deep', 'ad-deep', 'deuce-mid', 'center-mid', 'ad-mid', 'deuce-short', 'center-short', 'ad-short']).optional(),
  depth: z.enum(['short', 'medium', 'deep']).optional(),
  direction: z.enum(['cross', 'line', 'body']).optional(),
  quality: z.enum(['defensive', 'neutral', 'offensive']).optional(),
  type: z.enum(['block', 'swing', 'slice', 'defensive']).optional()
}).optional()

export const tacticalContextSchema = z.object({
  rallyType: z.enum(['baseline', 'approach', 'net', 'defensive']).optional(),
  approachShot: z.boolean().optional(),
  netPosition: z.boolean().optional(),
  pressureSituation: z.boolean().optional()
}).optional()

// Point detail schema with enhanced statistics
export const pointDetailSchema = z.object({
  pointNumber: z.number().min(1),
  setNumber: z.number().min(1),
  gameNumber: z.number().min(1),
  winner: z.enum(["p1", "p2"]),
  server: z.enum(["p1", "p2"]),
  outcome: pointOutcomeSchema,
  serveType: serveTypeSchema,
  rallyLength: z.number().min(0).default(0),
  timestamp: z.string().datetime(),
  // Enhanced statistics fields
  serveStats: serveStatsSchema,
  returnStats: returnStatsSchema,
  tacticalContext: tacticalContextSchema,
  loggingLevel: z.enum(['1', '2', '3']).default('1'),
  customFields: z.record(z.any()).optional()
})

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
export type PointDetail = z.infer<typeof pointDetailSchema>
export type EnhancedPointDetail = z.infer<typeof pointDetailSchema>
export type ServeStats = z.infer<typeof serveStatsSchema>
export type ReturnStats = z.infer<typeof returnStatsSchema>
export type TacticalContext = z.infer<typeof tacticalContextSchema>
export type Score = z.infer<typeof scoreSchema> 