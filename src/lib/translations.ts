import type { Locale } from '@/i18n/config'

// Import all translation files
import enCommon from '@/i18n/locales/en/common.json'
import enNavigation from '@/i18n/locales/en/navigation.json'
import enAuth from '@/i18n/locales/en/auth.json'
import enMatch from '@/i18n/locales/en/match.json'
import enDashboard from '@/i18n/locales/en/dashboard.json'
import enPlayer from '@/i18n/locales/en/player.json'
import enStatistics from '@/i18n/locales/en/statistics.json'

import csCommon from '@/i18n/locales/cs/common.json'
import csNavigation from '@/i18n/locales/cs/navigation.json'
import csAuth from '@/i18n/locales/cs/auth.json'
import csMatch from '@/i18n/locales/cs/match.json'
import csDashboard from '@/i18n/locales/cs/dashboard.json'
import csPlayer from '@/i18n/locales/cs/player.json'
import csStatistics from '@/i18n/locales/cs/statistics.json'

import esCommon from '@/i18n/locales/es/common.json'
import esNavigation from '@/i18n/locales/es/navigation.json'
import esAuth from '@/i18n/locales/es/auth.json'
import esMatch from '@/i18n/locales/es/match.json'
import esDashboard from '@/i18n/locales/es/dashboard.json'
import esPlayer from '@/i18n/locales/es/player.json'
import esStatistics from '@/i18n/locales/es/statistics.json'

import frCommon from '@/i18n/locales/fr/common.json'
import frNavigation from '@/i18n/locales/fr/navigation.json'
import frAuth from '@/i18n/locales/fr/auth.json'
import frMatch from '@/i18n/locales/fr/match.json'
import frDashboard from '@/i18n/locales/fr/dashboard.json'
import frPlayer from '@/i18n/locales/fr/player.json'
import frStatistics from '@/i18n/locales/fr/statistics.json'

import deCommon from '@/i18n/locales/de/common.json'
import deNavigation from '@/i18n/locales/de/navigation.json'
import deAuth from '@/i18n/locales/de/auth.json'
import deMatch from '@/i18n/locales/de/match.json'
import deDashboard from '@/i18n/locales/de/dashboard.json'
import dePlayer from '@/i18n/locales/de/player.json'
import deStatistics from '@/i18n/locales/de/statistics.json'

import itCommon from '@/i18n/locales/it/common.json'
import itNavigation from '@/i18n/locales/it/navigation.json'
import itAuth from '@/i18n/locales/it/auth.json'
import itMatch from '@/i18n/locales/it/match.json'
import itDashboard from '@/i18n/locales/it/dashboard.json'
import itPlayer from '@/i18n/locales/it/player.json'
import itStatistics from '@/i18n/locales/it/statistics.json'

import ptCommon from '@/i18n/locales/pt/common.json'
import ptNavigation from '@/i18n/locales/pt/navigation.json'
import ptAuth from '@/i18n/locales/pt/auth.json'
import ptMatch from '@/i18n/locales/pt/match.json'
import ptDashboard from '@/i18n/locales/pt/dashboard.json'
import ptPlayer from '@/i18n/locales/pt/player.json'
import ptStatistics from '@/i18n/locales/pt/statistics.json'

import ruCommon from '@/i18n/locales/ru/common.json'
import ruNavigation from '@/i18n/locales/ru/navigation.json'
import ruAuth from '@/i18n/locales/ru/auth.json'
import ruMatch from '@/i18n/locales/ru/match.json'
import ruDashboard from '@/i18n/locales/ru/dashboard.json'
import ruPlayer from '@/i18n/locales/ru/player.json'
import ruStatistics from '@/i18n/locales/ru/statistics.json'

// Create properly namespaced translations
const namespacedTranslations = {
  en: {
    common: enCommon.common,
    navigation: enNavigation.navigation,
    auth: enAuth.auth,
    match: enMatch.match,
    dashboard: enDashboard.dashboard,
    player: enPlayer.player,
    statistics: enStatistics.statistics,
  },
  cs: {
    common: csCommon.common,
    navigation: csNavigation.navigation,
    auth: csAuth.auth,
    match: csMatch.match,
    dashboard: csDashboard.dashboard,
    player: csPlayer.player,
    statistics: csStatistics.statistics,
  },
  es: {
    common: esCommon.common,
    navigation: esNavigation.navigation,
    auth: esAuth.auth,
    match: esMatch.match,
    dashboard: esDashboard.dashboard,
    player: esPlayer.player,
    statistics: esStatistics.statistics,
  },
  fr: {
    common: frCommon.common,
    navigation: frNavigation.navigation,
    auth: frAuth.auth,
    match: frMatch.match,
    dashboard: frDashboard.dashboard,
    player: frPlayer.player,
    statistics: frStatistics.statistics,
  },
  de: {
    common: deCommon.common,
    navigation: deNavigation.navigation,
    auth: deAuth.auth,
    match: deMatch.match,
    dashboard: deDashboard.dashboard,
    player: dePlayer.player,
    statistics: deStatistics.statistics,
  },
  it: {
    common: itCommon.common,
    navigation: itNavigation.navigation,
    auth: itAuth.auth,
    match: itMatch.match,
    dashboard: itDashboard.dashboard,
    player: itPlayer.player,
    statistics: itStatistics.statistics,
  },
  pt: {
    common: ptCommon.common,
    navigation: ptNavigation.navigation,
    auth: ptAuth.auth,
    match: ptMatch.match,
    dashboard: ptDashboard.dashboard,
    player: ptPlayer.player,
    statistics: ptStatistics.statistics,
  },
  ru: {
    common: ruCommon.common,
    navigation: ruNavigation.navigation,
    auth: ruAuth.auth,
    match: ruMatch.match,
    dashboard: ruDashboard.dashboard,
    player: ruPlayer.player,
    statistics: ruStatistics.statistics,
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