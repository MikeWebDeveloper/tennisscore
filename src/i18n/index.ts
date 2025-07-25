// Main exports for the i18n system
export { locales, defaultLocale } from './config'
export type { Locale } from './config'
export type { Messages, MessageKeys } from './types'

// Navigation exports
export { Link, redirect, usePathname, useRouter } from './navigation'
export type { Pathnames, Pathname } from './navigation'

// Client-side hooks
export {
  useTranslations,
  useTennisTranslations,
  useTranslationsLegacy,
  useNextIntl,
  useLocaleSwitch,
  useCommonTranslations,
  useNavigationTranslations,
  useMatchTranslations,
} from './client-hooks'

// Utilities
export {
  TennisFormatter,
  useTennisFormatter,
  MigrationHelpers,
  useMigrationHelpers,
  safeTranslation,
  formatMessage,
  validateMessageParams,
  formatMatchDate,
  formatTennisNumber,
} from './utils'

// Re-export next-intl server functions for server components - temporarily disabled
// export { useTranslations as useServerTranslations, useLocale as useServerLocale } from 'next-intl'

// Temporary mock exports
export const useServerTranslations = () => (key: string) => key
export const useServerLocale = () => 'en'

// Configuration exports
export { default as i18nConfig } from './config'