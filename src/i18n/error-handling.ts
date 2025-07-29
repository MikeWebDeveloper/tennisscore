/**
 * Error handling and fallback strategies for i18n system
 * Provides graceful degradation when translations fail to load
 */

import { routing } from './routing'
import type { SupportedLocale, TranslationNamespace } from './shared-config'

/**
 * Fallback translations for critical UI elements
 * Used when translation loading fails completely
 */
export const EMERGENCY_FALLBACKS = {
  common: {
    save: 'Save',
    cancel: 'Cancel', 
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    yes: 'Yes',
    no: 'No'
  },
  navigation: {
    dashboard: 'Dashboard',
    matches: 'Matches',
    players: 'Players', 
    statistics: 'Statistics',
    settings: 'Settings'
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password'
  }
} as const

/**
 * Error types for translation loading
 */
export type TranslationError = 
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR' 
  | 'FILE_NOT_FOUND'
  | 'NAMESPACE_MISSING'
  | 'INVALID_LOCALE'
  | 'UNKNOWN_ERROR'

/**
 * Error details for debugging
 */
export interface TranslationErrorDetails {
  type: TranslationError
  locale: string
  namespace?: TranslationNamespace
  message: string
  originalError?: Error
  timestamp: number
}

/**
 * Error reporting for development and monitoring
 */
class TranslationErrorReporter {
  private errors: TranslationErrorDetails[] = []
  private maxErrors = 100 // Prevent memory leaks

  report(error: TranslationErrorDetails) {
    this.errors.push(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🌐 Translation Error:', error)
    }

    // TODO: Send to monitoring service in production
    // if (process.env.NODE_ENV === 'production') {
    //   sendToMonitoring(error)
    // }
  }

  getRecentErrors(count = 10): TranslationErrorDetails[] {
    return this.errors.slice(-count)
  }

  clearErrors() {
    this.errors = []
  }
}

export const translationErrorReporter = new TranslationErrorReporter()

/**
 * Safe translation loader with error handling
 */
export async function safeLoadTranslation(
  locale: SupportedLocale, 
  namespace: TranslationNamespace
): Promise<Record<string, any>> {
  try {
    const result = await import(`./locales/${locale}/${namespace}.json`)
    return result.default || {}
  } catch (error) {
    const errorDetails: TranslationErrorDetails = {
      type: error instanceof Error && error.message.includes('Cannot resolve module') 
        ? 'FILE_NOT_FOUND' 
        : 'UNKNOWN_ERROR',
      locale,
      namespace,
      message: error instanceof Error ? error.message : 'Unknown error',
      originalError: error instanceof Error ? error : undefined,
      timestamp: Date.now()
    }

    translationErrorReporter.report(errorDetails)

    // Return fallback or empty object
    if (namespace in EMERGENCY_FALLBACKS) {
      return EMERGENCY_FALLBACKS[namespace as keyof typeof EMERGENCY_FALLBACKS]
    }

    return {}
  }
}

/**
 * Graceful namespace loading with fallbacks
 */
export async function loadNamespaceWithFallbacks(
  locale: SupportedLocale, 
  namespace: TranslationNamespace
): Promise<Record<string, any>> {
  // Try primary locale
  const primaryResult = await safeLoadTranslation(locale, namespace)
  
  // If primary locale failed and we're not on default locale, try default locale
  if (Object.keys(primaryResult).length === 0 && locale !== routing.defaultLocale) {
    const fallbackResult = await safeLoadTranslation(routing.defaultLocale, namespace)
    
    if (Object.keys(fallbackResult).length > 0) {
      translationErrorReporter.report({
        type: 'NAMESPACE_MISSING',
        locale,
        namespace,
        message: `Using ${routing.defaultLocale} fallback for ${namespace}`,
        timestamp: Date.now()
      })
      
      return fallbackResult
    }
  }

  return primaryResult
}

/**
 * Validate locale and provide fallback
 */
export function validateLocaleWithFallback(locale: string | undefined): SupportedLocale {
  if (!locale || !routing.locales.includes(locale as SupportedLocale)) {
    if (locale) {
      translationErrorReporter.report({
        type: 'INVALID_LOCALE',
        locale,
        message: `Invalid locale ${locale}, falling back to ${routing.defaultLocale}`,
        timestamp: Date.now()
      })
    }
    
    return routing.defaultLocale
  }
  
  return locale as SupportedLocale
}

/**
 * Translation health check for monitoring
 */
export interface TranslationHealthStatus {
  isHealthy: boolean
  loadedNamespaces: string[]
  failedNamespaces: string[]
  recentErrors: TranslationErrorDetails[]
  lastCheck: number
}

export async function checkTranslationHealth(locale: SupportedLocale): Promise<TranslationHealthStatus> {
  const namespaces = ['common', 'navigation', 'auth'] as const // Critical namespaces
  const results = await Promise.allSettled(
    namespaces.map(ns => safeLoadTranslation(locale, ns))
  )

  const loadedNamespaces: string[] = []
  const failedNamespaces: string[] = []

  results.forEach((result, index) => {
    const namespace = namespaces[index]
    if (result.status === 'fulfilled' && Object.keys(result.value).length > 0) {
      loadedNamespaces.push(namespace)
    } else {
      failedNamespaces.push(namespace)
    }
  })

  return {
    isHealthy: failedNamespaces.length === 0,
    loadedNamespaces,
    failedNamespaces,
    recentErrors: translationErrorReporter.getRecentErrors(),
    lastCheck: Date.now()
  }
}

/**
 * React Error Boundary helper for translation errors
 */
export class TranslationErrorBoundary extends Error {
  constructor(
    message: string,
    public readonly translationError: TranslationErrorDetails
  ) {
    super(message)
    this.name = 'TranslationErrorBoundary'
  }
}

/**
 * Utility to safely get translation with fallbacks
 */
export function safeGetTranslation(
  translations: Record<string, any>,
  key: string,
  fallback?: string
): string {
  try {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        value = undefined
        break
      }
    }
    
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
    
    // Fallback strategies
    if (fallback) return fallback
    if (key.includes('.')) return key.split('.').pop() || key
    return key
    
  } catch (error) {
    translationErrorReporter.report({
      type: 'UNKNOWN_ERROR',
      locale: 'unknown',
      message: `Failed to get translation for key: ${key}`,
      originalError: error instanceof Error ? error : undefined,
      timestamp: Date.now()
    })
    
    return fallback || key
  }
}

/**
 * Development helper to validate translation usage
 */
export function validateTranslationKey(key: string, namespace?: string): boolean {
  // Basic validation rules
  const validKeyPattern = /^[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/
  const hasValidStructure = validKeyPattern.test(key)
  
  if (!hasValidStructure) {
    console.warn(`🌐 Invalid translation key format: ${key}`)
    return false
  }
  
  // Namespace validation
  if (namespace && !key.startsWith(namespace)) {
    console.warn(`🌐 Translation key "${key}" doesn't match namespace "${namespace}"`)
  }
  
  return true
}