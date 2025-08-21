/**
 * Console Monitor Dashboard
 * Real-time console monitoring and error visualization
 */

'use client'

import React, { useState, useEffect } from 'react'
import { getConsoleMonitor, ConsoleLog, ConsoleReport } from '@/lib/utils/console-monitor'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { ScrollArea } from '@/components/ui/scroll-area'

export const ConsoleMonitorDashboard: React.FC = () => {
  const [report, setReport] = useState<ConsoleReport | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [realtimeLogs, setRealtimeLogs] = useState<ConsoleLog[]>([])

  useEffect(() => {
    const monitor = getConsoleMonitor()
    
    // Initial report
    setReport(monitor.generateReport())
    
    // Listen for new logs
    const unsubscribe = monitor.onLog((log) => {
      setRealtimeLogs(prev => [...prev.slice(-49), log]) // Keep last 50 logs
      setReport(monitor.generateReport())
    })

    return unsubscribe
  }, [])

  const getSeverityColor = (severity: ConsoleLog['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: ConsoleLog['category']) => {
    switch (category) {
      case 'performance': return '⚡'
      case 'network': return '🌐'
      case 'react': return '⚛️'
      case 'bundle': return '📦'
      case 'user': return '👤'
      default: return '❓'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  if (!report) return null

  // Only show in development or when there are issues
  const shouldShow = process.env.NODE_ENV === 'development' || 
                     report.summary.criticalIssues > 0 || 
                     report.summary.totalErrors > 0

  if (!shouldShow && !isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsVisible(!isVisible)}
        variant="outline"
        size="sm"
        className="mb-2 bg-background/90 backdrop-blur-sm"
      >
        <span className="mr-2">🔍</span>
        Console Monitor
        {report.summary.criticalIssues > 0 && (
          <Badge variant="destructive" className="ml-2">
            {report.summary.criticalIssues}
          </Badge>
        )}
      </Button>

      {/* Dashboard */}
      {isVisible && (
        <Card className="bg-background/95 backdrop-blur-sm border-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Console Health Monitor
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ✕
              </Button>
            </CardTitle>
            <CardDescription>
              Real-time browser behavior monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="recommendations">Tips</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <Badge variant={report.summary.totalErrors > 0 ? "destructive" : "secondary"}>
                        {report.summary.totalErrors}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Warnings:</span>
                      <Badge variant={report.summary.totalWarnings > 0 ? "secondary" : "outline"}>
                        {report.summary.totalWarnings}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Critical:</span>
                      <Badge variant={report.summary.criticalIssues > 0 ? "destructive" : "outline"}>
                        {report.summary.criticalIssues}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance:</span>
                      <Badge variant="outline">
                        ⚡ {report.summary.performanceIssues}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <Badge variant="outline">
                        🌐 {report.summary.networkIssues}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>React:</span>
                      <Badge variant="outline">
                        ⚛️ {report.summary.reactIssues}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="logs" className="mt-4">
                <div className="h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {realtimeLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent logs</p>
                    ) : (
                      realtimeLogs.slice(-10).map((log, index) => (
                        <div 
                          key={index}
                          className="p-2 rounded-lg bg-muted text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <span>{getCategoryIcon(log.category)}</span>
                              <Badge 
                                variant="outline" 
                                className={`${getSeverityColor(log.severity)} text-white text-xs`}
                              >
                                {log.type}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-foreground truncate">
                            {log.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="mt-4">
                <div className="space-y-2">
                  {report.recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recommendations</p>
                  ) : (
                    report.recommendations.map((rec, index) => (
                      <div key={index} className="p-2 rounded-lg bg-muted text-xs">
                        {rec}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ConsoleMonitorDashboard