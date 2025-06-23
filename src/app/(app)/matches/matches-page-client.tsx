"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ConnectionError } from "@/components/connection-error"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import { MatchesList } from "./_components/matches-list"

export interface EnhancedMatch extends Match {
  playerOneName: string
  playerTwoName: string  
  playerThreeName?: string
  playerFourName?: string
  winnerName: string
  scoreParsed?: { sets: { p1: number; p2: number }[], games?: number[], points?: number[] }
  playerOne?: Player
  playerTwo?: Player
  playerThree?: Player
  playerFour?: Player
}

export function MatchesPageClient({ matches, hasError }: { 
  matches: EnhancedMatch[], 
  hasError: boolean 
}) {
  const t = useTranslations()
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("yourMatches")}</h1>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
          <Link href="/matches/new">
            <Plus className="h-4 w-4 mr-2" />
            {t("newMatch")}
          </Link>
        </Button>
      </div>
      
      {hasError && matches.length === 0 ? (
        <ConnectionError 
          title={t("unableToLoadMatches")}
          description={t("matchesConnectivityIssue")}
        />
      ) : (
        <MatchesList matches={matches} />
      )}
    </div>
  )
} 