"use client"

import { useState, useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import { ArrowUp01 } from "lucide-react"
import { ArrowDown10 } from "lucide-react"
import { ConnectionError } from "@/components/connection-error"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
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

type SortOrder = 'none' | 'asc' | 'desc'

export function MatchesPageClient({ matches, hasError }: { 
  matches: EnhancedMatch[], 
  hasError: boolean 
}) {
  const t = useTranslations('common')
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')

  const sortedMatches = useMemo(() => {
    if (sortOrder === 'none') return matches

    const sorted = [...matches].sort((a, b) => {
      const dateA = new Date(a.matchDate).getTime()
      const dateB = new Date(b.matchDate).getTime()
      
      if (sortOrder === 'asc') {
        return dateA - dateB // Oldest first
      } else {
        return dateB - dateA // Newest first
      }
    })

    return sorted
  }, [matches, sortOrder])

  const handleSortToggle = () => {
    setSortOrder(current => {
      if (current === 'none') return 'desc' // Start with newest first (most common use case)
      if (current === 'desc') return 'asc'
      return 'none'
    })
  }

  const getSortIcon = () => {
    switch (sortOrder) {
      case 'asc':
        return <ArrowUp01 className="h-4 w-4" />
      case 'desc':
        return <ArrowDown10 className="h-4 w-4" />
      default:
        return <ArrowUpDown className="h-4 w-4" />
    }
  }
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("yourMatches")}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {matches.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortToggle}
              className="flex items-center gap-2"
            >
              {getSortIcon()}
              <span className="hidden sm:inline">{t("sort")}</span>
            </Button>
          )}
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Link href="/matches/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("newMatch")}
            </Link>
          </Button>
        </div>
      </div>
      
      {hasError && matches.length === 0 ? (
        <ConnectionError 
          title={t("unableToLoadMatches")}
          description={t("matchesConnectivityIssue")}
        />
      ) : (
        <MatchesList matches={sortedMatches} />
      )}
    </div>
  )
} 