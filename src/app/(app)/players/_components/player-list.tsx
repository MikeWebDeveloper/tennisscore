"use client"

import { motion } from "framer-motion"
import { Player } from "@/lib/types"
import { PlayerCard } from "./player-card"

interface PlayerListProps {
  players: Player[]
  onEditPlayer: (player: Player) => void
  onDeletePlayer: (playerId: string) => void
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export function PlayerList({ players, onEditPlayer, onDeletePlayer }: PlayerListProps) {
  // Separate main player and others
  const mainPlayer = players.find(p => p.isMainPlayer)
  const otherPlayers = players.filter(p => !p.isMainPlayer)
  const sortedOthers = [...otherPlayers].sort((a, b) => {
    const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '', 'cs')
    if (lastNameCompare !== 0) return lastNameCompare
    return (a.firstName || '').localeCompare(b.firstName || '', 'cs')
  })
  const sortedPlayers = mainPlayer ? [mainPlayer, ...sortedOthers] : sortedOthers

  return (
    <motion.div 
      className="flex flex-col gap-2 w-full"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {sortedPlayers.map((player) => (
        <motion.div key={player.$id} variants={cardVariants}>
          <PlayerCard 
            player={player}
            onEdit={() => onEditPlayer(player)}
            onDelete={() => onDeletePlayer(player.$id)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
} 