"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Player } from "@/lib/types"
import { deletePlayer, getPlayersByUserPaginated } from "@/lib/actions/players"
import { formatPlayerFromObject } from "@/lib/utils"
import { PlayerList } from "./_components/player-list"
import { CreatePlayerDialog, CreatePlayerTrigger } from "./_components/create-player-dialog"
import { EditPlayerDialog } from "./_components/edit-player-dialog"
import { useTranslations } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, ArrowUpAZ, ArrowDownZA, Search, Loader2, Users, Eye } from "lucide-react"

interface PaginatedPlayersClientProps {
  initialPlayers: Player[]
  initialTotal: number
  initialHasMore: boolean
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

type SortOrder = 'none' | 'asc' | 'desc'
type ViewMode = 'paginated' | 'all'

export function PaginatedPlayersClient({ 
  initialPlayers, 
  initialTotal, 
  initialHasMore 
}: PaginatedPlayersClientProps) {
  const t = useTranslations('player')
  const commonT = useTranslations('common')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>('paginated')
  const [isLoading, setIsLoading] = useState(false)
  
  // Pagination state
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [total, setTotal] = useState(initialTotal)
  const [hasMore, setHasMore] = useState(initialHasMore)

  // Since we're now doing server-side filtering and sorting, we just need to handle local sorting for non-search cases
  const sortedAndFilteredPlayers = useMemo(() => {
    // If there's a search query, the server already handled filtering and sorting
    if (searchQuery) return players

    // Only apply client-side sorting when there's no search
    if (sortOrder === 'none') return players

    const sorted = [...players].sort((a, b) => {
      const nameA = formatPlayerFromObject(a).toLowerCase()
      const nameB = formatPlayerFromObject(b).toLowerCase()
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })

    return sorted
  }, [players, sortOrder, searchQuery])

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm(commonT("confirmDeletePlayer"))) {
      const result = await deletePlayer(playerId)
      if (result.success) {
        // Remove player from local state instead of reloading page
        setPlayers(prev => prev.filter(p => p.$id !== playerId))
        setTotal(prev => prev - 1)
      }
    }
  }

  const handleSortToggle = () => {
    setSortOrder(current => {
      if (current === 'none') return 'asc'
      if (current === 'asc') return 'desc'
      return 'none'
    })
  }

  const getSortIcon = () => {
    switch (sortOrder) {
      case 'asc':
        return <ArrowUpAZ className="h-4 w-4" />
      case 'desc':
        return <ArrowDownZA className="h-4 w-4" />
      default:
        return <ArrowUpDown className="h-4 w-4" />
    }
  }

  const loadMorePlayers = async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const result = await getPlayersByUserPaginated({ 
        limit: 20, 
        offset: players.length,
        sortBy: 'mainFirst',
        searchQuery: searchQuery || undefined
      })
      
      setPlayers(prev => [...prev, ...result.players])
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Failed to load more players:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllPlayers = async () => {
    setIsLoading(true)
    try {
      const result = await getPlayersByUserPaginated({ 
        limit: 1000, 
        offset: 0,
        sortBy: 'mainFirst',
        searchQuery: searchQuery || undefined
      })
      
      setPlayers(result.players)
      setHasMore(false)
      setViewMode('all')
    } catch (error) {
      console.error("Failed to load all players:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetToPaginated = async () => {
    setIsLoading(true)
    try {
      const result = await getPlayersByUserPaginated({ 
        limit: 20, 
        offset: 0,
        sortBy: 'mainFirst',
        searchQuery: searchQuery || undefined
      })
      
      setPlayers(result.players)
      setHasMore(result.hasMore)
      setViewMode('paginated')
    } catch (error) {
      console.error("Failed to reset pagination:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search functionality
  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const result = await getPlayersByUserPaginated({ 
        limit: 20, 
        offset: 0,
        sortBy: sortOrder === 'none' ? 'mainFirst' : (sortOrder === 'asc' ? 'name' : 'recent'),
        searchQuery: query || undefined
      })
      
      setPlayers(result.players)
      setTotal(result.total)
      setHasMore(result.hasMore)
      setViewMode('paginated')
    } catch (error) {
      console.error("Failed to search players:", error)
    } finally {
      setIsLoading(false)
    }
  }, [sortOrder])

  // Debounce search calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  return (
    <motion.div 
      className="min-h-screen bg-background p-4 md:p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">{t("players")}</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              {t("managementDescription")}
            </p>
            {total > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t("showingPlayersSummary", { shown: players.length, total: total })}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {players.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSortToggle}
                className="flex items-center gap-2"
              >
                {getSortIcon()}
                <span className="hidden sm:inline">{commonT("sort")}</span>
              </Button>
            )}
            <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
          </div>
        </div>

        {/* Search and Results */}
        {players.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
              <Input
                placeholder={commonT('searchPlayers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search players by name or rating"
                role="searchbox"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                {t("playersFound", { count: total })}
              </p>
            )}
          </div>
        )}

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{commonT("noPlayersYet")}</p>
            <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
          </div>
        ) : sortedAndFilteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("noPlayersFoundSearch")}</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              {commonT("clearSearch")}
            </Button>
          </div>
        ) : (
          <>
            <PlayerList 
              players={sortedAndFilteredPlayers}
              onEditPlayer={setEditingPlayer}
              onDeletePlayer={handleDeletePlayer}
            />

            {/* Pagination Controls */}
            {(
              <div className="flex flex-col items-center gap-4 mt-8">
                {viewMode === 'paginated' ? (
                  // Paginated Mode Controls
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {hasMore && (
                      <Button 
                        variant="outline" 
                        onClick={loadMorePlayers}
                        disabled={isLoading}
                        className="min-w-[140px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {commonT("loading")}
                          </>
                        ) : (
                          <>
                            {t("showMore", { count: total - players.length })}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {total > 30 && players.length < total && (
                      <Button 
                        variant="secondary" 
                        onClick={loadAllPlayers}
                        disabled={isLoading}
                        className="min-w-[120px]"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("viewAll", { count: total })}
                      </Button>
                    )}
                  </div>
                ) : (
                  // All Mode Controls
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {t("showingAllPlayers", { count: total })}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetToPaginated}
                      disabled={isLoading}
                    >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {commonT("loading")}
                          </>
                        ) : (
                          t("backToPaginated")
                        )}
                    </Button>
                  </div>
                )}
                
                {/* No More Players Message */}
                {!hasMore && viewMode === 'paginated' && players.length > 20 && (
                  <div className="text-center text-sm text-muted-foreground">
                    {t("allPlayersLoaded")}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <CreatePlayerDialog 
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />

        <EditPlayerDialog 
          player={editingPlayer}
          isOpen={!!editingPlayer}
          onOpenChange={(open) => !open && setEditingPlayer(null)}
        />
      </div>
    </motion.div>
  )
}