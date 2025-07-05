"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Users, User } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"
import { motion } from "framer-motion"

interface MatchTypeStepProps {
  value: "singles" | "doubles"
  onChange: (value: "singles" | "doubles") => void
}

export function MatchTypeStep({ value, onChange }: MatchTypeStepProps) {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("matchType")}</h2>
        <p className="text-muted-foreground">{t("chooseMatchFormat")}</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <RadioGroup 
          value={value} 
          onValueChange={onChange}
          className="space-y-4"
        >
          {/* Singles Option */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Label 
              htmlFor="singles" 
              className={`
                flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all
                ${value === "singles" 
                  ? 'border-primary bg-primary/5 shadow-lg' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <RadioGroupItem value="singles" id="singles" className="mt-1" />
              <div className="flex items-center space-x-4 flex-1">
                <div className={`
                  p-3 rounded-full transition-colors
                  ${value === "singles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}>
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{t('singles')}</div>
                  <div className="text-sm text-muted-foreground">{t('oneVsOne')}</div>
                </div>
              </div>
            </Label>
          </motion.div>

          {/* Doubles Option */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Label 
              htmlFor="doubles" 
              className={`
                flex items-center space-x-4 p-6 rounded-xl border-2 cursor-pointer transition-all
                ${value === "doubles" 
                  ? 'border-primary bg-primary/5 shadow-lg' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <RadioGroupItem value="doubles" id="doubles" className="mt-1" />
              <div className="flex items-center space-x-4 flex-1">
                <div className={`
                  p-3 rounded-full transition-colors
                  ${value === "doubles" ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{t('doubles')}</div>
                  <div className="text-sm text-muted-foreground">{t('twoVsTwo')}</div>
                </div>
              </div>
            </Label>
          </motion.div>
        </RadioGroup>
      </motion.div>
    </motion.div>
  )
}