import { SET_FORMATS, type SetFormat } from './match-format'

export type DetailLevel = 'points' | 'simple' | 'shot-type' | 'detailed' | 'complex' | 'custom'
type Slot = 'one' | 'two' | 'three' | 'four'

/** Everything the new-match wizard asks, filled in from an earlier match */
export interface MatchPreset {
  matchType: 'singles' | 'doubles'
  players: Record<Slot, string>
  anonymous: Record<Slot, boolean>
  tournamentName: string
  sets: 1 | 3 | 5
  setFormat: SetFormat
  scoring: 'ad' | 'no-ad'
  finalSet: 'full' | 'super-tb'
  serveOrder: { p1: 'p1' | 'p3'; p2: 'p2' | 'p4' }
  detailLevel: DetailLevel
  customCategories: string[]
}

interface MatchLike {
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string | null
  playerFourId?: string | null
  tournamentName?: string | null
  matchFormat: string
  detailLevel?: string | null
}

const DETAIL_LEVELS: DetailLevel[] = ['points', 'simple', 'shot-type', 'detailed', 'complex', 'custom']
const isAnonymous = (id?: string | null) => !id || id.startsWith('anonymous-')

/** The same players and rules as an earlier match: the start of a rematch or of "same as last time" */
export function presetFromMatch(match: MatchLike): MatchPreset {
  let format: Record<string, unknown> = {}
  try { format = JSON.parse(match.matchFormat) ?? {} } catch { /* old or broken formats start from the defaults */ }
  const setFormat = (Object.keys(SET_FORMATS) as SetFormat[]).find((key) =>
    SET_FORMATS[key].gamesPerSet === (format.gamesPerSet ?? 6) && SET_FORMATS[key].tiebreakAt === (format.tiebreakAt ?? format.gamesPerSet ?? 6)) ?? 'standard'
  const level = (match.detailLevel || format.detailLevel) as DetailLevel
  const ids: Record<Slot, string | null | undefined> = { one: match.playerOneId, two: match.playerTwoId, three: match.playerThreeId, four: match.playerFourId }
  const doubles = Boolean(match.playerThreeId && match.playerFourId)
  const order = format.doublesServeOrder as MatchPreset['serveOrder'] | undefined
  const custom = format.customModeConfig as { categories?: string[] } | undefined
  const slots: Slot[] = doubles ? ['one', 'two', 'three', 'four'] : ['one', 'two']
  return {
    matchType: doubles ? 'doubles' : 'singles',
    players: { one: '', two: '', three: '', four: '', ...Object.fromEntries(slots.map((slot) => [slot, isAnonymous(ids[slot]) ? '' : ids[slot]])) },
    anonymous: { one: false, two: false, three: false, four: false, ...Object.fromEntries(slots.map((slot) => [slot, isAnonymous(ids[slot])])) },
    tournamentName: match.tournamentName?.trim() ?? '',
    sets: format.sets === 1 || format.sets === 5 ? format.sets : 3,
    setFormat,
    scoring: format.noAd ? 'no-ad' : 'ad',
    finalSet: format.finalSetTiebreak === 'super' ? 'super-tb' : 'full',
    serveOrder: order?.p1 && order?.p2 ? order : { p1: 'p1', p2: 'p2' },
    detailLevel: DETAIL_LEVELS.includes(level) ? level : 'simple',
    customCategories: custom?.categories ?? [],
  }
}

/** Players of the latest matches (newest first), each once, for the top of the player picker */
export function recentPlayerIds(matches: Omit<MatchLike, 'matchFormat'>[], mainPlayerId: string | undefined, limit = 5): string[] {
  const seen: string[] = []
  for (const match of matches) {
    for (const id of [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId]) {
      if (id && id !== mainPlayerId && !isAnonymous(id) && !seen.includes(id)) seen.push(id)
      if (seen.length === limit) return seen
    }
  }
  return seen
}
