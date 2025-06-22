"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Users, User, Plus } from "lucide-react"
import Link from "next/link"
import { Player } from "@/lib/types"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { createMatchSchema, type CreateMatchData } from "@/lib/schemas/match"
import { ZodError } from "zod"
import { CreatePlayerDialog } from "../../../players/_components/create-player-dialog"
import { MobileBottomNavSpacer } from "@/components/layout/mobile-bottom-nav"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

interface CreateMatchFormProps {
  players: Player[]
}

// Anonymous players for quick matches
const ANONYMOUS_PLAYERS = [
  { $id: "anonymous-1", firstName: "Player", lastName: "1", displayName: "Player 1 (No Tracking)" },
  { $id: "anonymous-2", firstName: "Player", lastName: "2", displayName: "Player 2 (No Tracking)" },
  { $id: "anonymous-3", firstName: "Player", lastName: "3", displayName: "Player 3 (No Tracking)" },
  { $id: "anonymous-4", firstName: "Player", lastName: "4", displayName: "Player 4 (No Tracking)" },
]

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

export function CreateMatchForm({ players }: CreateMatchFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state with default anonymous players
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [playerOne, setPlayerOne] = useState("anonymous-1") // Default to Player 1
  const [playerTwo, setPlayerTwo] = useState("anonymous-2") // Default to Player 2
  const [playerThree, setPlayerThree] = useState("")
  const [playerFour, setPlayerFour] = useState("")
  const [sets, setSets] = useState([3]) // Best of 3 by default
  const [scoring, setScoring] = useState<"ad" | "no-ad">("ad")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb">("full")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "complex">("simple")
  const [showCreatePlayerDialog, setShowCreatePlayerDialog] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for validation
      const formData: CreateMatchData = {
        playerOneId: playerOne,
        playerTwoId: playerTwo,
        playerThreeId: matchType === "doubles" ? playerThree : undefined,
        playerFourId: matchType === "doubles" ? playerFour : undefined,
        matchFormat: {
          sets: sets[0] as 1 | 3 | 5,
          noAd: scoring === "no-ad",
          tiebreak: true,
          finalSetTiebreak: finalSet === "super-tb",
          finalSetTiebreakAt: 10
        },
        detailLevel
      }

      // Validate with Zod
      const validatedData = createMatchSchema.parse(formData)

      const result = await createMatch({
        playerOneId: validatedData.playerOneId,
        playerTwoId: validatedData.playerTwoId,
        playerThreeId: validatedData.playerThreeId,
        playerFourId: validatedData.playerFourId,
        matchFormat: {
          ...validatedData.matchFormat,
          detailLevel: validatedData.detailLevel
        }
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.matchId) {
        toast.success("Match created successfully!")
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]
        toast.error(firstError.message)
      } else {
        toast.error("Failed to create match")
      }
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

  // Create options for the combobox
  const createPlayerOptions = (excludeIds: string[] = []): ComboboxOption[] => {
    const options: ComboboxOption[] = []

    // Add anonymous players
    ANONYMOUS_PLAYERS.forEach((player) => {
      if (!excludeIds.includes(player.$id)) {
        options.push({
          value: player.$id,
          label: player.displayName,
          group: "Quick Match",
          icon: <User className="h-4 w-4 text-muted-foreground" />,
        })
      }
    })

    // Add create new player option
    options.push({
      value: "create-new",
      label: "Create New Player",
      group: "Actions",
      icon: <Plus className="h-4 w-4 text-primary" />,
    })

    // Add real players if they exist
    if (players.length > 0) {
      players.forEach((player) => {
        if (!excludeIds.includes(player.$id)) {
          options.push({
            value: player.$id,
            label: `${player.firstName} ${player.lastName}`,
            group: "Tracked Players",
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
          })
        }
      })
    }

    return options
  }

  const handlePlayerChange = (value: string, setter: (value: string) => void) => {
    if (value === "create-new") {
      setShowCreatePlayerDialog(true)
    } else {
      setter(value)
    }
  }

  const renderPlayerSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    excludeIds: string[] = []
  ) => (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(" ", "-")}>{label}</Label>
      <Combobox
        options={createPlayerOptions(excludeIds)}
        value={value}
        onValueChange={(val) => handlePlayerChange(val, onChange)}
        placeholder="Search or select player..."
        emptyText="No players found. Try searching or create a new player."
      />
    </div>
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
        <Link href="/matches">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Match</h1>
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
                    <span className="font-medium">Singles</span>
                  </Label>
                  <Label htmlFor="doubles" className="radio-option">
                    <RadioGroupItem value="doubles" id="doubles" />
                    <span className="font-medium">Doubles</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Players */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-medium">Players</h3>
                <div className="text-sm text-muted-foreground">
                  Search by typing or scroll through options
                </div>
              </div>
              
              {matchType === "singles" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderPlayerSelect(
                    playerOne, 
                    setPlayerOne, 
                    "Player 1", 
                    [playerTwo, playerThree, playerFour].filter(Boolean)
                  )}
                  
                  {renderPlayerSelect(
                    playerTwo, 
                    setPlayerTwo, 
                    "Player 2", 
                    [playerOne, playerThree, playerFour].filter(Boolean)
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Team 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-sm font-medium text-muted-foreground px-2">Team 1</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border-2 border-primary/20">
                      {renderPlayerSelect(
                        playerOne, 
                        setPlayerOne, 
                        "Player 1", 
                        [playerTwo, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerThree, 
                        setPlayerThree, 
                        "Player 3", 
                        [playerOne, playerTwo, playerFour].filter(Boolean)
                      )}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-sm font-medium text-muted-foreground px-2">Team 2</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border-2 border-destructive/20">
                      {renderPlayerSelect(
                        playerTwo, 
                        setPlayerTwo, 
                        "Player 2", 
                        [playerOne, playerThree, playerFour].filter(Boolean)
                      )}
                      
                      {renderPlayerSelect(
                        playerFour, 
                        setPlayerFour, 
                        "Player 4", 
                        [playerOne, playerTwo, playerThree].filter(Boolean)
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                        <span className="font-medium">Super Tiebreak</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail Level */}
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
                  <Label htmlFor="complex" className="radio-option-disabled">
                    <RadioGroupItem value="complex" id="complex" disabled />
                    <div>
                      <div className="font-medium">Detailed Stats</div>
                      <div className="text-sm text-muted-foreground">Shot placement, rally length, etc.</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit Button */}
        <motion.div variants={itemVariants} className="pb-24 md:pb-6">
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium"
            disabled={loading || !playerOne || !playerTwo || (matchType === "doubles" && (!playerThree || !playerFour))}
          >
            {loading ? "Creating Match..." : "Start Match"}
          </Button>
        </motion.div>
      </form>

      {/* Create Player Dialog */}
      <CreatePlayerDialog 
        isOpen={showCreatePlayerDialog}
        onOpenChange={setShowCreatePlayerDialog}
      />
      <MobileBottomNavSpacer />
    </motion.div>
  )
} 