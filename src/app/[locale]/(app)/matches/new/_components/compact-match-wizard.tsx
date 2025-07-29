"use client"

import { useState, useRef } from "react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { gsap } from "gsap"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { createMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { createMatchSchema, type CreateMatchData } from "@/lib/schemas/match"
import { ZodError } from "zod"
import { useCallback } from "react"

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
  const t = useTranslations('common')
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
  
  const [sets, setSets] = useState<1 | 3 | 5 | null>(null)
  const [scoring, setScoring] = useState<"ad" | "no-ad" | "">("")
  const [finalSet, setFinalSet] = useState<"full" | "super-tb" | "">("")
  const [detailLevel, setDetailLevel] = useState<"points" | "simple" | "detailed" | "complex" | "">("")

  const totalSteps = 5

  // Navigation functions with animations
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

  const handlePlayersStepComplete = useCallback(() => {
    setCurrentStep(currentStep + 1)
  }, [currentStep])

  const handleCreateMatch = async (finalDetailLevel: "points" | "simple" | "detailed" | "complex") => {
    setLoading(true)

    if (!sets || !scoring || !finalSet) {
      toast.error(t("pleaseCompleteMatchFormat"))
      setLoading(false)
      return
    }

    try {
      const getPlayerIdOrAnonymous = (playerId: string, isAnonymous: boolean, defaultName: string) => {
        if (isAnonymous || !playerId) return `anonymous-${defaultName.toLowerCase().replace(' ', '-')}`
        return playerId.split(' ')[0]
      }

      const formData: CreateMatchData = {
        playerOneId: getPlayerIdOrAnonymous(playerOne, playerOneAnonymous, t('player1')),
        playerTwoId: getPlayerIdOrAnonymous(playerTwo, playerTwoAnonymous, t('player2')),
        playerThreeId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerThree, playerThreeAnonymous, t('player3')) : undefined,
        playerFourId: matchType === "doubles" ? getPlayerIdOrAnonymous(playerFour, playerFourAnonymous, t('player4')) : undefined,
        tournamentName: tournamentName.trim() || undefined,
        matchFormat: {
          sets: sets,
          gamesPerSet: 6,
          tiebreakAt: 6,
          noAd: scoring === "no-ad",
          finalSetTiebreak: finalSet === "super-tb" ? "super" : "standard",
          detailLevel: finalDetailLevel,
        },
      }

      const validatedData = createMatchSchema.parse(formData)
      const result = await createMatch(validatedData)

      if (result.error) {
        toast.error(result.error)
      } else if (result.matchId) {
        toast.success(t('matchCreatedSuccessfully'))
        router.push(`/matches/live/${result.matchId}`)
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.errors[0].message)
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
            onChange={setMatchType}
            onComplete={() => setCurrentStep(currentStep + 1)}
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
            onComplete={handlePlayersStepComplete}
          />
        )
      case 3:
        return (
          <CompactTournamentStep
            value={tournamentName}
            onChange={setTournamentName}
            onSkip={() => {
              setTournamentName("")
              setCurrentStep(currentStep + 1)
            }}
            onComplete={() => setCurrentStep(currentStep + 1)}
          />
        )
      case 4:
        return (
          <CompactFormatStep
            sets={sets}
            scoring={scoring}
            finalSet={finalSet}
            onSetsChange={setSets}
            onScoringChange={setScoring}
            onFinalSetChange={setFinalSet}
            onComplete={() => setCurrentStep(prev => prev + 1)}
          />
        )
      case 5:
        return (
          <CompactDetailStep
            value={detailLevel}
            onChange={setDetailLevel}
            onStartMatch={handleCreateMatch}
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
      <div className="flex-1 flex flex-col items-center p-4 min-h-0">
        {/* Mobile-first: Start content near top, desktop: centered */}
        <div className="w-full max-w-md mt-4 md:mt-0 md:flex-1 md:flex md:flex-col md:justify-center">
          <div ref={containerRef} className="w-full">
            {renderStepContent()}
            {currentStep > 1 && (
              <div className="flex justify-start mt-4">
                <Button
                  variant="ghost"
                  onClick={goToBack}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("back")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}