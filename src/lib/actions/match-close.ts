"use server"

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'
import { matchEndTime } from '@/lib/utils/end-reasons'

/** Saves a match left in progress as unfinished: no winner, ended at its last point, score kept as it was. */
export async function closeUnfinishedMatch(matchId: string): Promise<{ success?: true; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }
    const { databases } = await createAdminClient()
    const match = await databases.getDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId)
    if (match.userId !== user.$id || match.isDeleted || match.status !== 'In Progress') return { error: 'Match unavailable' }
    const points = ((match.pointLog ?? []) as string[]).map((point) => {
      try { return JSON.parse(point) as { timestamp?: string } } catch { return {} }
    })
    await databases.updateDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId, {
      status: 'Completed', retirementReason: 'unfinished', endTime: matchEndTime(points),
    })
    revalidatePath('/dashboard')
    revalidatePath('/matches')
    revalidatePath(`/live/${matchId}`)
    return { success: true }
  } catch {
    return { error: 'Unable to close match' }
  }
}
