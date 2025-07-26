// Temporary config without next-intl
import { getRequestConfig } from 'next-intl/server'

// Supported locales
export const locales = ['en', 'cs', 'es', 'fr', 'de', 'it', 'pt', 'ru'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Temporary export - commented out next-intl config
// When next-intl is re-enabled, uncomment the following:

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validatedLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale
  
  return {
    locale: validatedLocale,
    messages: {
      ...(await import(`./locales/${validatedLocale}/common.json`)).default,
      ...(await import(`./locales/${validatedLocale}/navigation.json`)).default,
      ...(await import(`./locales/${validatedLocale}/auth.json`)).default,
      ...(await import(`./locales/${validatedLocale}/match.json`)).default,
      ...(await import(`./locales/${validatedLocale}/dashboard.json`)).default,
      ...(await import(`./locales/${validatedLocale}/player.json`)).default,
      ...(await import(`./locales/${validatedLocale}/statistics.json`)).default,
      ...(await import(`./locales/${validatedLocale}/admin.json`)).default,
    },
    // Enable fallback to default locale
    defaultTranslationValues: {
      br: () => '<br />',
      strong: (chunks: React.ReactNode) => `<strong>${chunks}</strong>`,
      em: (chunks: React.ReactNode) => `<em>${chunks}</em>`,
    },
    // Number and date formatting
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        long: {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        },
        time: {
          hour: 'numeric',
          minute: 'numeric',
        },
      },
      number: {
        percentage: {
          style: 'percent',
          maximumFractionDigits: 1,
        },
        decimal: {
          style: 'decimal',
          maximumFractionDigits: 2,
        },
      },
    },
    // Tennis-specific formatting
    timeZone: 'UTC',
  }
})