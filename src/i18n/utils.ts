import { useLocale, useFormatter } from 'next-intl'
import { useTranslations } from '@/i18n'
import { routing } from './routing'
import type { SupportedLocale } from './routing'

// Tennis-specific formatting utilities
export class TennisFormatter {
  constructor(
    private t: ReturnType<typeof useTranslations>,
    private format: ReturnType<typeof useFormatter>,
    private locale: SupportedLocale
  ) {}

  // Format match duration
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} ${this.t('common.minutes')}`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours}${this.t('common.hours')}`
    }
    return `${hours}${this.t('common.hours')} ${remainingMinutes}${this.t('common.minutes')}`
  }

  // Format tennis score
  formatScore(score: { player1: number; player2: number }): string {
    return `${score.player1} : ${score.player2}`
  }

  // Format serve statistics
  formatServePercentage(made: number, total: number): string {
    if (total === 0) return '0%'
    const percentage = Math.round((made / total) * 100)
    return `${percentage}% (${made}/${total})`
  }

  // Format break point statistics
  formatBreakPoints(converted: number, opportunities: number): string {
    if (opportunities === 0) return this.t('statistics.noneOffered')
    const percentage = Math.round((converted / opportunities) * 100)
    return `${converted}/${opportunities} (${percentage}%)`
  }

  // Format rally length
  formatRallyLength(length: number): string {
    return this.t('statistics.rallyLength', { length })
  }

  // Format point outcome
  formatPointOutcome(outcome: string): string {
    const outcomeMap: Record<string, string> = {
      'winner': this.t('match.winner'),
      'forced_error': this.t('match.forcedError'),
      'unforced_error': this.t('match.unforcedError'),
      'ace': this.t('match.ace'),
      'double_fault': this.t('match.doubleFault'),
      'return_winner': this.t('match.returnWinner'),
      'service_winner': this.t('match.serviceWinner')
    }
    return outcomeMap[outcome] || outcome
  }

  // Format court position
  formatCourtPosition(position: string): string {
    const positionMap: Record<string, string> = {
      'forehand': this.t('match.forehand'),
      'backhand': this.t('match.backhand'),
      'net': this.t('match.net'),
      'baseline': this.t('match.baseline')
    }
    return positionMap[position] || position
  }

  // Format shot type
  formatShotType(shotType: string): string {
    const shotMap: Record<string, string> = {
      'serve': this.t('match.serve'),
      'return': this.t('match.return'),
      'groundstroke': this.t('match.groundstroke'),
      'volley': this.t('match.volley'),
      'overhead': this.t('match.overhead'),
      'drop_shot': this.t('match.dropShot'),
      'lob': this.t('match.lob')
    }
    return shotMap[shotType] || shotType
  }

  // Format momentum
  formatMomentum(momentum: number): string {
    if (momentum > 0.7) return this.t('statistics.strongMomentum')
    if (momentum > 0.3) return this.t('statistics.slightMomentum')
    if (momentum > -0.3) return this.t('statistics.neutral')
    if (momentum > -0.7) return this.t('statistics.slightlyBehind')
    return this.t('statistics.stronglyBehind')
  }

  // Format match status
  formatMatchStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'in_progress': this.t('match.inProgress'),
      'completed': this.t('match.completed'),
      'scheduled': this.t('match.scheduled'),
      'cancelled': this.t('match.cancelled')
    }
    return statusMap[status] || status
  }
}

// Hook to get tennis formatter
export function useTennisFormatter() {
  const t = useTranslations('common')
  const format = useFormatter()
  const locale = useLocale() as SupportedLocale
  
  return new TennisFormatter(t, format, locale)
}

// Enhanced statistics formatting
export function formatStatistic(
  t: ReturnType<typeof useTranslations>,
  statType: string,
  value: number,
  total?: number
): string {
  switch (statType) {
    case 'percentage':
      return `${Math.round(value)}%`
    case 'ratio':
      return total ? `${value}/${total}` : `${value}`
    case 'time':
      return `${Math.round(value)}min`
    case 'count':
      return value.toString()
    default:
      return value.toString()
  }
}

// Migration helpers for legacy components
export function useMigrationHelpers() {
  const t = useTranslations('common')
  
  return {
    // Helper for components that need both old and new translation patterns
    safeTranslate: (key: string, fallback?: string) => {
      try {
        const result = t(key)
        // If the result is the same as the key, it might be missing
        return result === key ? (fallback || key) : result
      } catch {
        return fallback || key
      }
    },
    
    // Helper for dynamic translation keys
    translateDynamic: (baseKey: string, suffix: string) => {
      const fullKey = `${baseKey}.${suffix}`
      return t(fullKey)
    }
  }
}

// Safe translation helper for error handling
export function safeTranslation(
  t: ReturnType<typeof useTranslations>,
  key: string,
  fallback?: string
): string {
  try {
    const result = t(key)
    return result === key ? (fallback || key) : result
  } catch {
    return fallback || key
  }
}

// Format tennis-specific messages
export function formatTennisMessage(
  t: ReturnType<typeof useTranslations>,
  messageType: 'score' | 'gameStatus' | 'matchResult',
  data: Record<string, any>
): string {
  switch (messageType) {
    case 'score':
      return t('match.currentScore', data)
    case 'gameStatus':
      return t('match.gameStatus', data)
    case 'matchResult':
      return t('match.matchResult', data)
    default:
      return ''
  }
}