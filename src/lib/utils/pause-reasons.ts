export const PAUSE_REASONS = ['rain', 'injury', 'darkness', 'other'] as const
export type PauseReason = typeof PAUSE_REASONS[number]

export function isPauseReason(value: unknown): value is PauseReason {
  return typeof value === 'string' && (PAUSE_REASONS as readonly string[]).includes(value)
}
