"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Player } from "@/lib/types"

interface ServeSelectionProps {
  playerOne: Player
  playerTwo: Player
  onServeSelected: (servingPlayer: "p1" | "p2") => void
}

// Tennis Ball SVG Component
function TennisBall({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
      <path d="M2 12c0-2.5 2-4.5 4.5-4.5S11 9.5 11 12s-2 4.5-4.5 4.5S2 14.5 2 12z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M22 12c0 2.5-2 4.5-4.5 4.5S13 14.5 13 12s2-4.5 4.5-4.5S22 9.5 22 12z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  )
}

export function ServeSelection({ playerOne, playerTwo, onServeSelected }: ServeSelectionProps) {
  const [selectedServer, setSelectedServer] = useState<"p1" | "p2" | null>(null)

  const handlePlayerSelect = (player: "p1" | "p2") => {
    setSelectedServer(player)
  }

  const handleStartMatch = () => {
    if (selectedServer) {
      onServeSelected(selectedServer)
    }
  }

  const getPlayerName = (player: Player) => `${player.firstName} ${player.lastName}`

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Who Serves First?</h1>
          <p className="text-muted-foreground">
            Select the player who will serve the first game
          </p>
        </div>

        {/* Player Selection */}
        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePlayerSelect("p1")}
            className={`w-full p-6 rounded-xl border-2 transition-all ${
              selectedServer === "p1"
                ? "border-primary bg-primary/10 shadow-lg"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  {playerOne.firstName[0]}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{getPlayerName(playerOne)}</h3>
                  <p className="text-sm text-muted-foreground">{playerOne.rating || "Unrated"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedServer === "p1" && (
                  <TennisBall className="w-6 h-6 text-muted-foreground" />
                )}
                <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  selectedServer === "p1" 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground"
                }`} />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePlayerSelect("p2")}
            className={`w-full p-6 rounded-xl border-2 transition-all ${
              selectedServer === "p2"
                ? "border-primary bg-primary/10 shadow-lg"
                : "border-border hover:border-primary/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold">
                  {playerTwo.firstName[0]}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{getPlayerName(playerTwo)}</h3>
                  <p className="text-sm text-muted-foreground">{playerTwo.rating || "Unrated"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedServer === "p2" && (
                  <TennisBall className="w-6 h-6 text-muted-foreground" />
                )}
                <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  selectedServer === "p2" 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground"
                }`} />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Start Match Button */}
        <Button 
          onClick={handleStartMatch}
          disabled={!selectedServer}
          className="w-full py-4 text-lg font-semibold"
          size="lg"
        >
          Start Match
        </Button>

        {/* Tip */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Tip: In tennis, the server alternates every game
          </p>
        </div>
      </motion.div>
    </div>
  )
} 