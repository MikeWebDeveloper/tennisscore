"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Player } from "@/lib/types"

interface ServeSelectionProps {
  playerOne: Player
  playerTwo: Player
  onServeSelected: (servingPlayer: "p1" | "p2") => void
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Who Serves First?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select the player who will serve the first game
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Player Selection */}
            <div className="grid grid-cols-1 gap-3">
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayerSelect("p1")}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedServer === "p1"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getPlayerName(playerOne)}</h3>
                    <p className="text-sm text-muted-foreground">Player 1</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedServer === "p1" && (
                      <Badge variant="default" className="gap-1">
                        🎾 Serving
                      </Badge>
                    )}
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      selectedServer === "p1" 
                        ? "border-primary bg-primary" 
                        : "border-muted-foreground"
                    }`} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlayerSelect("p2")}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  selectedServer === "p2"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getPlayerName(playerTwo)}</h3>
                    <p className="text-sm text-muted-foreground">Player 2</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedServer === "p2" && (
                      <Badge variant="default" className="gap-1">
                        🎾 Serving
                      </Badge>
                    )}
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      selectedServer === "p2" 
                        ? "border-primary bg-primary" 
                        : "border-muted-foreground"
                    }`} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Start Match Button */}
            <Button 
              onClick={handleStartMatch}
              disabled={!selectedServer}
              className="w-full"
              size="lg"
            >
              Start Match
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 