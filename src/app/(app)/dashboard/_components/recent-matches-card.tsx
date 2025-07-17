"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"

interface RecentMatchesCardProps {
  recentMatches: Match[]
  mainPlayer: Player | null
}

export const RecentMatchesCard = memo<RecentMatchesCardProps>(({ 
  recentMatches, 
  mainPlayer 
}) => {
  const t = useTranslations()

  if (recentMatches.length === 0) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
    >
      <Card className="hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">{t("recentMatches")}</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/matches">{t("viewAll")}</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentMatches.map((match, index) => (
              <motion.div
                key={match.$id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    match.winnerId === mainPlayer?.$id 
                      ? "bg-green-500" 
                      : "bg-red-500"
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {t("vs")} {match.playerTwoId === mainPlayer?.$id ? t("player1") : t("player2")}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-muted-foreground">
                      {new Date(match.matchDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t("inProgress")}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

RecentMatchesCard.displayName = "RecentMatchesCard"