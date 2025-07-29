import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUserPaginated } from "@/lib/actions/players"
import { PaginatedPlayersClient } from "./paginated-players-client"

export default async function PlayersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  const result = await getPlayersByUserPaginated({ 
    limit: 20, 
    offset: 0, 
    sortBy: 'mainFirst'
  }).catch(() => ({ players: [], total: 0, hasMore: false }))

  return (
    <PaginatedPlayersClient 
      initialPlayers={result.players}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
    />
  )
} 