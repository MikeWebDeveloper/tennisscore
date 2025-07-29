import { ReactNode } from 'react'
import { routing } from './routing'

/**
 * Shared i18n configuration for consistent translation loading
 * Used by both config.ts and request.ts to ensure single source of truth
 */

export type SupportedLocale = typeof routing.locales[number]

/**
 * All available translation namespaces
 * Add new namespaces here and update loadNamespaceTranslations function
 */
export const TRANSLATION_NAMESPACES = [
  'admin',
  'auth', 
  'common',
  'dashboard',
  'match',
  'navigation',
  'player',
  'settings',
  'statistics'
] as const

export type TranslationNamespace = typeof TRANSLATION_NAMESPACES[number]

/**
 * Validate and normalize locale to ensure it's supported
 */
export function validateLocale(locale: string | undefined): SupportedLocale {
  if (!locale || !routing.locales.includes(locale as SupportedLocale)) {
    return routing.defaultLocale
  }
  return locale as SupportedLocale
}

/**
 * Load all namespace translations for a given locale
 * Dynamically imports all translation files and returns organized structure
 */
export async function loadNamespaceTranslations(validatedLocale: SupportedLocale) {
  // Load all namespace translations in parallel for optimal performance
  const [
    admin,
    auth,
    common,
    dashboard,
    match,
    navigation,
    player,
    settings,
    statistics
  ] = await Promise.all([
    import(`./locales/${validatedLocale}/admin.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/auth.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/common.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/dashboard.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/match.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/navigation.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/player.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/settings.json`).then(m => m.default),
    import(`./locales/${validatedLocale}/statistics.json`).then(m => m.default),
  ])

  return {
    admin,
    auth,
    common,
    dashboard,
    match,
    navigation,
    player,
    settings,
    statistics
  }
}

/**
 * Shared translation format configuration for consistent formatting
 * across the application - dates, numbers, tennis-specific formats
 */
export const SHARED_FORMAT_CONFIG = {
  // Date and time formatting for tennis match scheduling
  dateTime: {
    short: {
      day: 'numeric' as const,
      month: 'short' as const,
      year: 'numeric' as const,
    },
    long: {
      day: 'numeric' as const,
      month: 'long' as const,
      year: 'numeric' as const,
      hour: 'numeric' as const,
      minute: 'numeric' as const,
    },
    time: {
      hour: 'numeric' as const,
      minute: 'numeric' as const,
    },
  },
  // Number formatting for tennis statistics
  number: {
    percentage: {
      style: 'percent' as const,
      maximumFractionDigits: 1,
    },
    decimal: {
      style: 'decimal' as const,
      maximumFractionDigits: 2,
    },
  },
}

/**
 * Shared default translation values for consistent rich text formatting
 * Supports HTML-like tags in translations for emphasis and structure
 */
export const SHARED_DEFAULT_TRANSLATION_VALUES = {
  br: () => '<br />',
  strong: (chunks: ReactNode) => `<strong>${chunks}</strong>`,
  em: (chunks: ReactNode) => `<em>${chunks}</em>`,
}

/**
 * Utility function to create consistent i18n configuration
 * Used by both server and client configurations
 */
export function createI18nConfig(locale: SupportedLocale, messages: Record<string, any>) {
  return {
    locale,
    messages,
    defaultTranslationValues: SHARED_DEFAULT_TRANSLATION_VALUES,
    formats: SHARED_FORMAT_CONFIG,
    timeZone: 'UTC' as const, // Tennis matches often international
  }
}

/**
 * Development helper to validate translation completeness
 * Checks if all namespaces have been loaded correctly
 */
export function validateTranslationCompleteness(messages: Record<string, any>): {
  isComplete: boolean
  missingNamespaces: string[]
  totalKeys: number
} {
  const missingNamespaces = TRANSLATION_NAMESPACES.filter(
    namespace => !messages[namespace] || Object.keys(messages[namespace]).length === 0
  )
  
  const totalKeys = Object.values(messages).reduce(
    (sum, namespace) => sum + (typeof namespace === 'object' ? Object.keys(namespace).length : 0), 
    0
  )

  return {
    isComplete: missingNamespaces.length === 0,
    missingNamespaces,
    totalKeys
  }
}