"use server"

import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'
import { withServeIndicator, type ServeIndicator } from '@/lib/utils/db-score'

/**
 * Saves whether the server is on the first or second serve, so spectators see it. Only the
 * scorer's own match in progress, and only while `pointCount` is still the number of points
 * played: a point saved meanwhile starts the next point on a first serve, so the tap is stale.
 * No page revalidation: it would make the scorer's screen reload on every tap, and the
 * spectator pages poll the score anyway.
 */
export async function setCurrentServe(matchId: string, serve: ServeIndicator, pointCount: number): Promise<{ success?: true; skipped?: true; error?: string }> {
  try {
    if (serve !== 'first' && serve !== 'second') return { error: 'Invalid serve' }
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }
    const { databases } = await createAdminClient()
    const match = await databases.getDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId)
    if (match.userId !== user.$id || match.isDeleted || match.status !== 'In Progress') return { error: 'Match unavailable' }
    if ((match.pointLog?.length ?? 0) !== pointCount) return { skipped: true }
    const score = withServeIndicator(match.score, serve)
    if (score === match.score) return { skipped: true }
    await databases.updateDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId, { score })
    return { success: true }
  } catch {
    return { error: 'Unable to update the serve' }
  }
}
