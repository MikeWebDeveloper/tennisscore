"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { BarChart3, Zap, Target, Lock } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface DetailStepProps {
  value: "points" | "simple" | "complex"
  onChange: (value: "points" | "simple" | "complex") => void
}

export function DetailStep({ value, onChange }: DetailStepProps) {
  const t = useTranslations()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  }

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
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("scoringDetailLevel")}</h2>
        <p className="text-muted-foreground">{t("chooseTrackingLevel")}</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="space-y-4">
            {options.map((option) => {
              const Icon = option.icon
              const isSelected = value === option.value
              const isDisabled = option.disabled
              
              return (
                <motion.div
                  key={option.value}
                  variants={itemVariants}
                  whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                  whileTap={!isDisabled ? { scale: 0.98 } : undefined}
                >
                  <Label 
                    htmlFor={option.value}
                    className={`
                      flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all relative
                      ${isDisabled 
                        ? 'opacity-50 cursor-not-allowed border-border bg-muted/30' 
                        : isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value} 
                      disabled={isDisabled}
                      className="mt-1"
                    />
                    
                    <div className="flex items-start space-x-4 flex-1">
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
                      
                      <div className="space-y-1">
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
                    </div>
                  </Label>
                </motion.div>
              )
            })}
          </div>
        </RadioGroup>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t('detailLevelCanBeChanged')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}