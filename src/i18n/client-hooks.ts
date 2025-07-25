'use client'

// import { useTranslations as useNextIntlTranslations, useLocale } from 'next-intl' // Temporarily disabled
import { useLocaleStore } from '@/stores/localeStore'
import { useEffect } from 'react'
import { useTennisFormatter, useMigrationHelpers, safeTranslation } from './utils'
import { Locale, defaultLocale } from './config'

// Import the real translation function
import { getNestedTranslation } from '@/lib/translations'

// Use real translations instead of mocks
const useNextIntlTranslations = (namespace?: string) => {
  const { locale } = useLocaleStore()
  
  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    let translation = getNestedTranslation(locale, fullKey)
    
    // Handle parameter replacement
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value))
      })
    }
    
    return translation
  }
}

const useLocale = () => {
  const { locale } = useLocaleStore()
  return locale
}

// Enhanced useTranslations hook that provides backward compatibility
export function useTranslations(namespace?: string) {
  const nextIntlT = useNextIntlTranslations(namespace)
  const locale = useLocale() as Locale
  const { setLocale } = useLocaleStore()
  const migrationHelpers = useMigrationHelpers()

  // Sync next-intl locale with zustand store
  useEffect(() => {
    setLocale(locale)
  }, [locale, setLocale])

  // Enhanced translation function with fallbacks
  const t = (key: string, params?: Record<string, string | number>) => {
    try {
      // Handle legacy keys
      if (migrationHelpers.isLegacyKey(key)) {
        const newKey = migrationHelpers.mapLegacyKey(key)
        return safeTranslation(nextIntlT, newKey, key)
      }

      // Handle parameterized translations
      if (params) {
        return nextIntlT(key as never, params as never)
      }

      return nextIntlT(key as never)
    } catch (error) {
      console.warn(`Translation failed for key: ${key}`, error)
      return migrationHelpers.getFallbackTranslation(key)
    }
  }

  return t
}

// Hook for getting all tennis-specific utilities
export function useTennisTranslations() {
  const t = useTranslations()
  const formatter = useTennisFormatter()
  const currentLocale = useLocale() as Locale
  const { locale: storeLocale, setLocale } = useLocaleStore()

  // Sync stores
  useEffect(() => {
    if (storeLocale !== currentLocale) {
      setLocale(currentLocale)
    }
  }, [currentLocale, storeLocale, setLocale])

  return {
    t,
    formatter,
    locale: currentLocale,
    // Tennis-specific translation helpers
    formatDuration: formatter.formatDuration.bind(formatter),
    formatScore: formatter.formatScore.bind(formatter),
    formatWinPercentage: formatter.formatWinPercentage.bind(formatter),
    formatStat: formatter.formatStat.bind(formatter),
    formatMatchResult: formatter.formatMatchResult.bind(formatter),
    formatRelativeTime: formatter.formatRelativeTime.bind(formatter),
    formatCourtSide: formatter.formatCourtSide.bind(formatter),
    formatShotType: formatter.formatShotType.bind(formatter),
  }
}

// Backward compatibility hook that matches the original interface
export function useTranslationsLegacy() {
  const t = useTranslations()
  
  // Return function that matches original signature
  return (key: string) => t(key as string)
}

// Hook for accessing raw next-intl functionality
export function useNextIntl() {
  return {
    useTranslations: useNextIntlTranslations,
    useLocale,
  }
}

// Hook for switching locale (client-side)
export function useLocaleSwitch() {
  const { setLocale } = useLocaleStore()
  const currentLocale = useLocale() as Locale

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    // Trigger page reload to apply new locale
    window.location.reload()
  }

  return {
    currentLocale,
    switchLocale,
    switchToEnglish: () => switchLocale('en'),
    switchToCzech: () => switchLocale('cs'),
  }
}

// Hook for getting common tennis translations quickly
export function useCommonTranslations() {
  const t = useTranslations('common')
  
  return {
    loading: t('loading'),
    save: t('save'),
    cancel: t('cancel'),
    delete: t('delete'),
    edit: t('edit'),
    create: t('create'),
    share: t('share'),
    back: t('back'),
    close: t('close'),
    confirm: t('confirm'),
    start: t('start'),
    end: t('end'),
    continue: t('continue'),
    next: t('next'),
    undo: t('undo'),
    refresh: t('refresh'),
    view: t('view'),
    copy: t('copy'),
    copied: t('copied'),
    all: t('all'),
    unknown: t('unknown'),
    optional: t('optional'),
  }
}

// Hook for navigation translations
export function useNavigationTranslations() {
  const t = useTranslations('navigation')
  
  return {
    dashboard: t('dashboard'),
    matches: t('matches'),
    players: t('players'),
    profile: t('profile'),
    settings: t('settings'),
    overviewStats: t('overviewStats'),
    matchHistory: t('matchHistory'),
    managePlayers: t('managePlayers'),
  }
}

// Hook for match-related translations
export function useMatchTranslations() {
  const t = useTranslations('match')
  
  return {
    newMatch: t('newMatch'),
    liveScoring: t('liveScoring'),
    matchCompleted: t('matchCompleted'),
    winner: t('winner'),
    score: t('score'),
    sets: t('sets'),
    games: t('games'),
    points: t('points'),
    singles: t('singles'),
    doubles: t('doubles'),
    vs: t('vs'),
    live: t('live'),
    server: t('server'),
    game: t('game'),
    tiebreak: t('tiebreak'),
    deuce: t('deuce'),
    ace: t('ace'),
    doubleFault: t('doubleFault'),
  }
}