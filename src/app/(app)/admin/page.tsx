import { getAllMatchesWithPlayers } from "@/lib/actions/matches"
import { AdminMatchesClient } from "./admin-matches-client"

export default async function AdminPage() {
  try {
    const { matches, total, hasMore } = await getAllMatchesWithPlayers({ limit: 20, offset: 0 })

    return (
      <AdminMatchesClient 
        initialMatches={matches}
        initialTotal={total}
        initialHasMore={hasMore}
      />
    )
  } catch (error) {
    console.error("Error loading admin page:", error)
    
    // Return empty state with error handling
    return (
      <AdminMatchesClient 
        initialMatches={[]}
        initialTotal={0}
        initialHasMore={false}
      />
    )
  }
}