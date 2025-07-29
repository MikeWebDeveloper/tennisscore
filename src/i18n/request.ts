import { getRequestConfig } from 'next-intl/server'
import { 
  validateLocale, 
  loadNamespaceTranslations, 
  createI18nConfig 
} from './shared-config'

/**
 * Next.js i18n request configuration using shared logic
 * This ensures consistency with the client-side configuration
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Validate and normalize the incoming locale
  const locale = validateLocale(await requestLocale)
  
  // Load all namespace translations using shared logic
  const messages = await loadNamespaceTranslations(locale)
  
  // Return standardized configuration
  return createI18nConfig(locale, messages)
})