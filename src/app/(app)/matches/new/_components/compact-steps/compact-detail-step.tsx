"use client"

import { BarChart3, Zap, Target, Lock } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface CompactDetailStepProps {
  value: "points" | "simple" | "complex" | ""
  onChange: (value: "points" | "simple" | "complex") => void
  onStartMatch: (detailLevel: "points" | "simple" | "complex") => Promise<void>
  loading: boolean
}

export function CompactDetailStep({ value, onChange, onStartMatch, loading }: CompactDetailStepProps) {
  const t = useTranslations()

  const options = [
    {
      value: "points",
      icon: Zap,
      title: t("pointsOnly"),
      description: t("trackJustScore"),
      disabled: false
    },
    {
      value: "simple",
      icon: BarChart3,
      title: t("simpleStats"),
      description: t("acesDoubleFaultsWinnersErrors"),
      disabled: false
    },
    {
      value: "complex",
      icon: Target,
      title: t("detailedStats"),
      description: t("shotPlacementRallyLength"),
      disabled: false
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2"
    >
      <div className="text-left mb-3">
        <h2 className="text-base font-semibold">{t("scoringDetailLevel")}</h2>
        <p className="text-xs text-muted-foreground">{t("chooseTrackingLevel")}</p>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          const isDisabled = option.disabled
          
          return (
            <motion.div
              key={option.value}
              whileHover={!isDisabled ? { scale: 1.01 } : undefined}
              whileTap={!isDisabled ? { scale: 0.99 } : undefined}
              onClick={() => {
                if (!isDisabled && !loading) {
                  const selectedValue = option.value as "points" | "simple" | "complex"
                  onChange(selectedValue)
                  onStartMatch(selectedValue)
                }
              }}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all duration-200 relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                  : isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  p-1.5 rounded-md transition-colors
                  ${isDisabled 
                    ? 'bg-muted text-muted-foreground' 
                    : isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                  }
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{option.title}</div>
                    {isDisabled && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-xs text-muted-foreground border">
                        <Lock className="h-2.5 w-2.5" />
                        {t("comingSoon")}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>

                {isSelected && !isDisabled && (
                  loading ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-auto"
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-primary rounded-full ml-auto"
                    />
                  )
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-muted/30 rounded-lg p-2.5 border mt-3">
        <div className="flex items-start gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">
              {t('detailLevelCanBeChanged')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}