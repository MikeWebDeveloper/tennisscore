import type { Player } from "@/lib/types"

/** Always "12 BH": the profile field may hold "12" or an older "12BH", and older profiles kept it in the combined rating text. */
export function getBhRating(player: Pick<Player, "bhRating" | "rating">): string | undefined {
  const raw = player.bhRating || player.rating?.match(/\b\d+\s*BH\b/i)?.[0]
  const value = raw?.replace(/\s*BH\s*$/i, '').trim()
  return value ? `${value} BH` : undefined
}

/** Always "260 CŽ", matching how BH is written. */
export const getCzRanking = (player: Pick<Player, "czRanking">) => player.czRanking ? `${player.czRanking} CŽ` : undefined

/** "45 BH • 39 CŽ" for screens, reports and prompts; empty when the player has neither */
export function formatPlayerRating(player: Pick<Player, "bhRating" | "rating" | "czRanking">): string {
  return [getBhRating(player), getCzRanking(player)].filter(Boolean).join(' • ')
}
