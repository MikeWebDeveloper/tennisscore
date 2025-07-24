"use client"

import { motion } from "framer-motion"
import { ChevronLeft, BarChart3, TrendingUp, Filter } from "lucide-react"
import { EnhancedBentoGrid } from "../dashboard/_components/enhanced-bento-grid"
import { StatisticsFiltersComponent, StatisticsFilters } from "./_components/statistics-filters"
import { applyFiltersToMatches, getFilterSummary, hasActiveFilters } from "./_components/filter-utils"
import { VirtualMatchesList, MatchListPerformanceStats } from "./_components/virtual-matches-list"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Match, Player, User } from "@/lib/types"
import { useTranslations } from "@/hooks/use-translations"
import Link from "next/link"
import { Suspense, useState, useMemo } from "react"
import { ChartSkeleton } from "@/components/ui/loading-skeletons"

interface StatisticsClientProps {
  user: User | null
  mainPlayer: Player | null
  matches: Match[]
  totalMatches: number
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function StatisticsClient({
  user,
  mainPlayer,
  matches,
  totalMatches,
}: StatisticsClientProps) {
  const t = useTranslations()
  const firstName = user?.name?.split(' ')[0] || mainPlayer?.firstName || 'User'
  
  // Filters state
  const [filters, setFilters] = useState<StatisticsFilters>({
    dateRange: {},
    opponent: undefined,
    matchFormat: undefined,
    status: undefined,
    minMatches: undefined
  })
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)

  // Apply filters to matches
  const filteredMatches = useMemo(() => 
    applyFiltersToMatches(matches, filters, mainPlayer?.$id),
    [matches, filters, mainPlayer?.$id]
  )

  const filterSummary = getFilterSummary(filters, totalMatches, filteredMatches.length)
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
      {/* Header with Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        {/* Back Navigation */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        {/* Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100">
              Statistics
            </h1>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-lg text-gray-700 dark:text-slate-400">
            Complete performance analysis for {firstName}
          </p>
          
          {/* Stats Summary */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{filterSummary}</span>
            </div>
            {hasFilters && (
              <Badge variant="secondary" className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                Filtered
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <StatisticsFiltersComponent
          matches={matches}
          filters={filters}
          onFiltersChange={setFilters}
          isCollapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed(!filtersCollapsed)}
        />
      </motion.div>

      {/* Enhanced Statistics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Suspense fallback={<ChartSkeleton />}>
          <EnhancedBentoGrid 
            matches={filteredMatches}
            mainPlayer={mainPlayer}
            isLimitedData={false}
            totalMatches={filteredMatches.length}
          />
        </Suspense>
      </motion.div>

      {/* Virtual Matches List */}
      {filteredMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Match History</h2>
            <Badge variant="outline" className="text-xs">
              Virtual Scrolling
            </Badge>
          </div>
          
          <MatchListPerformanceStats 
            matches={filteredMatches} 
            mainPlayerId={mainPlayer?.$id} 
          />
          
          <VirtualMatchesList
            matches={filteredMatches}
            mainPlayerId={mainPlayer?.$id}
            containerHeight={500}
          />
        </motion.div>
      )}

      {/* Footer Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="flex justify-center pt-8"
      >
        <Link href="/matches">
          <Button variant="outline">
            View All Matches
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}