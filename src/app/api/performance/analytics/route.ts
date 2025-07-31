/**
 * Performance Analytics API Endpoint
 * Receives and processes performance data from clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PerformanceDataSchema = z.object({
  sessionId: z.string(),
  device: z.object({
    type: z.enum(['mobile', 'tablet', 'desktop']),
    memory: z.number().optional(),
    cores: z.number().optional(),
    gpu: z.string().optional(),
  }),
  connection: z.object({
    effectiveType: z.string(),
    downlink: z.number(),
    rtt: z.number(),
    saveData: z.boolean(),
  }),
  metrics: z.array(z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    delta: z.number(),
    entries: z.array(z.any()),
    navigationType: z.string(),
    url: z.string(),
    timestamp: z.number(),
  })),
  errors: z.array(z.object({
    message: z.string(),
    stack: z.string().optional(),
    timestamp: z.number(),
    url: z.string(),
  })),
  timestamp: z.number(),
  duration: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = PerformanceDataSchema.parse(body)

    // Process performance data
    await processPerformanceData(data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to process performance data' },
      { status: 400 }
    )
  }
}

async function processPerformanceData(data: z.infer<typeof PerformanceDataSchema>) {
  // In a real application, you would:
  // 1. Store data in a time-series database (InfluxDB, TimescaleDB)
  // 2. Send to monitoring services (DataDog, New Relic, etc.)
  // 3. Trigger alerts for performance regressions
  // 4. Update performance dashboards

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Data Received:', {
      sessionId: data.sessionId,
      deviceType: data.device.type,
      connectionType: data.connection.effectiveType,
      metricsCount: data.metrics.length,
      errorsCount: data.errors.length,
      duration: data.duration,
    })

    // Log critical performance issues
    data.metrics.forEach(metric => {
      if (metric.rating === 'poor') {
        console.warn(`🚨 Poor performance detected: ${metric.name} = ${metric.value}`)
      }
    })

    data.errors.forEach(error => {
      console.error(`💥 Client error: ${error.message}`)
    })
  }

  // Example: Store in a simple format (in production, use proper database)
  if (process.env.NODE_ENV === 'production') {
    // Store metrics for analysis
    await storePerformanceMetrics(data)
    
    // Check for performance regressions
    await checkPerformanceRegressions(data)
    
    // Update real-time dashboard
    await updatePerformanceDashboard(data)
  }
}

async function storePerformanceMetrics(data: z.infer<typeof PerformanceDataSchema>) {
  // Example implementation - replace with your preferred storage
  try {
    // Store in database, send to analytics service, etc.
    console.log('Storing performance metrics for session:', data.sessionId)
  } catch (error) {
    console.error('Failed to store performance metrics:', error)
  }
}

async function checkPerformanceRegressions(data: z.infer<typeof PerformanceDataSchema>) {
  // Example regression detection logic
  const criticalThresholds = {
    LCP: 4000,
    FID: 300,
    CLS: 0.25,
    FCP: 3000,
    INP: 500,
    TTFB: 1800,
  }

  data.metrics.forEach(metric => {
    const threshold = criticalThresholds[metric.name as keyof typeof criticalThresholds]
    if (threshold && metric.value > threshold) {
      console.warn(`🚨 Performance regression detected: ${metric.name} = ${metric.value}ms (threshold: ${threshold}ms)`)
      // In production: send alert to monitoring service
    }
  })
}

async function updatePerformanceDashboard(data: z.infer<typeof PerformanceDataSchema>) {
  // Update real-time performance dashboard
  // This could push to WebSocket connections, update Redis cache, etc.
  console.log('Updating performance dashboard for session:', data.sessionId)
}