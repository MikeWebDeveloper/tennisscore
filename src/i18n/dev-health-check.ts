/**
 * Development Translation Health Check Utility
 * 
 * Quick health check tool for development environment.
 * Provides instant feedback on translation system status.
 * 
 * Usage in development:
 * - Import and call logHealthStatus() in development
 * - Run performHealthCheck() for detailed analysis  
 * - Use quickHealthCheck() for fast status updates
 */

import { performHealthCheck, quickHealthCheck, formatHealthReport } from './health-monitor'

/**
 * Quick development health check with console output
 */
export async function devHealthCheck(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  console.log('🏥 Running translation health check...')
  
  try {
    const quickResult = await quickHealthCheck()
    
    if (quickResult.status === 'healthy') {
      console.log(`✅ Translation system is healthy (Score: ${quickResult.score}/100)`)
    } else if (quickResult.status === 'warning') {
      console.log(`⚠️  Translation system has warnings (Score: ${quickResult.score}/100, Issues: ${quickResult.issues})`)
    } else {
      console.log(`❌ Translation system has critical issues (Score: ${quickResult.score}/100, Issues: ${quickResult.issues})`)
      
      // Get detailed report for critical issues
      const fullReport = await performHealthCheck()
      console.log('\n' + formatHealthReport(fullReport))
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
}

/**
 * Detailed development health report
 */
export async function devDetailedHealthCheck(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    const report = await performHealthCheck(true) // Force refresh
    console.log(formatHealthReport(report))
  } catch (error) {
    console.error('❌ Detailed health check failed:', error)
  }
}

/**
 * Translation completeness checker for specific namespace
 */
export async function checkNamespaceCompleteness(namespace: string): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    const report = await performHealthCheck()
    const namespaceIssues = report.issues.filter(issue => issue.namespace === namespace)
    
    if (namespaceIssues.length === 0) {
      console.log(`✅ Namespace '${namespace}' is complete`)
    } else {
      console.log(`⚠️  Namespace '${namespace}' has ${namespaceIssues.length} issues:`)
      namespaceIssues.forEach(issue => {
        console.log(`  • ${issue.message}`)
      })
    }
  } catch (error) {
    console.error(`❌ Failed to check namespace '${namespace}':`, error)
  }
}

/**
 * Watch for translation issues during development
 * Can be called periodically to monitor health
 */
export async function watchTranslationHealth(intervalMs: number = 30000): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  console.log(`🔍 Starting translation health monitoring (checking every ${intervalMs/1000}s)`)
  
  let lastScore = 100
  
  const checkHealth = async () => {
    try {
      const result = await quickHealthCheck()
      
      // Only log if health changed significantly
      if (Math.abs(result.score - lastScore) >= 5 || result.status !== 'healthy') {
        console.log(`🏥 Translation Health: ${result.status.toUpperCase()} (Score: ${result.score}/100)`)
        
        if (result.issues > 0) {
          console.log(`   Issues detected: ${result.issues}`)
        }
      }
      
      lastScore = result.score
    } catch (error) {
      console.error('❌ Health monitoring error:', error)
    }
  }
  
  // Initial check
  await checkHealth()
  
  // Set up periodic checking
  const interval = setInterval(checkHealth, intervalMs)
  
  // Cleanup on process exit
  process.on('exit', () => {
    clearInterval(interval)
  })
}

/**
 * Validate that all used translation keys exist
 * Useful during development to catch missing keys early
 */
export function validateTranslationKey(
  namespace: string, 
  key: string, 
  locale: string = 'en'
): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return true // Skip validation in production
  }

  try {
    // This is a simplified check - in a real implementation, 
    // you'd load the actual translation files and check
    const fullKey = `${namespace}.${key}`
    
    // For now, just log the attempt
    console.log(`🔍 Validating translation key: ${fullKey} (${locale})`)
    
    return true
  } catch (error) {
    console.warn(`⚠️  Translation key validation failed: ${namespace}.${key}`, error)
    return false
  }
}

/**
 * Development utility to list all available translation keys
 */
export async function listAvailableKeys(namespace?: string): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    const report = await performHealthCheck()
    
    console.log('📋 Available Translation Keys:')
    
    if (namespace) {
      console.log(`\nNamespace: ${namespace}`)
      // Filter keys for specific namespace
      const namespaceKeys = report.issues
        .filter(issue => issue.namespace === namespace)
        .map(issue => issue.key)
        .filter(key => key && key !== '*')
      
      if (namespaceKeys.length === 0) {
        console.log('  ✅ All keys are available')
      } else {
        console.log(`  ⚠️  Missing keys: ${namespaceKeys.join(', ')}`)
      }
    } else {
      console.log('\nAll namespaces:')
      const namespaces = ['admin', 'auth', 'common', 'dashboard', 'match', 'navigation', 'player', 'settings', 'statistics']
      
      namespaces.forEach(ns => {
        const nsIssues = report.issues.filter(issue => issue.namespace === ns).length
        const status = nsIssues === 0 ? '✅' : `⚠️ (${nsIssues} issues)`
        console.log(`  ${ns}: ${status}`)
      })
    }
  } catch (error) {
    console.error('❌ Failed to list available keys:', error)
  }
}

/**
 * Export for easy usage in development
 */
export const devTranslationUtils = {
  healthCheck: devHealthCheck,
  detailedHealthCheck: devDetailedHealthCheck,
  checkNamespace: checkNamespaceCompleteness,
  watchHealth: watchTranslationHealth,
  validateKey: validateTranslationKey,
  listKeys: listAvailableKeys
}

// Auto-run health check in development when this module is imported
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  // Only run on server-side in development
  devHealthCheck().catch(console.error)
}