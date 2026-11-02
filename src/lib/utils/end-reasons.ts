/**
 * Reasons a scorer can pick to end a match early; rain and darkness are interruptions, not endings.
 * "unfinished" is a match stopped without a result (time ran out, a training set).
 */
export const END_REASONS = ['retired', 'injury', 'walkover', 'unfinished'] as const
export type EndReason = typeof END_REASONS[number]

/** Every early ending names a winner except a match stopped unfinished */
export function endReasonHasWinner(reason: EndReason) {
  return reason !== 'unfinished'
}

const MESSAGE_KEYS: Record<string, 'playerRetired' | 'injury' | 'walkover' | 'matchUnfinished' | 'weatherConditions'> = {
  retired: 'playerRetired',
  injury: 'injury',
  walkover: 'walkover',
  unfinished: 'matchUnfinished',
  // Matches ended for weather before it became an interruption reason
  weather: 'weatherConditions',
}

/** Key in the "match" messages for a saved retirementReason, or null when there is none to show. */
export function endReasonMessageKey(reason: string | undefined | null) {
  return (reason && MESSAGE_KEYS[reason]) || null
}

/**
 * When an ended match finished: its last point, not the moment the scorer confirms the ending. A match
 * closed days later (Sofie Látalová vs Mondoková, 6 Sep → 30 Oct) otherwise counts those days as play.
 */
export function matchEndTime(pointLog: ReadonlyArray<{ timestamp?: string }>, now = new Date()): string {
  const times = pointLog.map((point) => Date.parse(point.timestamp ?? '')).filter((time) => !Number.isNaN(time))
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : now.toISOString()
}
