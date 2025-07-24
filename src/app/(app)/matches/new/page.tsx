import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersForMatchCreation } from "@/lib/actions/players-match-creation"
import { CompactMatchWizard } from "./_components/compact-match-wizard"

export default async function NewMatchPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Load only essential players initially
  const { mainPlayer, recentPlayers, totalCount } = await getPlayersForMatchCreation()
  
  // Combine main player with recent players
  const initialPlayers = mainPlayer 
    ? [mainPlayer, ...recentPlayers]
    : recentPlayers

  return (
    <div className="w-full h-full grid place-items-center p-4">
      <CompactMatchWizard 
        players={initialPlayers as any[]} 
        totalPlayerCount={totalCount}
      />
    </div>
  )
} 