"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Player } from "@/lib/types"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { createMatchSchema, type CreateMatchData } from "@/lib/schemas/match"
import { ZodError } from "zod"
import { useTranslations } from "@/hooks/use-translations"
import { gsap } from "gsap"

// Compact step components
import { CompactMatchTypeStep } from "./compact-steps/compact-match-type-step"
import { CompactPlayersStep } from "./compact-steps/compact-players-step"
import { CompactTournamentStep } from "./compact-steps/compact-tournament-step"
import { CompactFormatStep } from "./compact-steps/compact-format-step"
import { CompactDetailStep } from "./compact-steps/compact-detail-step"

interface CompactMatchWizardProps {
  players: Player[]
}

export function CompactMatchWizard({ players }: CompactMatchWizardProps) {
  const router = useRouter()
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles")
  const [playerOne, setPlayerOne] = useState("")
  const [playerTwo, setPlayerTwo] = useState("")
  const [playerThree, setPlayerThree] = useState("")
  const [playerFour, setPlayerFour] = useState("")
  const [tournamentName, setTournamentName] = useState("")
  
  // Anonymous player tracking
  const [playerOneAnonymous, setPlayerOneAnonymous] = useState(false)
  const [playerTwoAnonymous, setPlayerTwoAnonymous] = useState(false)
  const [playerThreeAnonymous, setPlayerThreeAnonymous] = useState(false)
  const [playerFourAnonymous, setPlayerFourAnonymous] = useState(false)
  
  const [sets, setSets] = useState([3]) // Best of 3 by default
  const [scoring, setScoring] = useState<"ad" | "no-ad">("ad")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb">("full")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "complex">("simple")

  const totalSteps = 5 // Removed review step

  // Auto-advance logic with delay
  const autoAdvance = (delay = 800) => {
    setTimeout(() => {
      if (currentStep < totalSteps) {
        goToNext()
      } else {
        handleSubmit()
      }
    }, delay)
  }

  // Validation functions
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1: // Match type
        return true // Always can proceed, has default
      case 2: // Players
        if (matchType === "singles") {
          return (playerOneAnonymous || playerOne.length > 0) && (playerTwoAnonymous || playerTwo.length > 0)
        } else {
          return (
            (playerOneAnonymous || playerOne.length > 0) &&
            (playerTwoAnonymous || playerTwo.length > 0) &&
            (playerThreeAnonymous || playerThree.length > 0) &&
            (playerFourAnonymous || playerFour.length > 0)
          )
        }
      case 3: // Tournament (optional)
        return true
      case 4: // Format
        return true // Always can proceed, has defaults
      case 5: // Detail level
        return true // Always can proceed, has default
      default:
        return false
    }
  }

  // Navigation functions with animations
  const goToNext = () => {
    if (currentStep < totalSteps && canProceedFromStep(currentStep)) {
      // Slide animation
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          x: -20,
          opacity: 0.7,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            setCurrentStep(currentStep + 1)
            gsap.fromTo(containerRef.current, 
              { x: 20, opacity: 0.7 }, 
              { x: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
            )
          }
        })
      } else {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const goToBack = () => {
    if (currentStep > 1) {
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          x: 20,
          opacity: 0.7,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => {
            setCurrentStep(currentStep - 1)
            gsap.fromTo(containerRef.current, 
              { x: -20, opacity: 0.7 }, 
              { x: 0, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
            )
          }
        })
      } else {
        setCurrentStep(currentStep - 1)
      }
    }
  }

  const handlePlayerChange = (player: "one" | "two" | "three" | "four", value: string) => {
    switch (player) {
      case "one":
        setPlayerOne(value)
        break
      case "two":
        setPlayerTwo(value)
        break
      case "three":
        setPlayerThree(value)
        break
      case "four":
        setPlayerFour(value)
        break
    }
  }

  const handleAnonymousChange = (player: "one" | "two" | "three" | "four", checked: boolean) => {
    switch (player) {
      case "one":
        setPlayerOneAnonymous(checked)
        if (checked) setPlayerOne("")
        break
      case "two":
        setPlayerTwoAnonymous(checked)
        if (checked) setPlayerTwo("")
        break
      case "three":
        setPlayerThreeAnonymous(checked)
        if (checked) setPlayerThree("")
        break
      case "four":
        setPlayerFourAnonymous(checked)
        if (checked) setPlayerFour("")
        break
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Generate anonymous player IDs if needed
      const getPlayerIdOrAnonymous = (playerId: string, isAnonymous: boolean, defaultName: string) => {
        if (isAnonymous || !playerId) {
          return `anonymous-${defaultName.toLowerCase().replace(' ', '-')}`
        }
        return playerId.split(' ')[0] // Extract actual ID from combobox value
      }

      // Prepare data for validation
      const formData: CreateMatchData = {
        playerOneId: getPlayerIdOrAnonymous(playerOne, playerOneAnonymous, t('player1')),
        playerTwoId: getPlayerIdOrAnonymous(playerTwo, playerTwoAnonymous, t('player2')),
        playerThreeId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerThree, playerThreeAnonymous, t('player3')) : undefined,
        playerFourId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerFour, playerFourAnonymous, t('player4')) : undefined,
        tournamentName: tournamentName.trim() || undefined,
        matchFormat: {
          sets: sets[0] as 1 | 3 | 5,
          gamesPerSet: 6,
          tiebreakAt: 6,
          noAd: scoring === "no-ad",
          finalSetTiebreak: finalSet === "super-tb" ? "super" : "standard",
          detailLevel,
        },
      }

      // Validate with Zod
      const validatedData = createMatchSchema.parse(formData)

      const result = await createMatch({
        playerOneId: validatedData.playerOneId,
        playerTwoId: validatedData.playerTwoId,
        playerThreeId: validatedData.playerThreeId,
        playerFourId: validatedData.playerFourId,
        tournamentName: validatedData.tournamentName,
        matchFormat: validatedData.matchFormat,
      })

      if (result.error) {
        toast.error(result.error)
      } else if (result.matchId) {
        // Success animation
        if (containerRef.current) {
          gsap.to(containerRef.current, {
            scale: 1.05,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          })
        }
        
        toast.success(t('matchCreatedSuccessfully'))
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]
        toast.error(firstError.message)
      } else {
        toast.error(t('failedToCreateMatch'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompactMatchTypeStep
            value={matchType}
            onChange={(value) => {
              setMatchType(value)
              autoAdvance()
            }}
          />
        )
      case 2:
        return (
          <CompactPlayersStep
            matchType={matchType}
            players={players}
            playerOne={playerOne}
            playerTwo={playerTwo}
            playerThree={playerThree}
            playerFour={playerFour}
            playerOneAnonymous={playerOneAnonymous}
            playerTwoAnonymous={playerTwoAnonymous}
            playerThreeAnonymous={playerThreeAnonymous}
            playerFourAnonymous={playerFourAnonymous}
            onPlayerChange={handlePlayerChange}
            onAnonymousChange={handleAnonymousChange}
            onComplete={() => autoAdvance(1200)} // Longer delay for players
          />
        )
      case 3:
        return (
          <CompactTournamentStep
            value={tournamentName}
            onChange={setTournamentName}
            onSkip={() => autoAdvance(300)}
            onComplete={() => autoAdvance()}
          />
        )
      case 4:
        return (
          <CompactFormatStep
            sets={sets}
            scoring={scoring}
            finalSet={finalSet}
            onSetsChange={(value) => {
              setSets(value)
              autoAdvance(600)
            }}
            onScoringChange={(value) => {
              setScoring(value)
              autoAdvance(600)
            }}
            onFinalSetChange={(value) => {
              setFinalSet(value)
              autoAdvance(600)
            }}
          />
        )
      case 5:
        return (
          <CompactDetailStep
            value={detailLevel}
            onChange={(value) => {
              setDetailLevel(value)
              autoAdvance(1000) // Final step, auto-submit
            }}
            loading={loading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/matches">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{t("newMatch")}</h1>
            <p className="text-xs text-muted-foreground">{t("step")} {currentStep}/{totalSteps}</p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }, (_, index) => (
            <div
              key={index}
              className={`h-2 w-6 rounded-full transition-all duration-300 ${
                index + 1 === currentStep
                  ? 'bg-primary'
                  : index + 1 < currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div ref={containerRef} className="w-full max-w-md">
          {renderStepContent()}
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button
            variant="ghost"
            onClick={goToBack}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentStep === totalSteps ? t("creating") : t("autoAdvancing")}
          </div>

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{t("creating")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}