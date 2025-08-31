'use client'

// Re-export all next-intl functions without any custom logic
// Note: All hooks are available from next-intl in version 3.26.5+
// Temporary workaround for TypeScript module resolution issues

// @ts-ignore - TypeScript can't find exports but they exist at runtime
export { useTranslations } from 'next-intl'
// @ts-ignore
export { useFormatter } from 'next-intl' 
// @ts-ignore
export { useMessages } from 'next-intl'
// @ts-ignore
export { useNow } from 'next-intl'
// @ts-ignore
export { useTimeZone } from 'next-intl'
// @ts-ignore
export { useLocale } from 'next-intl'