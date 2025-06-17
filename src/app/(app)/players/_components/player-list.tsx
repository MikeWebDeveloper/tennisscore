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
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export function PlayerList({ players, onEditPlayer, onDeletePlayer }: PlayerListProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {players.map((player) => (
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