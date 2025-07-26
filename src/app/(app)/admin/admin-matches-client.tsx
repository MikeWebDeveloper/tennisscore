"use client"

import { useState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { AdminMatchCard } from "@/components/shared/admin-match-card"
import { getAllMatchesWithPlayers } from "@/lib/actions/matches"
import { Match, Player } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"
import { useTranslations } from "@/hooks/use-translations"

interface AdminMatchesClientProps {
  initialMatches: (Match & {
    playerOneName: string
    playerTwoName: string
    playerThreeName?: string
    playerFourName?: string
    createdByEmail?: string
    playerOne?: Player
    playerTwo?: Player
    playerThree?: Player
    playerFour?: Player
  })[]
  initialTotal: number
  initialHasMore: boolean
}

export function AdminMatchesClient({ 
  initialMatches, 
  initialTotal, 
  initialHasMore 
}: AdminMatchesClientProps) {
  const t = useTranslations('admin')
  const [matches, setMatches] = useState(initialMatches)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Track if component is mounted to prevent state updates on unmounted component
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Fetch matches based on search and pagination
  const fetchMatches = useCallback(async (search: string = "", offset: number = 0, append: boolean = false) => {
    if (!mounted) return
    
    setIsLoading(true)
    try {
      const result = await getAllMatchesWithPlayers({
        limit: 20,
        offset,
        search: search.trim()
      })
      
      if (!mounted) return // Check again before setting state
      
      if (append) {
        setMatches(prev => [...prev, ...result.matches])
      } else {
        setMatches(result.matches)
      }
      setTotal(result.total)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      if (mounted) {
        setIsLoading(false)
      }
    }
  }, [mounted])

  // Effect for search - reset to first page when search term changes
  useEffect(() => {
    if (!mounted) return
    
    // Always reset to first page when search term changes
    fetchMatches(debouncedSearchTerm, 0, false)
  }, [debouncedSearchTerm, fetchMatches, mounted])

  // Load more matches - works for both search and regular browsing
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || !mounted) return
    fetchMatches(debouncedSearchTerm, matches.length, true)
  }, [debouncedSearchTerm, matches.length, hasMore, isLoading, fetchMatches, mounted])

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t("allMatchesTitle")}</h1>
        <p className="text-muted-foreground text-sm">
          {t("allMatchesDescription")}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results summary */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("searching")}</span>
          </div>
        ) : (
          <span>
            {debouncedSearchTerm
              ? t("showingMatchesFor", { shown: matches.length, total, searchTerm: debouncedSearchTerm })
              : t("showingMatches", { shown: matches.length, total })}
          </span>
        )}
      </div>

      {/* Matches list */}
      <div className="space-y-3">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {debouncedSearchTerm ? t("noMatchesFoundSearch") : t("noMatchesFound")}
            </div>
          </div>
        ) : (
          matches.map((match) => (
            <AdminMatchCard key={match.$id} match={match} />
          ))
        )}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button 
            onClick={loadMore} 
            variant="outline" 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("loading")}
              </>
            ) : (
              t("loadMore", { remaining: total - matches.length })
            )}
          </Button>
        </div>
      )}
    </div>
  )
}