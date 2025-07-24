import { Locale, Translations } from './types'
import { en } from './en'
import { cs } from './cs'

export * from './types'

export const translations = {
  en,
  cs
} as const

// Small helper function to get translations with type safety
export function getTranslations(locale: Locale): Translations {
  return translations[locale]
}

export function t(locale: Locale, key: keyof Translations): string {
  return translations[locale][key] || translations.en[key]
}