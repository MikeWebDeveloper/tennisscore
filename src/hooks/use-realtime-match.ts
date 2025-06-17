"use client"

import { useEffect, useState } from "react"
import { client } from "@/lib/appwrite-client"

interface RealtimeMatchData {
  score?: string
  pointLog?: string[]
  events?: string[]
  status?: "In Progress" | "Completed"
  winnerId?: string
}

export function useRealtimeMatch(matchId: string) {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealtimeMatchData | null>(null)

  useEffect(() => {
    if (!matchId) return

    const unsubscribe = client.subscribe(
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID}.collections.${process.env.NEXT_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID}.documents.${matchId}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedMatch = response.payload as Record<string, unknown>
          
          setLastUpdate({
            score: updatedMatch.score as string,
            pointLog: updatedMatch.pointLog as string[],
            events: updatedMatch.events as string[],
            status: updatedMatch.status as "In Progress" | "Completed",
            winnerId: updatedMatch.winnerId as string | undefined
          })
          setConnected(true)
        }
      }
    )

    return () => {
      unsubscribe()
      setConnected(false)
    }
  }, [matchId])

  return { connected, lastUpdate }
} 