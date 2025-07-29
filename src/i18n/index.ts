// Main exports for the i18n system
export { routing } from './routing'
export type { SupportedLocale } from './routing'
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
export { default as i18nConfig } from './request'