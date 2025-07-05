"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface NavigationControlsProps {
  currentStep: number
  totalSteps: number
  canGoNext: boolean
  canGoBack: boolean
  isLoading?: boolean
  onNext: () => void
  onBack: () => void
  onSubmit?: () => void
  nextLabel?: string
  backLabel?: string
}

export function NavigationControls({
  currentStep,
  totalSteps,
  canGoNext,
  canGoBack,
  isLoading = false,
  onNext,
  onBack,
  onSubmit,
  nextLabel,
  backLabel
}: NavigationControlsProps) {
  const t = useTranslations()
  
  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit()
    } else {
      onNext()
    }
  }

  return (
    <div className="flex justify-between items-center pt-6 pb-24 md:pb-6">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack || isFirstStep || isLoading}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel || t("back")}
      </Button>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {currentStep} / {totalSteps}
        </span>
        
        <Button
          onClick={handleNext}
          disabled={!canGoNext || isLoading}
          className="flex items-center gap-2 min-w-[120px]"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isLastStep ? (
                t("startMatch")
              ) : (
                <>
                  {nextLabel || t("next")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}