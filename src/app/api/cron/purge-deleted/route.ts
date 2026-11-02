import { NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

const RESTORE_DAYS = 7

/**
 * Daily Vercel cron: permanently deletes matches soft-deleted more than 7 days ago (after that they
 * can no longer be restored). Vercel sends `Authorization: Bearer $CRON_SECRET`; until that secret
 * is set in the project, every call is refused and nothing is deleted.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { databases } = await createAdminClient()
  const cutoff = Date.now() - RESTORE_DAYS * 86_400_000
  let deleted = 0
  // Deleting shrinks the list, so read the first page again until nothing old is left (bounded)
  for (let round = 0; round < 20; round++) {
    const page = await databases.listDocuments(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, [
      Query.equal('isDeleted', true),
      Query.select(['$id', 'isDeleted', 'deletedAt']),
      Query.limit(100),
    ])
    const expired = page.documents.filter((match) => match.isDeleted && match.deletedAt && Date.parse(match.deletedAt) < cutoff)
    for (const match of expired) {
      await databases.deleteDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, match.$id)
      deleted++
    }
    if (expired.length === 0 || page.documents.length < 100) break
  }
  console.log(`Purged ${deleted} matches deleted more than ${RESTORE_DAYS} days ago`)
  return NextResponse.json({ deleted })
}
