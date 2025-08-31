// Main exports for the i18n system
export { routing } from './routing'
export type { SupportedLocale } from './routing'
// DEPRECATED: Legacy types removed in favor of proper next-intl AppConfig augmentation
// See: src/types/next-intl.d.ts

// Navigation exports
export { Link, redirect, usePathname, useRouter } from './navigation'
export type { Pathnames, Pathname } from './navigation'

// Re-export all next-intl functions
// Note: All hooks are available from next-intl in version 3.26.5+
// Temporary workaround for TypeScript module resolution issues

// @ts-ignore - TypeScript can't find exports but they exist at runtime
export { useTranslations } from 'next-intl'
// @ts-ignore
export { useLocale } from 'next-intl'
// @ts-ignore
export { useNow } from 'next-intl'
// @ts-ignore
export { useTimeZone } from 'next-intl'
// @ts-ignore
export { useFormatter } from 'next-intl'
// @ts-ignore
export { useMessages } from 'next-intl'

// Configuration exports
export { default as i18nConfig } from './request'