import { NextResponse } from 'next/server'
import { Query } from 'node-appwrite'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'
import { MATCH_LIST_FIELDS } from '@/lib/utils/match-list-fields'

export const dynamic = 'force-dynamic'

/**
 * Uptime check for the scheduled GitHub workflow. It runs the match-list query the pages
 * use (so a schema mismatch like the 27 October outage fails it) and returns no data.
 */
export async function GET() {
  const started = Date.now()
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const { databases } = await createAdminClient()
    await databases.listDocuments(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, [
      Query.select(MATCH_LIST_FIELDS),
      Query.limit(1),
    ])
    return NextResponse.json({ ok: true, ms: Date.now() - started }, { headers })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ ok: false, ms: Date.now() - started }, { status: 503, headers })
  }
}
