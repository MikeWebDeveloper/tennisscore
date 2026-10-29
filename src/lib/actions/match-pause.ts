"use server"

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'
import { isPauseReason, type PauseReason } from '@/lib/utils/pause-reasons'

/** Changes only the pause indicator; scores and unsent point queues are untouched. */
export async function setMatchPaused(matchId: string, isPaused: boolean, reason: PauseReason = 'other'): Promise<{ success?: true; error?: string }> {
  try {
    if (isPaused && !isPauseReason(reason)) return { error: 'Invalid pause reason' }
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }
    const { databases } = await createAdminClient()
    const match = await databases.getDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId)
    if (match.userId !== user.$id || match.isDeleted || match.status !== 'In Progress') return { error: 'Match unavailable' }
    await databases.updateDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId, { isPaused, pauseReason: isPaused ? reason : '' })
    revalidatePath(`/live/${matchId}`)
    revalidatePath(`/watch/${matchId}`)
    return { success: true }
  } catch {
    return { error: 'Unable to update match pause' }
  }
}
