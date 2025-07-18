"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "@/hooks/use-translations"

export function MainPlayerSetupPrompt() {
  const t = useTranslations()
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-slate-200">
            {t("welcomeToTennisScorePrompt")}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-800 dark:text-slate-300">
              {t("getStartedPersonalized")}
            </p>
            <p className="text-sm text-gray-700 dark:text-slate-400">
              {t("helpShowRelevantStats")}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="min-w-[140px]">
              <Link href="/players">
                <Users className="h-4 w-4 mr-2" />
                {t("managePlayers")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-gray-600 dark:text-slate-500 space-y-1">
            <p>{t("createPlayersHint")}</p>
            <p>{t("setMainPlayerHint")}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 