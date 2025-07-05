"use client"

import { Settings, Clock, Zap } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface CompactFormatStepProps {
  sets: number[]
  scoring: "ad" | "no-ad"
  finalSet: "full" | "super-tb"
  onSetsChange: (value: number[]) => void
  onScoringChange: (value: "ad" | "no-ad") => void
  onFinalSetChange: (value: "full" | "super-tb") => void
}

export function CompactFormatStep({
  sets,
  scoring,
  finalSet,
  onSetsChange,
  onScoringChange,
  onFinalSetChange
}: CompactFormatStepProps) {
  const t = useTranslations()


  const setOptions = [
    { value: [1], label: t("bestOf1"), quick: true },
    { value: [3], label: t("bestOf3"), default: true },
    { value: [5], label: t("bestOf5"), long: true }
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
            <Settings className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2">{t("matchFormat")}</h2>
        <p className="text-sm text-muted-foreground">{t("configureMatchSettings")}</p>
      </div>

      {/* Sets Selection */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-center">{t("numberOfSets")}</div>
        <div className="grid grid-cols-3 gap-2">
          {setOptions.map((option) => (
            <motion.button
              key={option.value[0]}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSetsChange(option.value)}
              className={`
                p-3 rounded-xl border-2 text-center transition-all duration-200
                ${sets[0] === option.value[0]
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.quick && "Quick"}
                {option.default && "Default"}
                {option.long && "Long"}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Scoring System */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-center">{t("scoringSystem")}</div>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onScoringChange("ad")}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              ${scoring === "ad"
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm font-medium">{t("advantage")}</div>
                <div className="text-xs text-muted-foreground">{t("traditionalScoring")}</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onScoringChange("no-ad")}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              ${scoring === "no-ad"
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm font-medium">{t("noAdvantage")}</div>
                <div className="text-xs text-muted-foreground">{t("fasterGameplay")}</div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Final Set */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-center">{t("finalSet")}</div>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFinalSetChange("full")}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              ${finalSet === "full"
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm font-medium">{t("fullSet")}</div>
                <div className="text-xs text-muted-foreground">{t("traditionalFinalSet")}</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFinalSetChange("super-tb")}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              ${finalSet === "super-tb"
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm font-medium">{t("superTiebreak")}</div>
                <div className="text-xs text-muted-foreground">{t("quickerFinish")}</div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}