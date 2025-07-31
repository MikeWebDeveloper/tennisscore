"use client"

import { useState, useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import { ArrowUp01 } from "lucide-react"
import { ArrowDown10 } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Filter } from "lucide-react"
import { ConnectionError } from "@/components/connection-error"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { MatchesList } from "./_components/matches-list"
import { getMatchesByUserPaginated } from "@/lib/actions/matches"
import { formatPlayerFromObject } from "@/lib/utils"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
type DateFilter = 'all' | 'thisMonth' | 'last3Months' | 'thisYear'

interface PaginatedMatchesClientProps {
  initialMatches: EnhancedMatch[]
  initialTotal: number
  initialHasMore: boolean
  players: Player[]
  hasError: boolean
}

// Helper function to get anonymous player display name
function getAnonymousPlayerName(playerId: string, t: (key: string) => string): { firstName: string; lastName: string } {
  if (playerId.includes('player-1') || playerId.includes('player1')) {
    return { firstName: t("player.player"), lastName: "1" }
  } else if (playerId.includes('player-2') || playerId.includes('player2')) {
    return { firstName: t("player.player"), lastName: "2" }
  } else if (playerId.includes('player-3') || playerId.includes('player3')) {
    return { firstName: t("player.player"), lastName: "3" }
  } else if (playerId.includes('player-4') || playerId.includes('player4')) {
    return { firstName: t("player.player"), lastName: "4" }
  } else {
    // Fallback for other anonymous formats
    return { firstName: t("player.anonymous"), lastName: t("player.player") }
  }
}

// Helper function to enhance matches with player names
function enhanceMatches(matches: Match[], players: Player[], t: (key: string) => string): EnhancedMatch[] {
  const playersMap = new Map(players.map(player => [player.$id, player]))

  return matches.map(match => {
    // Handle anonymous players by checking ID prefix
    const playerOne = match.playerOneId.startsWith('anonymous-') 
      ? { ...getAnonymousPlayerName(match.playerOneId, t), $id: match.playerOneId } as Player
      : playersMap.get(match.playerOneId)
    const playerTwo = match.playerTwoId.startsWith('anonymous-') 
      ? { ...getAnonymousPlayerName(match.playerTwoId, t), $id: match.playerTwoId } as Player
      : playersMap.get(match.playerTwoId)
    
    // Handle doubles players
    const playerThree = match.playerThreeId 
      ? (match.playerThreeId.startsWith('anonymous-') 
        ? { ...getAnonymousPlayerName(match.playerThreeId, t), $id: match.playerThreeId } as Player
        : playersMap.get(match.playerThreeId))
      : undefined
    const playerFour = match.playerFourId 
      ? (match.playerFourId.startsWith('anonymous-') 
        ? { ...getAnonymousPlayerName(match.playerFourId, t), $id: match.playerFourId } as Player
        : playersMap.get(match.playerFourId))
      : undefined

    // Handle winner - for doubles, determine winning team and format both names
    let winnerName = ""
    if (match.winnerId) {
      const isDoubles = match.playerThreeId && match.playerFourId
      
      if (isDoubles) {
        // For doubles, determine which team won based on winnerId
        // Team 1: playerOne & playerThree, Team 2: playerTwo & playerFour
        if (match.winnerId === match.playerOneId || match.winnerId === match.playerThreeId) {
          // Team 1 won
          const player1Name = playerOne ? formatPlayerFromObject(playerOne) : t("unknownPlayer")
          const player3Name = playerThree ? formatPlayerFromObject(playerThree) : t("unknownPlayer")
          winnerName = `${player1Name} / ${player3Name}`
        } else if (match.winnerId === match.playerTwoId || match.winnerId === match.playerFourId) {
          // Team 2 won
          const player2Name = playerTwo ? formatPlayerFromObject(playerTwo) : t("unknownPlayer")
          const player4Name = playerFour ? formatPlayerFromObject(playerFour) : t("unknownPlayer")
          winnerName = `${player2Name} / ${player4Name}`
        }
      } else {
        // For singles, use the existing logic
        let winner: Player | null = null
        if (match.winnerId.startsWith('anonymous-')) {
          winner = { ...getAnonymousPlayerName(match.winnerId, t), $id: match.winnerId } as Player
        } else {
          winner = playersMap.get(match.winnerId) || null
        }
        winnerName = winner ? formatPlayerFromObject(winner) : ""
      }
    }

    let scoreParsed: { sets: { p1: number; p2: number }[], games?: number[], points?: number[] } | undefined = undefined
    try {
      const parsed = JSON.parse(match.score)
      // The score should already be in the correct format: { sets: [], games: [0, 0], points: [0, 0] }
      if (parsed && typeof parsed === 'object') {
        scoreParsed = {
          sets: Array.isArray(parsed.sets) ? parsed.sets.map((set: number[]) => ({ p1: set[0] || 0, p2: set[1] || 0 })) : [],
          games: Array.isArray(parsed.games) ? parsed.games : [0, 0],
          points: Array.isArray(parsed.points) ? parsed.points : [0, 0]
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
      playerOneName: playerOne ? formatPlayerFromObject(playerOne) : t("unknownPlayer"),
      playerTwoName: playerTwo ? formatPlayerFromObject(playerTwo) : t("unknownPlayer"),
      playerThreeName: playerThree ? formatPlayerFromObject(playerThree) : undefined,
      playerFourName: playerFour ? formatPlayerFromObject(playerFour) : undefined,
      winnerName: winnerName,
      scoreParsed: scoreParsed,
      playerOne,
      playerTwo,
      playerThree,
      playerFour
    }
  })
}

export function PaginatedMatchesClient({ 
  initialMatches, 
  initialTotal, 
  initialHasMore, 
  players, 
  hasError 
}: PaginatedMatchesClientProps) {
  const t = useTranslations('common')
  const [matches, setMatches] = useState<EnhancedMatch[]>(initialMatches)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

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

  const handleDateFilterChange = async (newFilter: DateFilter) => {
    setDateFilter(newFilter)
    setIsLoading(true)
    
    try {
      const result = await getMatchesByUserPaginated({ 
        limit: 15, 
        offset: 0, 
        dateFilter: newFilter 
      })
      
      const enhancedMatches = enhanceMatches(result.matches, players, t)
      setMatches(enhancedMatches)
      setTotal(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Failed to filter matches:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMatches = async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const result = await getMatchesByUserPaginated({ 
        limit: 15, 
        offset: matches.length,
        dateFilter 
      })
      
      const enhancedNewMatches = enhanceMatches(result.matches, players, t)
      setMatches(prev => [...prev, ...enhancedNewMatches])
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Failed to load more matches:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateFilterLabel = (filter: DateFilter) => {
    switch (filter) {
      case 'thisMonth': return t('thisMonth')
      case 'last3Months': return t('last3Months')
      case 'thisYear': return t('thisYear')
      default: return t('allTime')
    }
  }
  
  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("yourMatches")}</h1>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("showingMatchesSummary", { shown: matches.length, total })}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={(value: DateFilter) => handleDateFilterChange(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{getDateFilterLabel('all')}</SelectItem>
              <SelectItem value="thisMonth">{getDateFilterLabel('thisMonth')}</SelectItem>
              <SelectItem value="last3Months">{getDateFilterLabel('last3Months')}</SelectItem>
              <SelectItem value="thisYear">{getDateFilterLabel('thisYear')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Button */}
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
          
          {/* New Match Button */}
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
        <>
          <MatchesList matches={sortedMatches} />
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={loadMoreMatches}
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    {t('loadMore')} ({total - matches.length} {t('remaining')})
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* No More Matches Message */}
          {!hasMore && matches.length > 0 && matches.length < total && (
            <div className="text-center mt-6 text-sm text-muted-foreground">
{t('allMatchesLoaded')}
            </div>
          )}
        </>
      )}
    </div>
  )
}