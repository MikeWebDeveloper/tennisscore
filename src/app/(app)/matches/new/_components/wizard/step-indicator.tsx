"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { gsap } from "gsap"
import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (progressBarRef.current) {
      gsap.to(progressBarRef.current, {
        width: `${(currentStep / totalSteps) * 100}%`,
        duration: 0.5,
        ease: "power2.out"
      })
    }
  }, [currentStep, totalSteps])

  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: "0%" }}
          />
        </div>
        
        {/* Step Dots */}
        <div className="absolute top-0 left-0 w-full flex justify-between">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            
            return (
              <motion.div
                key={stepNumber}
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center -mt-2
                  ${isCompleted 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isCurrent 
                    ? 'bg-background border-primary text-primary' 
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.2 : 1,
                  transition: { duration: 0.3, ease: "backOut" }
                }}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="text-xs font-medium">{stepNumber}</span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Step Labels */}
      {stepLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {stepLabels.map((label, index) => (
            <span 
              key={index}
              className={`text-center ${index + 1 === currentStep ? 'text-primary font-medium' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}