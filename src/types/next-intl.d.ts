import { routing } from '@/i18n/routing'
import { SHARED_FORMAT_CONFIG } from '@/i18n/shared-config'

// Import the actual messages to get real types, not truncated ones
import type messages from '@/i18n/messages/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
    Formats: typeof SHARED_FORMAT_CONFIG
  }
}

// Re-export the Messages type for convenience
export type Messages = typeof messages