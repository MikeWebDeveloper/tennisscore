"use client"

import { BarChart3, Zap, Target, Lock } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface CompactDetailStepProps {
  value: "points" | "simple" | "complex"
  onChange: (value: "points" | "simple" | "complex") => void
  loading: boolean
}

export function CompactDetailStep({ value, onChange, loading }: CompactDetailStepProps) {
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
      disabled: true
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">{t("scoringDetailLevel")}</h2>
        <p className="text-sm text-muted-foreground">{t("chooseTrackingLevel")}</p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          const isDisabled = option.disabled
          
          return (
            <motion.div
              key={option.value}
              whileHover={!isDisabled ? { scale: 1.02 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              onClick={() => !isDisabled && onChange(option.value as "points" | "simple" | "complex")}
              className={`
                p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed border-border bg-muted/30' 
                  : isSelected 
                  ? 'border-primary bg-primary/5 shadow-lg' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <div className="flex items-start space-x-4">
                <div className={`
                  p-3 rounded-full transition-colors
                  ${isDisabled 
                    ? 'bg-muted text-muted-foreground' 
                    : isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-base">{option.title}</div>
                    {isDisabled && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {t("comingSoon")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </div>
                </div>

                {isSelected && !isDisabled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {t("creatingMatch")}
          </div>
        </motion.div>
      )}

      <div className="bg-muted/30 rounded-lg p-3 border">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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