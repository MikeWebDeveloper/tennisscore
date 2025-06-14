import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getMatchesByUser } from "@/lib/actions/matches"
import { getPlayersByUser } from "@/lib/actions/players"

import { MatchesList } from "./_components/matches-list"

export default async function MatchesPage() {
  const matches = await getMatchesByUser()
  const players = await getPlayersByUser()

  const playersMap = new Map(players.map(player => [player.$id, player]))

  const enhancedMatches = matches.map(match => {
    const playerOne = playersMap.get(match.playerOneId)
    const playerTwo = playersMap.get(match.playerTwoId)
    const winner = match.winnerId ? playersMap.get(match.winnerId) : null

    let scoreParsed: { sets: { p1: number; p2: number }[] } | undefined = undefined
    try {
      scoreParsed = JSON.parse(match.score)
    } catch (e) {
      console.error("Failed to parse score JSON", e)
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
      <MatchesList matches={enhancedMatches} />
    </div>
  )
} 