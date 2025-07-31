"use client"

import { useState, useMemo } from "react"
import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { Filter } from "lucide-react"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { StatisticsFiltersComponent, StatisticsFilters } from "./_components/statistics-filters"
import { VirtualMatchesList } from "./_components/virtual-matches-list"
import { applyFiltersToMatches, getFilterSummary, hasActiveFilters } from "./_components/filter-utils"
import { aggregatePlayerStatsAcrossMatches } from "@/lib/utils/match-stats"

interface StatisticsClientProps {
  mainPlayer: Player
  matches: Match[]
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function StatisticsClient({ mainPlayer, matches }: StatisticsClientProps) {
  const t = useTranslations('statistics')
  const [filters, setFilters] = useState<StatisticsFilters>({
    dateRange: {},
    opponent: undefined,
    matchFormat: undefined,
    status: undefined,
    minMatches: undefined
  })
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)

  // Apply filters to matches
  const filteredMatches = useMemo(() => 
    applyFiltersToMatches(matches, filters, mainPlayer.$id),
    [matches, filters, mainPlayer.$id]
  )

  // Calculate aggregate statistics for filtered matches
  const stats = useMemo(() => 
    aggregatePlayerStatsAcrossMatches(filteredMatches, mainPlayer.$id),
    [filteredMatches, mainPlayer.$id]
  )

  // Get filter summary
  const filterSummary = getFilterSummary(filters, matches.length, filteredMatches.length)
  const hasFilters = hasActiveFilters(filters)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
            {t("statistics")}
          </h1>
        </div>
        <p className="text-lg text-gray-700 dark:text-slate-400">
          Analyze your tennis performance with detailed match statistics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("totalMatches")}</p>
              <p className="text-3xl font-bold">{stats.totalMatches}</p>
              {hasFilters && (
                <p className="text-xs text-muted-foreground">
                  {matches.length} total
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t("winRate")}</p>
              <p className="text-3xl font-bold">{stats.winRate}%</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-green-500">
                  {stats.matchesWon} won
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-3xl font-bold">
                N/A
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Played</p>
              <p className="text-lg font-medium">
                {filteredMatches.length > 0 
                  ? new Date(filteredMatches[0].matchDate).toLocaleDateString()
                  : "N/A"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters - Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <StatisticsFiltersComponent
              matches={matches}
              mainPlayerId={mainPlayer.$id}
              filters={filters}
              onFiltersChange={setFilters}
              isCollapsed={isFiltersCollapsed}
              onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
            />
          </div>
        </div>

        {/* Match List - Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("matchHistory")}</CardTitle>
                {hasFilters && (
                  <Badge variant="secondary" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    {filterSummary}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <VirtualMatchesList 
                matches={filteredMatches}
                mainPlayerId={mainPlayer.$id}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Performance charts and analytics coming soon...
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}