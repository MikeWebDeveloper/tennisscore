"use client"

import { motion } from "framer-motion"
import { Play, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslations } from "@/i18n"
import { useRouter } from "next/navigation"

export function CreateNewMatchButton() {
  const t = useTranslations('dashboard')
  const router = useRouter()

  const handleClick = () => {
    router.push('/matches/new')
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card 
        className="group cursor-pointer transition-all duration-200 hover:shadow-md border bg-green-500/10 hover:bg-green-500/20 border-green-500/20"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Play className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-green-600 group-hover:opacity-80 transition-opacity">
                {t('startNewMatch')}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {t('beginScoringLiveMatch')}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-green-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}