// import { getRequestConfig } from 'next-intl/server' // Temporarily disabled
import { headers } from 'next/headers'
import { locales, defaultLocale } from './config'

// Get locale from various sources
async function getLocaleFromRequest(): Promise<string> {
  // Get headers
  const headersList = await headers()
  
  // Check for explicit locale in header (set by middleware)
  const explicitLocale = headersList.get('x-locale')
  if (explicitLocale && locales.includes(explicitLocale as typeof locales[number])) {
    return explicitLocale
  }

  // Check Accept-Language header
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    // Parse Accept-Language header and find best match
    const preferredLocales = acceptLanguage
      .split(',')
      .map((lang: string) => lang.split(';')[0].trim().toLowerCase())
      .map((lang: string) => {
        // Handle region variants (e.g., 'cs-CZ' -> 'cs')
        return lang.split('-')[0]
      })

    for (const preferred of preferredLocales) {
      if (locales.includes(preferred as typeof locales[number])) {
        return preferred
      }
    }
  }

  return defaultLocale
}

// Temporarily disabled - export a mock function
// export default getRequestConfig(async () => {
//   const locale = await getLocaleFromRequest()

//   return {
//     locale,
//     messages: {
//       ...(await import(`./locales/${locale}/common.json`)).default,
//       ...(await import(`./locales/${locale}/navigation.json`)).default,
//       ...(await import(`./locales/${locale}/auth.json`)).default,
//       ...(await import(`./locales/${locale}/match.json`)).default,
//       ...(await import(`./locales/${locale}/dashboard.json`)).default,
//       ...(await import(`./locales/${locale}/player.json`)).default,
//       ...(await import(`./locales/${locale}/statistics.json`)).default,
//     },
//   }
// })

// Export the locale getter for other uses
export { getLocaleFromRequest }

// Placeholder export
export default {}