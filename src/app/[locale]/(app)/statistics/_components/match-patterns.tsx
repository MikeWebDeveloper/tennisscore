"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { UPlotBarChart, UPlotRadialBarChart } from "@/components/ui/charts"
import { Clock } from "lucide-react"
import { Sunrise } from "lucide-react"
import { Sun } from "lucide-react"
import { Sunset } from "lucide-react"
import { Trophy } from "lucide-react"
import { Activity } from "lucide-react"
import { Timer } from "lucide-react"
import { Zap } from "lucide-react"
import { useTranslations } from "@/i18n"

interface MatchPatternsProps {
  patterns: {
    averageMatchDuration: number
    longestMatch: number
    shortestMatch: number
    averageGamesPerMatch: number
    averageSetsPerMatch: number
    straightSetWins: number
    fiveSetterWins: number
    morningPerformance: { played: number, won: number }
    afternoonPerformance: { played: number, won: number }
    eveningPerformance: { played: number, won: number }
  }
}


export function MatchPatterns({ patterns }: MatchPatternsProps) {
  const t = useTranslations('common')
  const tStats = useTranslations('statistics')

  // Time of day performance data
  const timeOfDayData = [
    {
      time: t("time.morning"),
      matches: patterns.morningPerformance.played,
      winRate: patterns.morningPerformance.played > 0 
        ? Math.round((patterns.morningPerformance.won / patterns.morningPerformance.played) * 100)
        : 0,
      icon: Sunrise
    },
    {
      time: t("time.afternoon"),
      matches: patterns.afternoonPerformance.played,
      winRate: patterns.afternoonPerformance.played > 0
        ? Math.round((patterns.afternoonPerformance.won / patterns.afternoonPerformance.played) * 100)
        : 0,
      icon: Sun
    },
    {
      time: t("time.evening"),
      matches: patterns.eveningPerformance.played,
      winRate: patterns.eveningPerformance.played > 0
        ? Math.round((patterns.eveningPerformance.won / patterns.eveningPerformance.played) * 100)
        : 0,
      icon: Sunset
    }
  ]

  // Match duration distribution
  const durationData = [
    {
      category: t("matchPatterns.quick"),
      value: patterns.shortestMatch,
      description: `< ${Math.round(patterns.averageMatchDuration * 0.75)} min`
    },
    {
      category: t("matchPatterns.average"),
      value: patterns.averageMatchDuration,
      description: `${Math.round(patterns.averageMatchDuration * 0.75)}-${Math.round(patterns.averageMatchDuration * 1.25)} min`
    },
    {
      category: t("matchPatterns.marathon"),
      value: patterns.longestMatch,
      description: `> ${Math.round(patterns.averageMatchDuration * 1.25)} min`
    }
  ]


  // Match intensity gauge data
  const intensityData = [
    {
      name: t("matchPatterns.matchIntensity"),
      value: Math.min(patterns.averageGamesPerMatch / 20 * 100, 100),
      fill: "#8b5cf6"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Match Duration Overview - Mobile Optimized */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <Badge variant="outline">Average</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{patterns.averageMatchDuration} min</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{tStats('avgMatchDuration')}</p>
              <Progress 
                value={Math.min((patterns.averageMatchDuration / 180) * 100, 100) || 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Timer className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              <Badge variant="outline" className="text-green-600">Quickest</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{patterns.shortestMatch} min</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{tStats('shortestMatch')}</p>
              <Progress 
                value={patterns.averageMatchDuration > 0 ? (patterns.shortestMatch / patterns.averageMatchDuration) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 xs:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
              <Badge variant="outline" className="text-orange-600">Marathon</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold">{patterns.longestMatch} min</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{tStats('longestMatch')}</p>
              <Progress 
                value={Math.min((patterns.longestMatch / 300) * 100, 100)} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time of Day Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats('performanceByTimeOfDay')}</CardTitle>
          <CardDescription>
            {tStats('whenYouPerformBest')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4 mb-4 sm:mb-6">
            {timeOfDayData.map((data, index) => {
              const Icon = data.icon
              return (
                <div key={index} className="text-center space-y-1 sm:space-y-2">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 mx-auto text-muted-foreground" />
                  <p className="text-xs sm:text-sm font-medium">{data.time}</p>
                  <p className="text-lg xs:text-xl sm:text-2xl font-bold">{data.winRate}%</p>
                  <p className="text-[10px] xs:text-xs text-muted-foreground">
                    {data.matches} matches
                  </p>
                  <Progress value={data.winRate || 0} className="h-1.5 sm:h-2" />
                </div>
              )
            })}
          </div>
          
          <div className="h-[150px] xs:h-[175px] sm:h-[200px]">
            <UPlotBarChart 
              data={timeOfDayData} 
              dataKeys={['winRate']} 
              nameKey="time" 
              colors={['#3b82f6']} 
              height={200} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Match Intensity */}
        <Card>
          <CardHeader>
            <CardTitle>{tStats('matchIntensity')}</CardTitle>
            <CardDescription>
              {tStats('averageGamesAndSetsPerMatch')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{tStats('gamesPerMatch')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{patterns.averageGamesPerMatch}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">{tStats('setsPerMatch')}</p>
                  <p className="text-xl sm:text-2xl font-bold">{patterns.averageSetsPerMatch}</p>
                </div>
              </div>
              
              <div className="h-[120px] xs:h-[135px] sm:h-[150px]">
                <UPlotRadialBarChart 
                  data={intensityData.map(item => ({
                    name: item.name,
                    value: item.value,
                    fill: "#8b5cf6"
                  }))}
                  height={150}
                  innerRadius={30}
                  outerRadius={90}
                  cornerRadius={10}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div>
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xs sm:text-sm font-medium">{patterns.straightSetWins}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{tStats('straightSetWins')}</p>
                </div>
                <div>
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-xs sm:text-sm font-medium">{patterns.fiveSetterWins}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{tStats('fiveSetWins')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Duration Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{tStats('matchDurationPattern')}</CardTitle>
            <CardDescription>
              {tStats('typicalMatchLength')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] xs:h-[225px] sm:h-[250px]">
              <UPlotBarChart 
                data={durationData} 
                dataKeys={['value']} 
                nameKey="category" 
                colors={['#22c55e']} 
                height={150} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{tStats('matchInsights')}</CardTitle>
          <CardDescription>
            {tStats('keyPatternsInYourMatches')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                <p className="text-xs sm:text-sm font-medium">{tStats('peakPerformance')}</p>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground pl-4 sm:pl-5">
                {getBestTimeOfDay(timeOfDayData, t, tStats)}
              </p>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-blue-500" />
                <p className="text-xs sm:text-sm font-medium">{tStats('typicalMatchStyle')}</p>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground pl-4 sm:pl-5">
                {getMatchStyle(patterns, t)}
              </p>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-purple-500" />
                <p className="text-xs sm:text-sm font-medium">{tStats('endurance')}</p>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground pl-4 sm:pl-5">
                {getEnduranceLevel(patterns, t)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function getBestTimeOfDay(timeData: { time: string; winRate: number; matches: number }[], t: (key: string) => string, tStats: (key: string, params?: any) => string): string {
  if (!timeData || timeData.length === 0) {
    return t("matchPatterns.noMatchData")
  }
  
  const best = timeData.reduce((prev, current) => 
    prev.winRate > current.winRate ? prev : current
  )
  
  if (!best || !best.time) {
    return t("matchPatterns.noTimePreference")
  }
  
  return tStats('bestPerformanceInTime', { time: best.time.toLowerCase(), winRate: best.winRate })
}

function getMatchStyle(patterns: MatchPatternsProps['patterns'], t: (key: string) => string): string {
  const avgGames = patterns.averageGamesPerMatch
  if (avgGames < 15) return t("matchPatterns.quickDominant")
  if (avgGames < 20) return t("matchPatterns.balancedApproach")
  return t("matchPatterns.marathonRunner")
}

function getEnduranceLevel(patterns: MatchPatternsProps['patterns'], t: (key: string) => string): string {
  const longMatches = patterns.longestMatch
  const avgDuration = patterns.averageMatchDuration
  
  if (longMatches > avgDuration * 2) return t("matchPatterns.excellentEndurance")
  if (longMatches > avgDuration * 1.5) return t("matchPatterns.goodStamina")
  return t("matchPatterns.quickDominant")
}