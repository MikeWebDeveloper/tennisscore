/**
 * Translation System Health Monitor
 * 
 * Provides comprehensive health checking and validation for the i18n system:
 * - Missing key detection across all locales
 * - Translation completeness validation  
 * - Runtime error monitoring
 * - Build-time validation hooks
 * - Development debugging tools
 */

import { routing } from './routing'
import type { SupportedLocale, TranslationNamespace } from './shared-config'

// Health check results interface
export interface TranslationHealthReport {
  status: 'healthy' | 'warning' | 'critical'
  score: number // 0-100
  timestamp: number
  summary: {
    totalKeys: number
    missingKeys: number
    completenessPercentage: number
    localesChecked: SupportedLocale[]
    namespacesChecked: TranslationNamespace[]
  }
  issues: HealthIssue[]
  recommendations: string[]
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info'
  type: 'missing_key' | 'empty_value' | 'format_error' | 'consistency_issue'
  namespace: TranslationNamespace
  locale: SupportedLocale
  key: string
  message: string
  suggestion?: string
}

// Cached health report for performance
let cachedHealthReport: TranslationHealthReport | null = null
let lastHealthCheck = 0
const HEALTH_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Comprehensive health check of the entire translation system
 */
export async function performHealthCheck(forceRefresh = false): Promise<TranslationHealthReport> {
  const now = Date.now()
  
  // Return cached result if recent and not forcing refresh
  if (!forceRefresh && cachedHealthReport && (now - lastHealthCheck) < HEALTH_CACHE_DURATION) {
    return cachedHealthReport
  }

  console.log('🏥 Starting translation system health check...')
  
  const issues: HealthIssue[] = []
  const namespaces: TranslationNamespace[] = ['admin', 'auth', 'common', 'dashboard', 'match', 'navigation', 'player', 'settings', 'statistics']
  
  let totalKeys = 0
  let missingKeys = 0
  
  // Load all translation files for comparison
  const translations: Record<SupportedLocale, Record<TranslationNamespace, any>> = {} as any
  
  for (const locale of routing.locales) {
    translations[locale] = {} as any
    
    for (const namespace of namespaces) {
      try {
        const translationModule = await import(`./locales/${locale}/${namespace}.json`)
        translations[locale][namespace] = translationModule.default || translationModule
      } catch (error) {
        issues.push({
          severity: 'critical',
          type: 'missing_key',
          namespace,
          locale,
          key: '*',
          message: `Failed to load ${namespace}.json for ${locale}`,
          suggestion: `Create missing translation file: src/i18n/locales/${locale}/${namespace}.json`
        })
        translations[locale][namespace] = {}
      }
    }
  }
  
  // Get reference locale (English) key structure
  const referenceLocale = routing.defaultLocale as SupportedLocale
  const referenceKeys = extractAllKeysFromTranslations(translations[referenceLocale])
  totalKeys = referenceKeys.length
  
  // Check each locale against reference
  for (const locale of routing.locales) {
    if (locale === referenceLocale) continue
    
    const localeKeys = extractAllKeysFromTranslations(translations[locale])
    const localeKeySet = new Set(localeKeys)
    
    // Find missing keys
    for (const refKey of referenceKeys) {
      if (!localeKeySet.has(refKey)) {
        missingKeys++
        const [namespace, ...keyParts] = refKey.split('.')
        
        issues.push({
          severity: 'warning',
          type: 'missing_key',
          namespace: namespace as TranslationNamespace,
          locale,
          key: keyParts.join('.'),
          message: `Missing translation for key: ${refKey}`,
          suggestion: `Add translation for "${refKey}" in ${locale}/${namespace}.json`
        })
      }
    }
    
    // Check for empty values
    for (const key of localeKeys) {
      const value = getNestedValue(translations[locale], key)
      if (typeof value === 'string' && value.trim() === '') {
        const [namespace, ...keyParts] = key.split('.')
        
        issues.push({
          severity: 'warning',
          type: 'empty_value',
          namespace: namespace as TranslationNamespace,
          locale,
          key: keyParts.join('.'),
          message: `Empty translation value for: ${key}`,
          suggestion: `Provide translation for "${key}" in ${locale}`
        })
      }
    }
  }
  
  // Calculate health score
  const completenessPercentage = totalKeys > 0 ? Math.round(((totalKeys - missingKeys) / totalKeys) * 100) : 100
  const criticalIssues = issues.filter(i => i.severity === 'critical').length
  const warningIssues = issues.filter(i => i.severity === 'warning').length
  
  let score = completenessPercentage
  score -= criticalIssues * 10 // Each critical issue reduces score by 10
  score -= warningIssues * 2   // Each warning reduces score by 2
  score = Math.max(0, Math.min(100, score))
  
  // Determine overall status
  let status: 'healthy' | 'warning' | 'critical'
  if (criticalIssues > 0 || score < 50) {
    status = 'critical'
  } else if (warningIssues > 5 || score < 90) {
    status = 'warning'
  } else {
    status = 'healthy'
  }
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (missingKeys > 10) {
    recommendations.push(`High number of missing keys (${missingKeys}). Run translation restoration process.`)
  }
  
  if (criticalIssues > 0) {
    recommendations.push('Critical issues detected. Fix missing translation files immediately.')
  }
  
  if (completenessPercentage < 95) {
    recommendations.push('Translation completeness below 95%. Consider adding missing translations.')
  }
  
  if (issues.length === 0) {
    recommendations.push('Translation system is healthy! Consider implementing automated validation in CI/CD.')
  }
  
  const healthReport: TranslationHealthReport = {
    status,
    score,
    timestamp: now,
    summary: {
      totalKeys,
      missingKeys,
      completenessPercentage,
      localesChecked: [...routing.locales],
      namespacesChecked: namespaces
    },
    issues,
    recommendations
  }
  
  // Cache the result
  cachedHealthReport = healthReport
  lastHealthCheck = now
  
  console.log(`🏥 Health check complete: ${status.toUpperCase()} (Score: ${score}/100)`)
  
  return healthReport
}

/**
 * Extract all keys from translation object with dot notation
 */
function extractAllKeysFromTranslations(translations: Record<string, any>): string[] {
  const keys: string[] = []
  
  function extractKeys(obj: any, prefix = '') {
    for (const [key, value] of Object.entries(obj || {})) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'string') {
        keys.push(fullKey)
      } else if (typeof value === 'object' && value !== null) {
        extractKeys(value, fullKey)
      }
    }
  }
  
  extractKeys(translations)
  return keys
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Quick health check for development
 */
export async function quickHealthCheck(): Promise<{ status: string; issues: number; score: number }> {
  const report = await performHealthCheck()
  return {
    status: report.status,
    issues: report.issues.length,
    score: report.score
  }
}

/**
 * Generate health report for display
 */
export function formatHealthReport(report: TranslationHealthReport): string {
  const statusEmoji = report.status === 'healthy' ? '✅' : report.status === 'warning' ? '⚠️' : '❌'
  
  let output = `${statusEmoji} Translation System Health Report\n`
  output += `Score: ${report.score}/100 (${report.status.toUpperCase()})\n`
  output += `Generated: ${new Date(report.timestamp).toLocaleString()}\n\n`
  
  output += `📊 Summary:\n`
  output += `  • Total Keys: ${report.summary.totalKeys}\n`
  output += `  • Missing Keys: ${report.summary.missingKeys}\n`
  output += `  • Completeness: ${report.summary.completenessPercentage}%\n`
  output += `  • Locales: ${report.summary.localesChecked.join(', ')}\n\n`
  
  if (report.issues.length > 0) {
    output += `⚠️ Issues Found (${report.issues.length}):\n`
    
    const criticalIssues = report.issues.filter(i => i.severity === 'critical')
    const warningIssues = report.issues.filter(i => i.severity === 'warning')
    
    if (criticalIssues.length > 0) {
      output += `\n🔴 Critical Issues (${criticalIssues.length}):\n`
      criticalIssues.slice(0, 5).forEach(issue => {
        output += `  • ${issue.message}\n`
      })
      if (criticalIssues.length > 5) {
        output += `  ... and ${criticalIssues.length - 5} more\n`
      }
    }
    
    if (warningIssues.length > 0) {
      output += `\n🟡 Warnings (${warningIssues.length}):\n`
      warningIssues.slice(0, 5).forEach(issue => {
        output += `  • ${issue.message}\n`
      })
      if (warningIssues.length > 5) {
        output += `  ... and ${warningIssues.length - 5} more\n`
      }
    }
  }
  
  if (report.recommendations.length > 0) {
    output += `\n💡 Recommendations:\n`
    report.recommendations.forEach(rec => {
      output += `  • ${rec}\n`
    })
  }
  
  return output
}

/**
 * Validate specific namespace for missing keys
 */
export async function validateNamespace(
  namespace: TranslationNamespace, 
  locale: SupportedLocale = routing.defaultLocale
): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = []
  
  try {
    const translationModule = await import(`./locales/${locale}/${namespace}.json`)
    const translations = translationModule.default || translationModule
    
    if (!translations || Object.keys(translations).length === 0) {
      issues.push({
        severity: 'critical',
        type: 'missing_key',
        namespace,
        locale,
        key: '*',
        message: `Namespace ${namespace} is empty or missing`,
        suggestion: `Add translations to ${namespace}.json`
      })
    }
    
  } catch (error) {
    issues.push({
      severity: 'critical',
      type: 'missing_key',
      namespace,
      locale,
      key: '*',
      message: `Cannot load namespace ${namespace} for locale ${locale}`,
      suggestion: `Create or fix ${locale}/${namespace}.json file`
    })
  }
  
  return issues
}

/**
 * Development helper: Log health status to console
 */
export async function logHealthStatus(): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const report = await performHealthCheck()
    console.log(formatHealthReport(report))
  }
}

/**
 * Export for build-time validation
 */
export { performHealthCheck as validateTranslationHealth }