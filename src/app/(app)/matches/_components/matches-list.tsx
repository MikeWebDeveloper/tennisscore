"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trophy, Eye, Users, Share2, Search, Filter } from "lucide-react"
import { Player } from "@/lib/types"
import { DeleteMatchButton } from "../[id]/_components/delete-match-button"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-translations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MatchCardSkeleton } from "@/components/ui/loading-skeletons"

interface MatchesListProps {
  matches: Array<{
    $id: string
    playerOneId: string
    playerTwoId: string
    playerThreeId?: string
    playerFourId?: string
    playerOneName: string
    playerTwoName: string
    playerThreeName?: string
    playerFourName?: string
    matchDate: string
    status: string
    winnerId?: string
    winnerName?: string
    score: string // Original JSON string
    scoreParsed?: { 
      sets: { p1: number; p2: number }[]
      games?: number[]
      points?: number[]
    }
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
  }>
}

export function MatchesList({ matches }: MatchesListProps) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFiltering, setIsFiltering] = useState(false)
  
  // Filter matches based on search and status
  const filteredMatches = matches.filter(match => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || 
      match.playerOneName.toLowerCase().includes(searchLower) ||
      match.playerTwoName.toLowerCase().includes(searchLower) ||
      match.playerThreeName?.toLowerCase().includes(searchLower) ||
      match.playerFourName?.toLowerCase().includes(searchLower) ||
      match.winnerName?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === "all" || 
      match.status.toLowerCase().replace(" ", "-") === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle search with loading state
  const handleSearchChange = (value: string) => {
    setIsFiltering(true)
    setSearchQuery(value)
    // Simulate filtering delay for better UX
    setTimeout(() => setIsFiltering(false), 150)
  }

  // Handle filter with loading state  
  const handleFilterChange = (value: string) => {
    setIsFiltering(true)
    setStatusFilter(value)
    setTimeout(() => setIsFiltering(false), 150)
  }
  
  if (!matches || matches.length === 0) {
    return (
      <p className="text-muted-foreground">{t("noMatchesFound")}</p>
    )
  }

  const formatScore = (match: MatchesListProps['matches'][0]) => {
    const { scoreParsed, status } = match
    
    // Handle missing or invalid scoreParsed
    if (!scoreParsed) {
      return "0-0"
    }

    // For completed matches, show the final set scores
    if (status === 'Completed' && scoreParsed.sets && scoreParsed.sets.length > 0) {
      const setsDisplay = scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
      return setsDisplay
    }

    // For in-progress matches
    if (status === 'In Progress') {
      // If we have completed sets, show them plus current game score
      if (scoreParsed.sets && scoreParsed.sets.length > 0) {
        const completedSets = scoreParsed.sets.map((set: { p1: number; p2: number }) => `${set.p1}-${set.p2}`).join(", ")
        
        // Add current set/game status if available
        if (scoreParsed.games && Array.isArray(scoreParsed.games) && scoreParsed.games.length >= 2) {
          const currentGameScore = `${scoreParsed.games[0]}-${scoreParsed.games[1]}`
          return `${completedSets}, ${currentGameScore}`
        }
        
        return completedSets
      }
      
      // If no sets completed yet, show current game score
      if (scoreParsed.games && Array.isArray(scoreParsed.games) && scoreParsed.games.length >= 2) {
        return `${scoreParsed.games[0]}-${scoreParsed.games[1]}`
      }
    }

    // Fallback
    return "0-0"
  }

  const formatMatchTitle = (match: MatchesListProps['matches'][0]) => {
    const isDoubles = match.playerThreeId && match.playerFourId
    
    if (isDoubles) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("doublesMatch")}</span>
          </div>
          <div className="text-sm font-medium leading-tight">
            {match.playerOneName} / {match.playerThreeName}
          </div>
          <div className="text-xs text-muted-foreground">{t("vs")}</div>
          <div className="text-sm font-medium leading-tight">
            {match.playerTwoName} / {match.playerFourName}
          </div>
        </div>
      )
    }
    
    return `${match.playerOneName} ${t("vs")} ${match.playerTwoName}`
  }

  const getCardHeight = (match: MatchesListProps['matches'][0]) => {
    const isDoubles = match.playerThreeId && match.playerFourId
    return isDoubles ? "h-auto min-h-[200px]" : ""
  }

  const handleShareMatch = async (matchId: string, playerOneName: string, playerTwoName: string) => {
    const shareUrl = `${window.location.origin}/live/${matchId}`
    const title = `${playerOneName} ${t("vs")} ${playerTwoName} - ${t("tennisMatchResults")}`
    const text = `${t("checkMatchResults")} ${playerOneName} ${t("vs")} ${playerTwoName}!`
    
    // Try native share first (works best on mobile)
    if (typeof navigator !== 'undefined' && navigator.share && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        })
        toast.success(t("matchSharedSuccessfully"))
        return
      } catch (err) {
        // User canceled or share failed, fall through to clipboard
        console.log("Native share failed:", err)
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t("matchLinkCopied"))
    } catch {
      // If clipboard fails, show manual copy
      toast.error(`${t("copyLinkManually")}: ${shareUrl}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <Input
            placeholder={t('searchMatches')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search matches by player name"
            role="searchbox"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px]" aria-label="Filter matches by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
              <SelectItem value="in-progress">{t('inProgress')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery || statusFilter !== "all" ? (
        <p className="text-sm text-muted-foreground">
          {t("showingMatchesSummary").replace('{shown}', String(filteredMatches.length)).replace('{total}', String(matches.length))}
        </p>
      ) : null}

      {/* Matches Grid */}
      {isFiltering ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {searchQuery || statusFilter !== "all" ? t("noMatchesFoundCriteria") : t("noMatchesFound")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMatches.map((match) => (
        <Card key={match.$id} className={`hover:shadow-md transition-shadow ${getCardHeight(match)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight flex-1">
                {formatMatchTitle(match)}
              </CardTitle>
              <Badge 
                variant={match.status === "Completed" ? "default" : "secondary"}
                className="text-xs shrink-0"
              >
                {match.status === "Completed" ? t("completed") : t("inProgress")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {match.status === "Completed" ? `${t("final")}:` : `${t("score")}:`}
                </span>
                <span className={`font-mono text-sm ${match.status === "Completed" ? "font-bold" : ""}`}>
                  {formatScore(match)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t("date")}:</span>
                <span className="text-sm">{new Date(match.matchDate).toLocaleDateString()}</span>
              </div>
              
              {match.winnerName && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t("winner")}:</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <Trophy className="h-3 w-3" />
                    {match.winnerName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs">
                  <Link href={`/matches/${match.$id}`} prefetch={true}>
                    <Eye className="h-3 w-3 mr-1" />
                    {t('view')}
                  </Link>
                </Button>
                
                {/* Share button for all matches (both completed and in progress) */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleShareMatch(match.$id, match.playerOneName, match.playerTwoName)}
                  className="h-8 px-2"
                  title={t("shareMatchResults")}
                >
                  <Share2 className="h-3 w-3" />
                </Button>
                
                <DeleteMatchButton 
                  matchId={match.$id}
                  playerNames={{
                    p1: match.playerOneName,
                    p2: match.playerTwoName,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
          ))}
        </div>
      )}
    </div>
  )
} 