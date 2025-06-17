import { z } from "zod"

// Match format schema
export const matchFormatSchema = z.object({
  sets: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  noAd: z.boolean(),
  tiebreak: z.boolean(),
  finalSetTiebreak: z.boolean(),
  finalSetTiebreakAt: z.number().min(1).max(15)
})

// Match creation schema
export const createMatchSchema = z.object({
  playerOneId: z.string().min(1, "Player 1 is required"),
  playerTwoId: z.string().min(1, "Player 2 is required"),
  playerThreeId: z.string().optional(),
  playerFourId: z.string().optional(),
  matchFormat: matchFormatSchema,
  detailLevel: z.enum(["points", "simple", "complex"]).default("simple")
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

// Point detail schema
export const pointDetailSchema = z.object({
  pointNumber: z.number().min(1),
  setNumber: z.number().min(1),
  gameNumber: z.number().min(1),
  winner: z.enum(["p1", "p2"]),
  server: z.enum(["p1", "p2"]),
  outcome: pointOutcomeSchema,
  serveType: serveTypeSchema,
  rallyLength: z.number().min(0).default(0),
  timestamp: z.string().datetime()
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
export type Score = z.infer<typeof scoreSchema> 