// import { useTranslations, useLocale, useFormatter } from 'next-intl' // Temporarily disabled
import { Locale, defaultLocale } from './config'

// Temporary mocks while next-intl is disabled
const useTranslations = () => (key: string) => key
const useLocale = () => defaultLocale
const useFormatter = () => ({
  number: (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(defaultLocale, options).format(value)
  },
  dateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(defaultLocale, options).format(date)
  }
})

// Tennis-specific formatting utilities
export class TennisFormatter {
  constructor(
    private t: ReturnType<typeof useTranslations>,
    private format: ReturnType<typeof useFormatter>,
    private locale: Locale
  ) {}

  // Format match duration
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} ${this.t('common.minutes')}`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours} ${this.t('common.hours')}`
    }
    
    return `${hours} ${this.t('common.hours')} ${remainingMinutes} ${this.t('common.minutes')}`
  }

  // Format score display
  formatScore(sets: number[][]): string {
    if (!sets.length) return '0-0'
    
    return sets.map(set => `${set[0]}-${set[1]}`).join(', ')
  }

  // Format win percentage
  formatWinPercentage(wins: number, total: number): string {
    if (total === 0) return '0%'
    const percentage = Math.round((wins / total) * 100)
    return this.format.number(percentage / 100, { style: 'percent', maximumFractionDigits: 0 })
  }

  // Format tennis statistics
  formatStat(value: number, type: 'percentage' | 'decimal' | 'integer' = 'integer'): string {
    switch (type) {
      case 'percentage':
        return this.format.number(value / 100, { style: 'percent', maximumFractionDigits: 1 })
      case 'decimal':
        return this.format.number(value, { maximumFractionDigits: 2 })
      default:
        return this.format.number(value, { maximumFractionDigits: 0 })
    }
  }

  // Format match result
  formatMatchResult(player1Score: number[], player2Score: number[], winner: 1 | 2): string {
    const score = player1Score.map((s, i) => `${s}-${player2Score[i]}`).join(' ')
    const winnerName = winner === 1 ? 'Player 1' : 'Player 2' // This should be actual player names
    return `${winnerName} ${this.t('common.wins')} ${score}`
  }

  // Format relative time for matches
  formatRelativeTime(date: Date): string {
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return this.t('common.today')
    } else if (diffInDays === 1) {
      return this.t('common.yesterday')
    } else if (diffInDays <= 7) {
      return this.t('common.thisWeek')
    } else if (diffInDays <= 30) {
      return this.t('common.thisMonth')
    }
    
    return this.format.dateTime(date, 'short')
  }

  // Format court side for tennis
  formatCourtSide(side: 'deuce' | 'ad'): string {
    return side === 'deuce' ? this.t('match.deuce') : this.t('match.advantage')
  }

  // Format shot type
  formatShotType(shot: string): string {
    const shotMap: Record<string, string> = {
      'forehand': 'Forehand',
      'backhand': 'Backhand', 
      'serve': 'Serve',
      'volley': 'Volley',
      'overhead': 'Overhead'
    }
    return shotMap[shot] || shot
  }
}

// Hook to get tennis formatter
export function useTennisFormatter() {
  const t = useTranslations()
  const format = useFormatter()
  const locale = useLocale() as Locale
  
  return new TennisFormatter(t, format, locale)
}

// Migration helpers for backward compatibility
export class MigrationHelpers {
  constructor(private locale: Locale) {}

  // Map old translation keys to new namespaced keys
  mapLegacyKey(oldKey: string): string {
    const keyMappings: Record<string, string> = {
      // Common mappings
      'loading': 'common.loading',
      'save': 'common.save',
      'cancel': 'common.cancel',
      'delete': 'common.delete',
      'edit': 'common.edit',
      'create': 'common.create',
      'share': 'common.share',
      'back': 'common.back',
      
      // Navigation mappings
      'dashboard': 'navigation.dashboard',
      'matches': 'navigation.matches',
      'players': 'navigation.players',
      'profile': 'navigation.profile',
      'settings': 'navigation.settings',
      
      // Match mappings
      'newMatch': 'match.newMatch',
      'liveScoring': 'match.liveScoring',
      'matchCompleted': 'match.matchCompleted',
      'winner': 'match.winner',
      'score': 'match.score',
      'sets': 'match.sets',
      'games': 'match.games',
      'points': 'match.points',
      
      // Player mappings
      'firstName': 'player.firstName',
      'lastName': 'player.lastName',
      'yearOfBirth': 'player.yearOfBirth',
      'rating': 'player.rating',
      'club': 'player.club',
      'playingHand': 'player.playingHand',
      
      // Statistics mappings
      'statistics': 'statistics.statistics',
      'totalPoints': 'statistics.totalPoints',
      'winners': 'statistics.winners',
      'unforcedErrors': 'statistics.unforcedErrors',
      'aces': 'statistics.aces',
      'doubleFaults': 'statistics.doubleFaults',
      
      // Dashboard mappings
      'welcomeBack': 'dashboard.welcomeBack',
      'welcomeToTennisScore': 'dashboard.welcomeToTennisScore',
      'performanceTrackingStarts': 'dashboard.performanceTrackingStarts',
      'winRate': 'dashboard.winRate',
      'completedMatches': 'dashboard.completedMatches',
      'totalMatches': 'dashboard.totalMatches',
      
      // Auth mappings
      'signIn': 'auth.signIn',
      'signUp': 'auth.signUp',
      'email': 'auth.email',
      'password': 'auth.password',
      'createAccount': 'auth.createAccount'
    }

    return keyMappings[oldKey] || oldKey
  }

  // Get fallback value for missing translations
  getFallbackTranslation(key: string): string {
    // Return the key itself as fallback, or attempt English
    return key.split('.').pop() || key
  }

  // Check if a key exists in new system
  isLegacyKey(key: string): boolean {
    return !key.includes('.')
  }
}

// Hook for migration helpers
export function useMigrationHelpers() {
  const locale = useLocale() as Locale
  return new MigrationHelpers(locale)
}

// Utility to safely get nested translation values
export function safeTranslation(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback?: string
): string {
  try {
    const value = t(key as never)
    if (typeof value === 'string' && value !== key) {
      return value
    }
    return fallback || key
  } catch {
    console.warn(`Translation key not found: ${key}`)
    return fallback || key
  }
}

// Format interpolated messages
export function formatMessage(
  message: string,
  params: Record<string, string | number>
): string {
  return Object.keys(params).reduce((result, key) => {
    const placeholder = `{${key}}`
    return result.replace(new RegExp(placeholder, 'g'), String(params[key]))
  }, message)
}

// Validate message parameters
export function validateMessageParams(
  message: string,
  params: Record<string, string | number>
): boolean {
  const placeholders = message.match(/\{(\w+)\}/g) || []
  const requiredKeys = placeholders.map(p => p.slice(1, -1))
  
  return requiredKeys.every(key => key in params)
}

// Tennis-specific date formatting
export function formatMatchDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Format numbers in a tennis context
export function formatTennisNumber(
  value: number,
  type: 'score' | 'percentage' | 'duration' | 'count',
  locale: Locale
): string {
  const formatter = new Intl.NumberFormat(locale)
  
  switch (type) {
    case 'score':
      return value.toString()
    case 'percentage':
      return `${Math.round(value)}%`
    case 'duration':
      return `${Math.round(value)}min`
    case 'count':
      return formatter.format(value)
    default:
      return formatter.format(value)
  }
}