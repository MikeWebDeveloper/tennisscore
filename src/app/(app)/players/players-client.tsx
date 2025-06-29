"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { User as UserType, Player } from "@/lib/types"
import { deletePlayer } from "@/lib/actions/players"
import { formatPlayerFromObject } from "@/lib/utils"
import { PlayerList } from "./_components/player-list"
import { CreatePlayerDialog, CreatePlayerTrigger } from "./_components/create-player-dialog"
import { EditPlayerDialog } from "./_components/edit-player-dialog"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ArrowUpAZ, ArrowDownZA } from "lucide-react"

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
  const t = useTranslations()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('none')

  const sortedPlayers = useMemo(() => {
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
  }, [players, sortOrder])

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

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{t("noPlayersYet")}</p>
            <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
          </div>
        ) : (
          <PlayerList 
            players={sortedPlayers}
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