// Temporary config without next-intl
import { getRequestConfig } from 'next-intl/server'

// Supported locales - Czech and English only
export const locales = ['cs', 'en'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'cs'

// Temporary export - commented out next-intl config
// When next-intl is re-enabled, uncomment the following:

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validatedLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale
  
  // Load all namespace translations
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
    locale: validatedLocale,
    messages: {
      admin,
      auth,
      common,
      dashboard,
      match,
      navigation,
      player,
      settings,
      statistics
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