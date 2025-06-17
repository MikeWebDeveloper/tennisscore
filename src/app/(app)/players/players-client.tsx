"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { User as UserType, Player } from "@/lib/types"
import { deletePlayer } from "@/lib/actions/players"
import { PlayerList } from "./_components/player-list"
import { CreatePlayerDialog, CreatePlayerTrigger } from "./_components/create-player-dialog"
import { EditPlayerDialog } from "./_components/edit-player-dialog"

interface PlayersClientProps {
  user: UserType
  players: Player[]
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export function PlayersClient({ players }: PlayersClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm("Are you sure you want to delete this player?")) {
      const result = await deletePlayer(playerId)
      if (result.success) {
        window.location.reload()
      }
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Players</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage your tennis players and opponents
            </p>
          </div>
          
          <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No players yet</p>
            <CreatePlayerTrigger onOpenDialog={() => setIsCreateDialogOpen(true)} />
          </div>
        ) : (
          <PlayerList 
            players={players}
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