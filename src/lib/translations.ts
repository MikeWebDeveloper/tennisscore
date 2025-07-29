import type { Locale } from '@/i18n/config'

// Import English translation files
import enCommon from '@/i18n/locales/en/common.json'
import enNavigation from '@/i18n/locales/en/navigation.json'
import enAuth from '@/i18n/locales/en/auth.json'
import enMatch from '@/i18n/locales/en/match.json'
import enDashboard from '@/i18n/locales/en/dashboard.json'
import enPlayer from '@/i18n/locales/en/player.json'
import enStatistics from '@/i18n/locales/en/statistics.json'
import enSettings from '@/i18n/locales/en/settings.json'
import enAdmin from '@/i18n/locales/en/admin.json'

// Import Czech translation files
import csCommon from '@/i18n/locales/cs/common.json'
import csNavigation from '@/i18n/locales/cs/navigation.json'
import csAuth from '@/i18n/locales/cs/auth.json'
import csMatch from '@/i18n/locales/cs/match.json'
import csDashboard from '@/i18n/locales/cs/dashboard.json'
import csPlayer from '@/i18n/locales/cs/player.json'
import csStatistics from '@/i18n/locales/cs/statistics.json'
import csSettings from '@/i18n/locales/cs/settings.json'
import csAdmin from '@/i18n/locales/cs/admin.json'

// Create properly namespaced translations for supported locales
const namespacedTranslations = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    match: enMatch,
    dashboard: enDashboard,
    player: enPlayer,
    statistics: enStatistics,
    settings: enSettings,
    admin: enAdmin,
  },
  cs: {
    common: csCommon,
    navigation: csNavigation,
    auth: csAuth,
    match: csMatch,
    dashboard: csDashboard,
    player: csPlayer,
    statistics: csStatistics,
    settings: csSettings,
    admin: csAdmin,
  },
} as const

// Keep the flat structure for backward compatibility
const translations = namespacedTranslations

export type TranslationKeys = keyof typeof translations.en

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.en
}

export function getNestedTranslation(locale: Locale, path: string): string {
  const messages = getTranslations(locale)
  const keys = path.split('.')
  
  let value: any = messages
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) break
  }
  
  // Fallback to English if translation not found
  if (value === undefined && locale !== 'en') {
    const enMessages = translations.en
    value = keys.reduce((acc: any, key) => acc?.[key], enMessages)
  }
  
  // Return the path if still not found (for debugging)
  return value ?? path
}

export { translations }