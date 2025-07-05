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

// Wizard components
import { StepIndicator } from "./wizard/step-indicator"
import { AnimatedCard } from "./wizard/animated-card"
import { NavigationControls } from "./wizard/navigation-controls"

// Step components
import { MatchTypeStep } from "./steps/match-type-step"
import { PlayersStep } from "./steps/players-step"
import { TournamentStep } from "./steps/tournament-step"
import { FormatStep } from "./steps/format-step"
import { DetailStep } from "./steps/detail-step"
import { ReviewStep } from "./steps/review-step"

interface CreateMatchWizardProps {
  players: Player[]
}

export function CreateMatchWizard({ players }: CreateMatchWizardProps) {
  const router = useRouter()
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
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

  const totalSteps = 6
  const stepLabels = [
    t("type"),
    t("players"),
    t("tournament"),
    t("format"),
    t("details"),
    t("review")
  ]

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
      case 6: // Review
        return true
      default:
        return false
    }
  }

  // Navigation functions
  const goToStep = (step: number, dir: "forward" | "backward" = "forward") => {
    if (step < 1 || step > totalSteps) return
    
    setDirection(dir)
    setCurrentStep(step)

    // Add subtle shake animation for mobile feedback
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        x: dir === "forward" ? -5 : 5,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      })
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps && canProceedFromStep(currentStep)) {
      goToStep(currentStep + 1, "forward")
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1, "backward")
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

  const handleSkipTournament = () => {
    setTournamentName("")
    handleNext()
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
          <MatchTypeStep
            value={matchType}
            onChange={setMatchType}
          />
        )
      case 2:
        return (
          <PlayersStep
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
          />
        )
      case 3:
        return (
          <TournamentStep
            value={tournamentName}
            onChange={setTournamentName}
            onSkip={handleSkipTournament}
          />
        )
      case 4:
        return (
          <FormatStep
            sets={sets}
            scoring={scoring}
            finalSet={finalSet}
            onSetsChange={setSets}
            onScoringChange={setScoring}
            onFinalSetChange={setFinalSet}
          />
        )
      case 5:
        return (
          <DetailStep
            value={detailLevel}
            onChange={setDetailLevel}
          />
        )
      case 6:
        return (
          <ReviewStep
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
            tournamentName={tournamentName}
            sets={sets}
            scoring={scoring}
            finalSet={finalSet}
            detailLevel={detailLevel}
            onEditStep={(step) => goToStep(step, "backward")}
          />
        )
      default:
        return null
    }
  }

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/matches">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("newMatch")}</h1>
          <p className="text-muted-foreground">{t("setUpMatch")}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator 
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={stepLabels}
      />

      {/* Step Content */}
      <div className="min-h-[400px] mb-6">
        <AnimatedCard
          isVisible={true}
          direction={direction}
          className="min-h-[400px]"
        >
          {renderStepContent()}
        </AnimatedCard>
      </div>

      {/* Navigation */}
      <NavigationControls
        currentStep={currentStep}
        totalSteps={totalSteps}
        canGoNext={canProceedFromStep(currentStep)}
        canGoBack={currentStep > 1}
        isLoading={loading}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />

      {/* Mobile spacer */}
      <div className="h-16 md:hidden" />
    </div>
  )
}