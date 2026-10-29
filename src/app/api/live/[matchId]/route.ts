import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/appwrite-server'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params
  if (!matchId || matchId.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(matchId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const { databases } = await createAdminClient()
    const match = await databases.getDocument(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, matchId)
    if (match.isDeleted) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({
      score: match.score,
      pointLog: match.pointLog,
      status: match.status,
      winnerId: match.winnerId,
      isPaused: match.isPaused,
      pauseReason: match.pauseReason,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const status = (error as { code?: number }).code === 404 ? 404 : 503
    return NextResponse.json({ error: status === 404 ? 'Not found' : 'Unavailable' }, { status, headers: { 'Cache-Control': 'no-store' } })
  }
}
