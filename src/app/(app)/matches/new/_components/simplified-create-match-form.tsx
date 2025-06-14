"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Users, User } from "lucide-react"
import Link from "next/link"
import { Player, MatchFormat } from "@/lib/types"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"

interface SimplifiedCreateMatchFormProps {
  players: Player[]
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export function SimplifiedCreateMatchForm({ players }: SimplifiedCreateMatchFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [playerOne, setPlayerOne] = useState("Player 1")
  const [playerTwo, setPlayerTwo] = useState("Player 2")
  const [playerThree, setPlayerThree] = useState("")
  const [playerFour, setPlayerFour] = useState("")
  const [sets, setSets] = useState([3]) // Best of 3 by default
  const [scoring, setScoring] = useState<"ad" | "no-ad">("ad")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb">("full")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "complex">("simple")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const matchFormat: MatchFormat = {
        sets: sets[0] as 1 | 3 | 5,
        noAd: scoring === "no-ad",
        tiebreak: true,
        finalSetTiebreak: finalSet === "super-tb",
        finalSetTiebreakAt: 10
      }

      // Use actual player IDs if selected, otherwise use default names
      const playerOneId = playerOne === "Player 1" ? "Player 1" : playerOne
      const playerTwoId = playerTwo === "Player 2" ? "Player 2" : playerTwo

      const result = await createMatch({
        playerOneId,
        playerTwoId,
        matchFormat
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.matchId) {
        toast.success("Match created successfully!")
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch {
      toast.error("Failed to create match")
    } finally {
      setLoading(false)
    }
  }

  const getSetsLabel = (value: number) => {
    switch (value) {
      case 1: return "Best of 1"
      case 3: return "Best of 3"
      case 5: return "Best of 5"
      default: return `Best of ${value}`
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto p-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/matches">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Match</h1>
          <p className="text-muted-foreground">Set up your tennis match</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Type */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Match Type</h3>
              <RadioGroup value={matchType} onValueChange={(value: "singles" | "doubles") => setMatchType(value)}>
                <div className="grid grid-cols-2 gap-3">
                  <Label htmlFor="singles" className="radio-option">
                    <RadioGroupItem value="singles" id="singles" />
                    <User className="h-4 w-4" />
                    <span className="font-medium">Singles</span>
                  </Label>
                  <Label htmlFor="doubles" className="radio-option">
                    <RadioGroupItem value="doubles" id="doubles" />
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Doubles</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Selection */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Players</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player-one">Player 1</Label>
                  <Select value={playerOne} onValueChange={setPlayerOne}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Player 1">Player 1 (Default)</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.$id} value={player.$id}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="player-two">Player 2</Label>
                  <Select value={playerTwo} onValueChange={setPlayerTwo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Player 2">Player 2 (Default)</SelectItem>
                      {players.map((player) => (
                        <SelectItem key={player.$id} value={player.$id}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {matchType === "doubles" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="player-three">Player 3</Label>
                      <Select value={playerThree} onValueChange={setPlayerThree}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select a player</SelectItem>
                          {players.map((player) => (
                            <SelectItem key={player.$id} value={player.$id}>
                              {player.firstName} {player.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="player-four">Player 4</Label>
                      <Select value={playerFour} onValueChange={setPlayerFour}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Select a player</SelectItem>
                          {players.map((player) => (
                            <SelectItem key={player.$id} value={player.$id}>
                              {player.firstName} {player.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Match Format */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Match Format</h3>
              
              {/* Sets */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Number of Sets: {getSetsLabel(sets[0])}</Label>
                  <Slider
                    value={sets}
                    onValueChange={setSets}
                    min={1}
                    max={5}
                    step={2}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Best of 1</span>
                    <span>Best of 3</span>
                    <span>Best of 5</span>
                  </div>
                </div>

                {/* Scoring */}
                <div className="space-y-3">
                  <Label>Scoring System</Label>
                  <RadioGroup value={scoring} onValueChange={(value: "ad" | "no-ad") => setScoring(value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Label htmlFor="ad" className="radio-option">
                        <RadioGroupItem value="ad" id="ad" />
                        <span className="font-medium">Advantage</span>
                      </Label>
                      <Label htmlFor="no-ad" className="radio-option">
                        <RadioGroupItem value="no-ad" id="no-ad" />
                        <span className="font-medium">No Advantage</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Final Set */}
                <div className="space-y-3">
                  <Label>Final Set</Label>
                  <RadioGroup value={finalSet} onValueChange={(value: "full" | "super-tb") => setFinalSet(value)}>
                    <div className="grid grid-cols-2 gap-3">
                      <Label htmlFor="full" className="radio-option">
                        <RadioGroupItem value="full" id="full" />
                        <span className="font-medium">Full Set</span>
                      </Label>
                      <Label htmlFor="super-tb" className="radio-option">
                        <RadioGroupItem value="super-tb" id="super-tb" />
                        <span className="font-medium">Super Tie-Break</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scoring Detail */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Scoring Detail Level</h3>
              <RadioGroup value={detailLevel} onValueChange={(value: "points" | "simple" | "complex") => setDetailLevel(value)}>
                <div className="space-y-3">
                  <Label htmlFor="points" className="radio-option">
                    <RadioGroupItem value="points" id="points" />
                    <div>
                      <div className="font-medium">Points Only</div>
                      <div className="text-sm text-muted-foreground">Track just the score</div>
                    </div>
                  </Label>
                  <Label htmlFor="simple" className="radio-option">
                    <RadioGroupItem value="simple" id="simple" />
                    <div>
                      <div className="font-medium">Simple Stats</div>
                      <div className="text-sm text-muted-foreground">Aces, double faults, winners, errors</div>
                    </div>
                  </Label>
                  <Label htmlFor="complex" className="radio-option">
                    <RadioGroupItem value="complex" id="complex" />
                    <div>
                      <div className="font-medium">Detailed Stats</div>
                      <div className="text-sm text-muted-foreground">Shot types, court positions, rally length</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants}>
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? "Creating Match..." : "Start Match"}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
} 