"use client"

import { motion } from '@/lib/framer-motion-config'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target } from "lucide-react"
import { useMemo, useState, useEffect } from "react"
import { Match, Player } from "@/lib/types"
import { useTranslations } from "@/i18n"
import { UPlotLineChart } from "@/components/charts/uplot-line-chart"

interface PerformanceChartsProps {
  matches: Match[]
  mainPlayer: Player | null
}

// Simple pie chart component
function SimplePieChart({ data }: { data: Array<{ name: string; value: number; fill: string }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  return (
    <svg viewBox="0 0 200 200" className="w-full h-48 max-w-[200px] mx-auto">
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100
        const startAngle = (cumulativePercentage * 360) / 100
        const endAngle = ((cumulativePercentage + percentage) * 360) / 100
        cumulativePercentage += percentage

        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
        const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
        const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
        const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
        const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)

        return (
          <g key={item.name}>
            <path
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={item.fill}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1"
            />
            {/* Label */}
            <text
              x={100 + 50 * Math.cos(((startAngle + endAngle) / 2 * Math.PI) / 180)}
              y={100 + 50 * Math.sin(((startAngle + endAngle) / 2 * Math.PI) / 180)}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-current"
              style={{ fontSize: '10px' }}
            >
              {percentage.toFixed(0)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function PerformanceCharts({ matches, mainPlayer }: PerformanceChartsProps) {
  const [isClient, setIsClient] = useState(false)
  const t = useTranslations('dashboard')

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prepare win/loss trend data
  const winLossTrend = useMemo(() => {
    if (!isClient || !mainPlayer) return []
    
    const completedMatches = matches
      .filter(m => m.status === "completed")
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
      .slice(-10)
    
    let wins = 0
    let total = 0
    
    return completedMatches.map((match, index) => {
      total++
      const userWon = match.winnerId === mainPlayer.$id
      if (userWon) wins++
      
      return {
        match: index + 1,
        winRate: Math.round((wins / total) * 100),
        date: new Date(match.matchDate).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    })
  }, [matches, mainPlayer, isClient])

  // Prepare performance breakdown data
  const performanceBreakdown = useMemo(() => {
    if (!isClient) return []
    
    const completedMatches = matches.filter(m => m.status === "completed")
    if (completedMatches.length === 0) return []

    return [
      { name: t('unforcedErrorsLabel'), value: 25, fill: 'rgb(var(--foreground))' },
      { name: t('forcedErrorsLabel'), value: 20, fill: 'rgb(var(--muted-foreground))' },
      { name: t('acesLabel'), value: 10, fill: 'rgb(var(--primary))' }
    ]
  }, [matches, isClient, t])

  if (!isClient) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[300px] animate-pulse bg-muted/20" />
        <Card className="h-[300px] animate-pulse bg-muted/20" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Win/Loss Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('performanceTrendTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {winLossTrend.length > 0 ? (
              <UPlotLineChart data={winLossTrend} height={180} />
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                {t('noDataLabel')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('performanceBreakdownTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceBreakdown.length > 0 ? (
              <div>
                <SimplePieChart data={performanceBreakdown} />
                <div className="mt-4 space-y-2">
                  {performanceBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                {t('noDataLabel')}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}