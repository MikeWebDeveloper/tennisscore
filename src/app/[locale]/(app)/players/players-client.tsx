"use client"

import { useState, useMemo } from "react"
import { motion } from '@/lib/framer-motion-config'
import { User as UserType, Player } from "@/lib/types"
import { deletePlayer } from "@/lib/actions/players"
import { formatPlayerFromObject } from "@/lib/utils"
import { PlayerList } from "./_components/player-list"
import { CreatePlayerDialog, CreatePlayerTrigger } from "./_components/create-player-dialog"
import { EditPlayerDialog } from "./_components/edit-player-dialog"
import { useTranslations } from "@/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, ArrowUpAZ, ArrowDownZA, Search } from "lucide-react"

interface PlayersClientProps {
  user: UserType
  players: Player[]
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

type SortOrder = 'none' | 'asc' | 'desc'

export function PlayersClient({ players }: PlayersClientProps) {
  const t = useTranslations('player')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')
  const [searchQuery, setSearchQuery] = useState("")

  const sortedAndFilteredPlayers = useMemo(() => {
    // First filter by search query
    const filtered = players.filter(player => {
      if (!searchQuery) return true
      const searchLower = searchQuery.toLowerCase()
      const playerName = formatPlayerFromObject(player).toLowerCase()
      return playerName.includes(searchLower) ||
        player.firstName.toLowerCase().includes(searchLower) ||
        player.lastName.toLowerCase().includes(searchLower) ||
        player.bhRating?.toLowerCase().includes(searchLower) ||
        player.czRanking?.toString().includes(searchLower)
    })

    // Then sort
    if (sortOrder === 'none') return filtered

    const sorted = [...filtered].sort((a, b) => {
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
    if (confirm(t("confirmDeletePlayer"))) {
      const result = await deletePlayer(playerId)
      if (result.success) {
        window.location.reload()
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
              {t("managePlayersDescription")}
            </p>
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
                <span className="hidden sm:inline">{t("sort")}</span>
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
                placeholder={t('searchPlayers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Search players by name or rating"
                role="searchbox"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                {t("showingPlayersSummary").replace('{shown}', String(sortedAndFilteredPlayers.length)).replace('{total}', String(players.length))}
              </p>
            )}
          </div>
        )}

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("noPlayersYet")}</p>
            <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
          </div>
        ) : sortedAndFilteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No players found matching your search</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        ) : (
          <PlayerList 
            players={sortedAndFilteredPlayers}
            onEditPlayer={setEditingPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
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