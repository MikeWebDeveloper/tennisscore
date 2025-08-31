import { NextResponse } from 'next/server'
import { getAllMatchesWithPlayers } from '@/lib/actions/matches'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? '20')
    const offset = Number(searchParams.get('offset') ?? '0')
    const search = searchParams.get('search') ?? ''

    const result = await getAllMatchesWithPlayers({ limit, offset, search })
    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/admin/matches failed:', error)
    return NextResponse.json({ matches: [], total: 0, hasMore: false }, { status: 500 })
  }
}

