"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ArrowRight, Play, Plus, User } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createMatch } from "@/lib/actions/matches"
import { createPlayer } from "@/lib/actions/players"
import { Player, MatchFormat } from "@/lib/types"
import { toast } from "sonner"

interface CreateMatchFormProps {
  players: Player[]
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

export function CreateMatchForm({ players: initialPlayers }: CreateMatchFormProps) {
  const router = useRouter()
  // Remove the useToast hook call since we're using sonner directly
  const [currentStep, setCurrentStep] = useState(0)
  const [players, setPlayers] = useState(initialPlayers)
  const [isCreatingMatch, setIsCreatingMatch] = useState(false)
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false)
  
  // Form state
  const [selectedPlayerOne, setSelectedPlayerOne] = useState<string>("")
  const [selectedPlayerTwo, setSelectedPlayerTwo] = useState<string>("")
  const [matchFormat, setMatchFormat] = useState<MatchFormat>({
    sets: 3,
    noAd: false
  })

  const steps = [
    {
      title: "Select Players",
      description: "Choose the two players for this match"
    },
    {
      title: "Match Format",
      description: "Configure the match format and rules"
    },
    {
      title: "Review & Start",
      description: "Review your selections and start the match"
    }
  ]

  const handleCreatePlayer = async (formData: FormData) => {
    try {
      const result = await createPlayer(formData)
      if (result.error) {
        toast.error("Error", {
          description: result.error
        })
        return
      }

      if (result.player) {
        setPlayers(prev => [...prev, result.player as Player])
        setIsCreatePlayerOpen(false)
        toast.success("Player created successfully!")
      }
    } catch (error) {
      toast.error("Failed to create player")
    }
  }

  const handleCreateMatch = async () => {
    if (!selectedPlayerOne || !selectedPlayerTwo) {
      toast.error("Please select both players")
      return
    }

    setIsCreatingMatch(true)
    
    try {
      const result = await createMatch({
        playerOneId: selectedPlayerOne,
        playerTwoId: selectedPlayerTwo,
        matchFormat
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.matchId) {
        toast.success("Match created successfully!")
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch (error) {
      toast.error("Failed to create match")
    } finally {
      setIsCreatingMatch(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedPlayerOne && selectedPlayerTwo && selectedPlayerOne !== selectedPlayerTwo
      case 1:
        return true
      case 2:
        return true
      default:
        return false
    }
  }

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.$id === playerId)
    return player ? `${player.firstName} ${player.lastName}` : ""
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-2 ${
                index < currentStep ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <motion.div
        key={currentStep}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <p className="text-muted-foreground">{steps[currentStep].description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Step 0: Player Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Player 1</Label>
                    <Select value={selectedPlayerOne} onValueChange={setSelectedPlayerOne}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 1" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem 
                            key={player.$id} 
                            value={player.$id}
                            disabled={player.$id === selectedPlayerTwo}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {player.firstName} {player.lastName}
                              {player.rating && (
                                <span className="text-muted-foreground">({player.rating})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Player 2</Label>
                    <Select value={selectedPlayerTwo} onValueChange={setSelectedPlayerTwo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player 2" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem 
                            key={player.$id} 
                            value={player.$id}
                            disabled={player.$id === selectedPlayerOne}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {player.firstName} {player.lastName}
                              {player.rating && (
                                <span className="text-muted-foreground">({player.rating})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Player</DialogTitle>
                      </DialogHeader>
                      <form action={handleCreatePlayer} className="space-y-4">
                        <div>
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input id="firstName" name="firstName" required />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input id="lastName" name="lastName" required />
                        </div>
                        <div>
                          <Label htmlFor="yearOfBirth">Year of Birth</Label>
                          <Input id="yearOfBirth" name="yearOfBirth" type="number" min="1900" max="2025" />
                        </div>
                        <div>
                          <Label htmlFor="rating">Rating</Label>
                          <Input id="rating" name="rating" placeholder="e.g. 4.0, UTR 8.5, etc." />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreatePlayerOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create Player</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            {/* Step 1: Match Format */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Best of Sets</Label>
                    <Select 
                      value={matchFormat.sets.toString()} 
                      onValueChange={(value) => setMatchFormat(prev => ({ ...prev, sets: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Best of 1 Set</SelectItem>
                        <SelectItem value="3">Best of 3 Sets</SelectItem>
                        <SelectItem value="5">Best of 5 Sets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>No-Ad Scoring</Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, games are decided by sudden death deuce
                      </p>
                    </div>
                    <Switch 
                      checked={matchFormat.noAd} 
                      onCheckedChange={(checked: boolean) => setMatchFormat(prev => ({ ...prev, noAd: checked }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">PLAYERS</Label>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{getPlayerName(selectedPlayerOne)}</p>
                        <p className="text-sm text-muted-foreground">Player 1</p>
                      </div>
                      <div className="text-center text-muted-foreground text-sm">vs</div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{getPlayerName(selectedPlayerTwo)}</p>
                        <p className="text-sm text-muted-foreground">Player 2</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">MATCH FORMAT</Label>
                    <div className="p-3 bg-muted rounded-lg space-y-2">
                      <p className="font-medium">Best of {matchFormat.sets} Sets</p>
                      <p className="text-sm text-muted-foreground">
                        {matchFormat.noAd ? "No-Ad scoring" : "Traditional Ad scoring"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateMatch}
            disabled={!canProceed() || isCreatingMatch}
          >
            {isCreatingMatch ? (
              "Creating Match..."
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Match
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
} 