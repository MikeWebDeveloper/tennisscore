import type { MatchFormat } from '@/stores/matchStore'

export type SetFormat = 'standard' | 'fast4' | 'pro'

/** Set length presets: games needed to win a set and the games score where a tiebreak is played. */
export const SET_FORMATS: Record<SetFormat, { gamesPerSet: number; tiebreakAt: number }> = {
  standard: { gamesPerSet: 6, tiebreakAt: 6 },
  /** Fast4: first to 4 games, tiebreak at 3-3 (normally played with no-ad scoring). */
  fast4: { gamesPerSet: 4, tiebreakAt: 3 },
  /** Pro set: first to 8 games (two clear), tiebreak at 8-8. */
  pro: { gamesPerSet: 8, tiebreakAt: 8 },
}

/** Which preset a format corresponds to (unknown combinations count as standard). */
export function getSetFormat(format: Pick<MatchFormat, 'gamesPerSet' | 'tiebreakAt'>): SetFormat {
  const games = format.gamesPerSet ?? 6
  const tiebreakAt = format.tiebreakAt ?? games
  const match = (Object.keys(SET_FORMATS) as SetFormat[]).find(
    (key) => SET_FORMATS[key].gamesPerSet === games && SET_FORMATS[key].tiebreakAt === tiebreakAt
  )
  return match ?? 'standard'
}

const validGames = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 12

/**
 * Parse a stored match format (JSON string or object) into the engine's format, keeping every
 * field the engine understands so no screen silently falls back to standard 6-game sets.
 */
export function normalizeMatchFormat(raw: unknown): MatchFormat {
  let parsed: Record<string, unknown> = {}
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (value && typeof value === 'object') parsed = value as Record<string, unknown>
  } catch {
    // fall through to defaults
  }

  const sets = parsed.sets === 1 || parsed.sets === 3 || parsed.sets === 5 ? parsed.sets : 3
  const format: MatchFormat = {
    sets,
    noAd: parsed.noAd === true,
    tiebreak: parsed.tiebreak !== false,
    finalSetTiebreak:
      parsed.finalSetTiebreak === 'super' || parsed.finalSetTiebreak === 'none' ? parsed.finalSetTiebreak : 'standard',
    finalSetTiebreakAt: typeof parsed.finalSetTiebreakAt === 'number' ? parsed.finalSetTiebreakAt : 10,
  }
  if (parsed.shortSets === true) format.shortSets = true
  if (validGames(parsed.gamesPerSet)) format.gamesPerSet = parsed.gamesPerSet
  if (validGames(parsed.tiebreakAt)) format.tiebreakAt = parsed.tiebreakAt
  const order = parsed.doublesServeOrder as { p1?: unknown; p2?: unknown } | undefined
  if (order && (order.p1 === 'p1' || order.p1 === 'p3') && (order.p2 === 'p2' || order.p2 === 'p4')) {
    format.doublesServeOrder = { p1: order.p1, p2: order.p2 }
  }
  if (typeof parsed.detailLevel === 'string') format.detailLevel = parsed.detailLevel as MatchFormat['detailLevel']
  return format
}
