/**
 * Translation type fix for large message files
 * This resolves TypeScript's type inference truncation issues with next-intl
 */

import { useTranslations as useNextIntlTranslations } from 'next-intl'
import type { Messages } from './messages'

// Create a type-safe wrapper that bypasses TypeScript's truncation
export function useTranslations<T extends keyof Messages>(
  namespace: T
): {
  (key: string): string
  (key: string, values?: Record<string, any>): string
  has(key: string): boolean
  rich(key: string, values?: Record<string, any>): React.ReactNode
  markup(key: string, values?: Record<string, any>): string
} {
  const t = useNextIntlTranslations(namespace)
  
  // Type assertion to bypass the truncated type issue
  return t as any
}

// Alternative direct key access for problematic cases
// Note: This function should not be used directly as it violates React hooks rules
// Use useTranslations hook within components instead
export function getTranslation<T extends keyof Messages>(
  namespace: T,
  key: string,
  values?: Record<string, any>
): string {
  throw new Error('getTranslation cannot be used outside of React components. Use useTranslations hook instead.')
}

// Type-safe key existence checker
// Note: This function should not be used directly as it violates React hooks rules
// Use useTranslations hook within components instead
export function hasTranslationKey<T extends keyof Messages>(
  namespace: T,
  key: string
): boolean {
  throw new Error('hasTranslationKey cannot be used outside of React components. Use useTranslations hook instead.')
}