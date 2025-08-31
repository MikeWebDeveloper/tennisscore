/**
 * Next-intl TypeScript workaround for large message files
 * 
 * This addresses the issue where TypeScript truncates message keys in large JSON files,
 * causing "is not assignable to parameter of type" errors for perfectly valid translation keys.
 */

// Temporarily override MessageKeys to allow any string key for large translation files
declare module 'use-intl' {
  namespace useIntl {
    // Make MessageKeys more permissive to handle truncation issues
    type MessageKeys<
      Messages = any,
      Key extends keyof Messages = keyof Messages
    > = string
  }
}

// Global type augmentation for next-intl's useTranslations hook
declare module 'next-intl' {
  function useTranslations<Namespace extends keyof IntlMessages>(
    namespace: Namespace
  ): (key: string, values?: any) => string
  
  function useTranslations(): (key: string, values?: any) => string
}