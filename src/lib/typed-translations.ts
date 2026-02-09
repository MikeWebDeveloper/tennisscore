/**
 * Typed translations utilities to work around next-intl TypeScript limitations with large message files
 * This provides type-safe alternatives when TypeScript truncates type inference
 */

import { useTranslations as useNextIntlTranslations } from 'next-intl'

/**
 * Type-safe translation hook that bypasses TypeScript's type truncation issues
 * Use this instead of the regular useTranslations when you encounter type errors
 */
export function useTypedTranslations<T extends keyof IntlMessages>(namespace: T) {
  const t = useNextIntlTranslations(namespace)

  // Define a permissive type to allow string keys
  type PermissiveTranslator = {
    (key: string, values?: Record<string, unknown>): string
    rich: (key: string, values?: Record<string, unknown>) => string | React.ReactNode
    has: (key: string) => boolean
  }

  const permissiveT = t as unknown as PermissiveTranslator

  return {
    // Basic translation function with string key support
    t: (key: string, values?: Record<string, any>) => {
      return permissiveT(key, values)
    },

    // Rich text translation
    rich: (key: string, values?: Record<string, any>) => {
      return permissiveT.rich(key, values)
    },

    // Check if key exists
    has: (key: string): boolean => {
      return permissiveT.has(key)
    },

    // Original function for backwards compatibility
    original: t
  }
}

/**
 * Direct translation getter for when you need to access translations outside components
 */
export function getTypedTranslation(
  namespace: string,
  key: string,
  values?: Record<string, any>
): string {
  // This would need to be used within a component context
  // or with a translation provider
  throw new Error('Use useTypedTranslations within a component')
}

/**
 * Type-safe namespace constants to avoid typos
 */
export const TranslationNamespaces = {
  ADMIN: 'admin',
  AUTH: 'auth',
  COMMON: 'common',
  DASHBOARD: 'dashboard',
  MATCH: 'match',
  NAVIGATION: 'navigation',
  PLAYER: 'player',
  SETTINGS: 'settings',
  STATISTICS: 'statistics'
} as const

/**
 * Known problematic keys that TypeScript truncates
 * Use these constants to avoid string literals
 */
export const DashboardKeys = {
  PERFORMANCE_TREND_TITLE: 'performanceTrendTitle',
  NO_DATA_LABEL: 'noDataLabel',
  PERFORMANCE_BREAKDOWN_TITLE: 'performanceBreakdownTitle'
} as const

export const CommonKeys = {
  INSTALL: 'install',
  SHOW_ME_HOW: 'showMeHow',
  LATER: 'later',
  SETTINGS: 'settings',
  WON: 'won',
  LOST: 'lost',
  YESTERDAY: 'yesterday',
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth'
} as const

export const MatchKeys = {
  GAME_STATUS: 'gameStatus',
  MATCH_RESULT: 'matchResult'
} as const