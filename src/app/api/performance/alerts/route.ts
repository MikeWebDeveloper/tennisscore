/**
 * Performance Alerts API Endpoint
 * Handles critical performance alerts requiring immediate attention
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const PerformanceAlertSchema = z.object({
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  metric: z.string(),
  value: z.number(),
  threshold: z.number(),
  timestamp: z.number(),
  url: z.string(),
  userAgent: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const alert = PerformanceAlertSchema.parse(body)

    // Process critical alert
    await processPerformanceAlert(alert)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Performance alert error:', error)
    return NextResponse.json(
      { error: 'Failed to process performance alert' },
      { status: 400 }
    )
  }
}

async function processPerformanceAlert(alert: z.infer<typeof PerformanceAlertSchema>) {
  console.log(`🚨 Performance Alert [${alert.severity.toUpperCase()}]:`, {
    metric: alert.metric,
    value: alert.value,
    threshold: alert.threshold,
    url: alert.url,
    timestamp: new Date(alert.timestamp).toISOString(),
  })

  // Handle different severity levels
  switch (alert.severity) {
    case 'critical':
      await handleCriticalAlert(alert)
      break
    case 'error':
      await handleErrorAlert(alert)
      break
    case 'warning':
      await handleWarningAlert(alert)
      break
    case 'info':
      await handleInfoAlert(alert)
      break
  }
}

async function handleCriticalAlert(alert: z.infer<typeof PerformanceAlertSchema>) {
  // Critical alerts require immediate action
  console.error('🔥 CRITICAL PERFORMANCE ISSUE:', alert)
  
  // In production:
  // 1. Send to PagerDuty/OpsGenie
  // 2. Notify on-call engineers
  // 3. Create incident ticket
  // 4. Send to Slack/Teams
  
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to monitoring service
    await sendToMonitoringService(alert, 'critical')
    
    // Example: Notify team
    await notifyTeam(alert)
  }
}

async function handleErrorAlert(alert: z.infer<typeof PerformanceAlertSchema>) {
  console.error('❌ Performance Error:', alert)
  
  // Send to logging service
  if (process.env.NODE_ENV === 'production') {
    await sendToMonitoringService(alert, 'error')
  }
}

async function handleWarningAlert(alert: z.infer<typeof PerformanceAlertSchema>) {
  console.warn('⚠️ Performance Warning:', alert)
  
  // Log for analysis
  if (process.env.NODE_ENV === 'production') {
    await sendToMonitoringService(alert, 'warning')
  }
}

async function handleInfoAlert(alert: z.infer<typeof PerformanceAlertSchema>) {
  console.info('ℹ️ Performance Info:', alert)
  
  // Just log for trends
  if (process.env.NODE_ENV === 'production') {
    await sendToMonitoringService(alert, 'info')
  }
}

async function sendToMonitoringService(alert: z.infer<typeof PerformanceAlertSchema>, level: string) {
  // Example: Send to external monitoring service
  try {
    // Replace with your monitoring service API
    console.log(`Sending ${level} alert to monitoring service:`, alert.metric)
    
    // Example integrations:
    // - DataDog: await datadogClient.send(alert)
    // - New Relic: await newRelicClient.recordEvent(alert)
    // - Sentry: Sentry.captureMessage(`Performance ${level}: ${alert.metric}`)
    
  } catch (error) {
    console.error('Failed to send alert to monitoring service:', error)
  }
}

async function notifyTeam(alert: z.infer<typeof PerformanceAlertSchema>) {
  try {
    // Example: Send to Slack
    console.log('Notifying team about critical performance issue:', alert.metric)
    
    // In production, you would send to actual notification channels:
    // - Slack webhook
    // - Microsoft Teams webhook
    // - Email alerts
    // - SMS alerts via Twilio
    
  } catch (error) {
    console.error('Failed to notify team:', error)
  }
}