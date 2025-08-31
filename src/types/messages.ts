/**
 * Message type utilities for better TypeScript integration with large translation files
 * This provides type-safe alternatives when TypeScript truncates key inference
 */

import type messagesEn from '@/i18n/messages/en.json'

// Create explicit type aliases to help with TypeScript performance
export type Messages = typeof messagesEn

// Extract namespace types for better organization
export type AdminMessages = Messages['admin']
export type AuthMessages = Messages['auth']
export type CommonMessages = Messages['common']
export type DashboardMessages = Messages['dashboard']
export type MatchMessages = Messages['match']
export type NavigationMessages = Messages['navigation']
export type PlayerMessages = Messages['player']
export type SettingsMessages = Messages['settings']
export type StatisticsMessages = Messages['statistics']

// Helper type to extract keys from nested namespaces
export type MessageKeys<T> = keyof T extends string ? keyof T : never

// Utility to check if a key exists in a namespace
export type HasKey<T, K extends string> = K extends keyof T ? true : false

// Type-safe key extraction for specific namespaces
export type AdminKeys = MessageKeys<AdminMessages>
export type AuthKeys = MessageKeys<AuthMessages>
export type CommonKeys = MessageKeys<CommonMessages>
export type DashboardKeys = MessageKeys<DashboardMessages>
export type MatchKeys = MessageKeys<MatchMessages>
export type NavigationKeys = MessageKeys<NavigationMessages>
export type PlayerKeys = MessageKeys<PlayerMessages>
export type SettingsKeys = MessageKeys<SettingsMessages>
export type StatisticsKeys = MessageKeys<StatisticsMessages>

// Helper to validate translation key paths at compile time
export type ValidateTranslationPath<
  Namespace extends keyof Messages,
  Key extends string
> = Key extends keyof Messages[Namespace] 
  ? `${Namespace}.${Key}` 
  : never

// Type-safe translation function signature
export interface TypeSafeTranslations {
  <Namespace extends keyof Messages>(namespace: Namespace): {
    (key: keyof Messages[Namespace]): string
    (key: keyof Messages[Namespace], values: Record<string, any>): string
    has(key: string): key is Extract<keyof Messages[Namespace], string>
    rich<K extends keyof Messages[Namespace]>(
      key: K,
      values?: Record<string, any>
    ): React.ReactNode
  }
}