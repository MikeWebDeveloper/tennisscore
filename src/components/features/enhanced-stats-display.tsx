"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AdvancedMatchStats } from "@/lib/utils/match-stats"
import { BarChart3, Target, Zap, Activity } from "lucide-react"
import { useTranslations } from "@/hooks/use-translations"

interface EnhancedStatsDisplayProps {
  stats: AdvancedMatchStats
}

export function EnhancedStatsDisplay({ stats }: EnhancedStatsDisplayProps) {
  const t = useTranslations('common')
  if (!stats.hasEnhancedData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No enhanced statistics available</p>
            <p className="text-xs mt-1">Enable custom mode during live scoring to collect detailed analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Enhanced Tennis Analytics</h3>
        <Badge variant="secondary" className="ml-2">Professional Level</Badge>
      </div>

      {/* Serve Analytics */}
      {Object.keys(stats.serveAnalytics.placement.distribution).length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Serve Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Serve Placement */}
            <div>
              <h4 className="text-sm font-medium mb-3">Serve Placement Distribution</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.serveAnalytics.placement.distribution).map(([placement, count]) => {
                  const successRate = stats.serveAnalytics.placement.successRate[placement] || 0
                  const avgSpeed = stats.serveAnalytics.placement.averageSpeed[placement] || 0
                  
                  return (
                    <div key={placement} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium capitalize">
                          {placement.replace(/-/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {count} serves
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Success Rate:</span>
                          <span className="font-medium">{successRate}%</span>
                        </div>
                        {avgSpeed > 0 && (
                          <div className="flex justify-between text-xs">
                            <span>Avg Speed:</span>
                            <span className="font-medium">{avgSpeed} mph</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 bg-muted rounded-full h-1">
                        <div 
                          className="bg-primary h-1 rounded-full transition-all"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Speed Analytics */}
            {stats.serveAnalytics.speed.average > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Speed Analytics
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{stats.serveAnalytics.speed.average}</div>
                    <div className="text-xs text-muted-foreground">Avg mph</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{stats.serveAnalytics.speed.max}</div>
                    <div className="text-xs text-muted-foreground">Max mph</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold">{stats.serveAnalytics.speed.min}</div>
                    <div className="text-xs text-muted-foreground">Min mph</div>
                  </div>
                </div>
                
                {/* Speed Distribution */}
                <div className="space-y-2">
                  {stats.serveAnalytics.speed.distribution.map(range => (
                    <div key={range.range} className="flex items-center gap-3">
                      <span className="text-xs w-20">{range.range}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.max(10, (range.count / Math.max(...stats.serveAnalytics.speed.distribution.map(r => r.count))) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{range.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Spin Analytics */}
            {Object.keys(stats.serveAnalytics.spin.distribution).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Spin Analytics</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(stats.serveAnalytics.spin.distribution).map(([spin, count]) => {
                    const effectiveness = stats.serveAnalytics.spin.effectiveness[spin] || 0
                    
                    return (
                      <div key={spin} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium capitalize">{spin}</span>
                          <Badge variant="outline" className="text-xs">{count}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {effectiveness}% effective
                        </div>
                        <div className="mt-1 bg-muted rounded-full h-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full transition-all"
                            style={{ width: `${effectiveness}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rally Analytics */}
      {Object.keys(stats.rallyAnalytics.typeDistribution).length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Rally Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">{stats.rallyAnalytics.averageLength}</div>
                <div className="text-xs text-muted-foreground">Avg Rally Length</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">
                  {Object.values(stats.rallyAnalytics.typeDistribution).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Tracked</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-lg font-bold">
                  {Object.keys(stats.rallyAnalytics.typeDistribution).length}
                </div>
                <div className="text-xs text-muted-foreground">{t('rallyTypes')}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">{t('rallyTypeDistributionAndSuccess')}</h4>
              <div className="space-y-3">
                {Object.entries(stats.rallyAnalytics.typeDistribution).map(([type, count]) => {
                  const success = stats.rallyAnalytics.typeSuccess[type] || 0
                  const total = Object.values(stats.rallyAnalytics.typeDistribution).reduce((a, b) => a + b, 0)
                  const percentage = Math.round((count / total) * 100)
                  
                  return (
                    <div key={type} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {percentage}% of rallies
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {success}% success
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Frequency</div>
                          <div className="bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                          <div className="bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${success}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Situational Performance */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Pressure Situation Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'breakPointPerformance', label: 'Break Points' },
              { key: 'setPointPerformance', label: 'Set Points' },
              { key: 'matchPointPerformance', label: 'Match Points' }
            ].map(({ key, label }) => {
              const perf = stats.serveAnalytics.situational[key as keyof typeof stats.serveAnalytics.situational]
              
              return (
                <div key={key} className="text-center p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">{label}</div>
                  <div className="text-2xl font-bold mb-1">
                    {perf.percentage}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {perf.made}/{perf.attempts} successful
                  </div>
                  <div className="mt-2 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${perf.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 