// Main exports for the i18n system
export { locales, defaultLocale } from './config'
export type { Locale } from './config'
export type { Messages, MessageKeys } from './types'

// Navigation exports
export { Link, redirect, usePathname, useRouter } from './navigation'
export type { Pathnames, Pathname } from './navigation'

// Re-export all next-intl functions
export {
  useTranslations,
  useLocale,
  useNow,
  useTimeZone,
  useFormatter,
  useMessages,
} from 'next-intl'

// Configuration exports
export { default as i18nConfig } from './config'