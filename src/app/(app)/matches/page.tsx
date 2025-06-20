import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getMatchesByUser } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"
import { ConnectionError } from "@/components/connection-error"
import { Match, Player } from "@/lib/types"

import { MatchesList } from "./_components/matches-list"

export default async function MatchesPage() {
  let matches: Match[] = []
  let players: Player[] = []
  let hasError = false

  try {
    // Try to fetch data with error handling
    const [matchesResult, playersResult] = await Promise.allSettled([
      getMatchesByUser(),
      getPlayersByUser()
    ])

    if (matchesResult.status === 'fulfilled') {
      matches = matchesResult.value
    } else {
      console.error("Failed to fetch matches:", matchesResult.reason)
      hasError = true
    }

    if (playersResult.status === 'fulfilled') {
      players = playersResult.value
    } else {
      console.error("Failed to fetch players:", playersResult.reason)
      hasError = true
    }
  } catch (error) {
    console.error("Error in MatchesPage:", error)
    hasError = true
  }

  const playersMap = new Map(players.map(player => [player.$id, player]))

  const enhancedMatches = matches.map(match => {
    // Handle anonymous players by checking ID prefix
    const playerOne = match.playerOneId.startsWith('anonymous-') 
      ? { firstName: "Player", lastName: "1", $id: match.playerOneId } as Player
      : playersMap.get(match.playerOneId)
    const playerTwo = match.playerTwoId.startsWith('anonymous-') 
      ? { firstName: "Player", lastName: "2", $id: match.playerTwoId } as Player
      : playersMap.get(match.playerTwoId)
    const winner = match.winnerId ? playersMap.get(match.winnerId) : null

    let scoreParsed: { sets: { p1: number; p2: number }[], games?: number[], points?: number[] } | undefined = undefined
    try {
      const parsed = JSON.parse(match.score)
      // Convert array format to object format if needed
      if (parsed) {
        scoreParsed = {
          sets: parsed.sets || [],
          games: parsed.games || [0, 0],
          points: parsed.points || [0, 0]
        }
      }
    } catch (e) {
      console.error("Failed to parse score JSON", e)
      // Provide default values
      scoreParsed = {
        sets: [],
        games: [0, 0],
        points: [0, 0]
      }
    }

    return {
      ...match,
      playerOneName: playerOne ? `${playerOne.firstName} ${playerOne.lastName}` : "Unknown Player",
      playerTwoName: playerTwo ? `${playerTwo.firstName} ${playerTwo.lastName}` : "Unknown Player",
      winnerName: winner ? `${winner.firstName} ${winner.lastName}` : "",
      scoreParsed: scoreParsed,
    }
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Matches</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
          <Link href="/matches/new">
            <Plus className="h-4 w-4 mr-2" />
            New Match
          </Link>
        </Button>
      </div>
      
      {hasError && matches.length === 0 ? (
        <ConnectionError 
          title="Unable to Load Matches"
          description="There's a connectivity issue preventing us from loading your matches. Please try refreshing the page."
        />
      ) : (
        <MatchesList matches={enhancedMatches} />
      )}
    </div>
  )
} 