import { updateMatchScore } from "@/lib/actions/matches"

type ScorePayload = Parameters<typeof updateMatchScore>[1]

/**
 * Push a score update to the server with retry/backoff.
 *
 * `updateMatchScore` sends the FULL point log every time, so any later success
 * heals earlier failures. Combined with the persisted match store (which keeps
 * unsynced points across a reload), this makes point loss on a flaky mobile
 * connection extremely unlikely.
 *
 * Treats both a thrown error and a returned `{ error }` as a failure to retry.
 * Throws after the final attempt so callers can surface/queue it.
 */
export async function syncMatchScore(
  matchId: string,
  payload: ScorePayload,
  attempts = 3
): Promise<void> {
  let lastError: unknown = null

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await updateMatchScore(matchId, payload)
      const error = (result as { error?: string } | undefined)?.error
      if (!error) return
      lastError = error
    } catch (err) {
      lastError = err
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(typeof lastError === "string" ? lastError : "Failed to sync match score")
}
