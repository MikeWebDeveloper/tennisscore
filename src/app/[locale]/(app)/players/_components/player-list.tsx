"use client"

import { Player } from "@/lib/types"
import { PlayerCard } from "./player-card"

interface PlayerListProps {
  players: Player[]
  onEditPlayer: (player: Player) => void
  onDeletePlayer: (playerId: string) => void
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
    <div className="flex flex-col gap-2 w-full">
      {sortedPlayers.map((player) => (
        <div key={player.$id}>
          <PlayerCard 
            player={player}
            onEdit={() => onEditPlayer(player)}
            onDelete={() => onDeletePlayer(player.$id)}
          />
        </div>
      ))}
    </div>
  )
} 