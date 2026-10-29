"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trophy } from "lucide-react"
import { Users } from "lucide-react"
import { Share2 } from "lucide-react"
import { Search } from "lucide-react"
import { Filter } from "lucide-react"
import { Player } from "@/lib/types"
import { DeleteMatchButton } from "../[id]/_components/delete-match-button"
import { PlayerMeta } from "@/components/shared/player-meta"
import { endReasonMessageKey } from "@/lib/utils/end-reasons"
import { toast } from "sonner"
import { useTranslations } from "@/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "@/lib/framer-motion-config"

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
    retirementReason?: string
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
  onMatchDeleted?: (matchId: string) => void
  onSearchChange?: (value: string) => void
  searchingHistory?: boolean
}

export function MatchesList({ matches, onMatchDeleted, onSearchChange, searchingHistory }: MatchesListProps) {
  const t = useTranslations('match')
  const commonT = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deletingMatches, setDeletingMatches] = useState<Set<string>>(new Set())
  
  const handleDeleteMatch = (matchId: string) => {
    console.log('🎬 Starting animation for match:', matchId)
    // Add to deleting set for animation
    setDeletingMatches(prev => {
      const newSet = new Set(prev).add(matchId)
      console.log('📊 Deleting matches set:', Array.from(newSet))
      return newSet
    })
    
    // Wait for animation to complete before updating parent state
    setTimeout(() => {
      console.log('⏰ Animation timeout complete for match:', matchId)
      onMatchDeleted?.(matchId)
      // Remove from deleting set after parent updates
      setDeletingMatches(prev => {
        const newSet = new Set(prev)
        newSet.delete(matchId)
        console.log('🧹 Cleaned up deleting matches set:', Array.from(newSet))
        return newSet
      })
    }, 300) // Match animation duration
  }
  
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

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
  }
  
  if (!matches || matches.length === 0) {
    return (
      <p className="text-muted-foreground">{t("noMatchesFound")}</p>
    )
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
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{commonT('all')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
              <SelectItem value="in-progress">{t('inProgress')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery || statusFilter !== "all" ? (
        <p className="text-sm text-muted-foreground">
          {t("showingMatchesSummary", { shown: filteredMatches.length, total: matches.length })}
        </p>
      ) : null}

      {/* Matches Grid */}
      {filteredMatches.length === 0 && searchingHistory ? null : filteredMatches.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {searchQuery || statusFilter !== "all" ? t("noMatchesFoundCriteria") : t("noMatchesFound")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.$id}
                layout
                initial={{ opacity: 1, scale: 1 }}
                animate={{ 
                  opacity: deletingMatches.has(match.$id) ? 0 : 1,
                  scale: deletingMatches.has(match.$id) ? 0.8 : 1,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.3,
                  ease: "easeInOut"
                }}
              >
                <Card className="surface-hover rise overflow-hidden p-0" style={{ "--i": index } as React.CSSProperties}>
                  <Link href={`/matches/${match.$id}`} className="block px-4 pb-3 pt-4">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {match.status === "Completed" ? (
                          <span className="rounded-full bg-foreground/10 px-2 py-0.5 font-medium text-foreground">
                            {t("completed")}{endReasonMessageKey(match.retirementReason) && ` — ${t(endReasonMessageKey(match.retirementReason)!)}`}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full bg-brand/15 px-2 py-0.5 font-medium text-brand">
                            <span className="live-dot h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                            {t("inProgress")}
                          </span>
                        )}
                        {match.playerThreeId && match.playerFourId && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" aria-hidden="true" />{t("doublesMatch")}</span>
                        )}
                      </span>
                      <span>{new Date(match.matchDate).toLocaleDateString()}</span>
                    </div>
                    {/* Two sides split by a hairline, each with year/rating/club under the name as on the live scoreboard */}
                    <div className="divide-y divide-foreground/[0.06]">
                    {([1, 2] as const).map(side => {
                      const doubles = !!(match.playerThreeId && match.playerFourId)
                      const name = side === 1
                        ? (doubles ? `${match.playerOneName} / ${match.playerThreeName}` : match.playerOneName)
                        : (doubles ? `${match.playerTwoName} / ${match.playerFourName}` : match.playerTwoName)
                      const sidePlayers = side === 1
                        ? [match.playerOne, doubles ? match.playerThree : undefined]
                        : [match.playerTwo, doubles ? match.playerFour : undefined]
                      const winnerId = side === 1 ? match.playerOneId : match.playerTwoId
                      const isWinner = match.status === "Completed" && match.winnerId === winnerId
                      const isLoser = match.status === "Completed" && !!match.winnerId && !isWinner
                      const sets = match.scoreParsed?.sets ?? []
                      const live = match.status !== "Completed" ? match.scoreParsed?.games : undefined
                      return (
                        <div key={side} data-side={side} className="flex items-center justify-between gap-3 py-2">
                          {/* The loser is dimmed so the winner still stands out */}
                          <div className={`min-w-0 ${isLoser ? "opacity-60" : ""}`}>
                            <span className={`flex min-w-0 items-center gap-1.5 text-sm ${isWinner ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {isWinner && <Trophy className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />}
                              <span className="truncate"><span className="name-gradient">{name}</span></span>
                            </span>
                            <PlayerMeta players={sidePlayers} className="mt-0.5" />
                          </div>
                          <span className="flex shrink-0 items-center gap-1.5 font-mono text-sm tabular-nums">
                            {sets.map((set, i) => {
                              const mine = side === 1 ? set.p1 : set.p2
                              const theirs = side === 1 ? set.p2 : set.p1
                              return <span key={i} className={`w-5 text-center ${mine > theirs ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{mine}</span>
                            })}
                            {live && live.length >= 2 && (
                              <span className="w-6 rounded-md bg-brand/15 py-0.5 text-center font-semibold text-brand">{live[side - 1]}</span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                    </div>
                  </Link>
                  <div className="flex items-center justify-end gap-1 border-t border-foreground/[0.06] px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShareMatch(match.$id, match.playerOneName, match.playerTwoName)}
                      className="h-8 w-8 text-muted-foreground"
                      title={t("shareMatchResults")}
                      aria-label={t("shareMatchResults")}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <DeleteMatchButton
                      matchId={match.$id}
                      playerNames={{
                        p1: match.playerOneName,
                        p2: match.playerTwoName,
                      }}
                      onDeleteSuccess={() => handleDeleteMatch(match.$id)}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
