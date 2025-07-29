import { redirect } from "next/navigation"
import { getMatchById } from "@/lib/actions/matches"
import { LiveScoringInterface } from "./_components/live-scoring-interface"
import { HydrationErrorBoundary } from "@/components/shared/hydration-error-boundary"
import { Player } from "@/lib/types"

interface LiveScoringPageProps {
  params: Promise<{
    id: string
  }>
}

// Helper to create a fallback player object
const createFallbackPlayer = (id: string, name: string): Player => ({
  $id: id,
  firstName: name,
  lastName: "",
  userId: "anonymous",
  $collectionId: "",
  $databaseId: "",
  $createdAt: new Date().toISOString(),
  $updatedAt: new Date().toISOString(),
  $permissions: [],
  $sequence: 0,
} as Player)

export default async function LiveScoringPage({ params }: LiveScoringPageProps) {
  const { id } = await params
  const match = await getMatchById(id)

  if (!match) {
    // A simple check for a valid match object. Redirect if not found.
    return redirect("/matches")
  }

  // Ensure players are not null, providing fallbacks if necessary.
  const enhancedMatch = {
    ...match,
    playerOne: match.playerOne || createFallbackPlayer(match.playerOneId, "Player 1"),
    playerTwo: match.playerTwo || createFallbackPlayer(match.playerTwoId, "Player 2"),
    playerThree: match.playerThree || (match.playerThreeId ? createFallbackPlayer(match.playerThreeId, "Player 3") : undefined),
    playerFour: match.playerFour || (match.playerFourId ? createFallbackPlayer(match.playerFourId, "Player 4") : undefined),
    pointLog: match.pointLog || [], // This was the original fix.
  }

  return (
    <HydrationErrorBoundary>
      <LiveScoringInterface match={enhancedMatch} />
    </HydrationErrorBoundary>
  )
} 