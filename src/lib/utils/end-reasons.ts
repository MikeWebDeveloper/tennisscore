/** Reasons a scorer can pick to end a match early; rain and darkness are interruptions, not endings. */
export const END_REASONS = ['retired', 'injury'] as const
export type EndReason = typeof END_REASONS[number]

const MESSAGE_KEYS: Record<string, 'playerRetired' | 'injury' | 'weatherConditions'> = {
  retired: 'playerRetired',
  injury: 'injury',
  // Matches ended for weather before it became an interruption reason
  weather: 'weatherConditions',
}

/** Key in the "match" messages for a saved retirementReason, or null when there is none to show. */
export function endReasonMessageKey(reason: string | undefined | null) {
  return (reason && MESSAGE_KEYS[reason]) || null
}
