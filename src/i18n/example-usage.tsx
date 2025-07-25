'use client'

import { 
  useTranslations, 
  useTennisTranslations,
  useCommonTranslations,
  useLocaleSwitch 
} from '@/i18n'

// Example component showing new i18n usage
export function ExampleI18nUsage() {
  const t = useTranslations('common')
  const tennis = useTennisTranslations()
  const common = useCommonTranslations()
  const { currentLocale, switchToEnglish, switchToCzech } = useLocaleSwitch()

  // Example of formatting tennis data
  const exampleMatch = {
    duration: 125, // minutes
    sets: [[6, 4], [3, 6], [6, 2]],
    player1Wins: 15,
    totalMatches: 20,
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">
        Next-intl Integration Example
      </h2>
      
      {/* Basic translations */}
      <div>
        <h3 className="font-semibold">Basic Translations:</h3>
        <p>{t('loading')}</p>
        <p>{common.save}</p>
        <p>{common.cancel}</p>
      </div>

      {/* Tennis-specific formatting */}
      <div>
        <h3 className="font-semibold">Tennis Formatting:</h3>
        <p>Duration: {tennis.formatDuration(exampleMatch.duration)}</p>
        <p>Score: {tennis.formatScore(exampleMatch.sets)}</p>
        <p>Win Rate: {tennis.formatWinPercentage(exampleMatch.player1Wins, exampleMatch.totalMatches)}</p>
        <p>Ace: {tennis.formatStat(85, 'percentage')}</p>
      </div>

      {/* Locale switching */}
      <div>
        <h3 className="font-semibold">Current Locale: {currentLocale}</h3>
        <div className="space-x-2">
          <button 
            onClick={switchToEnglish}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            English
          </button>
          <button 
            onClick={switchToCzech}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Čeština
          </button>
        </div>
      </div>

      {/* Namespace usage */}
      <div>
        <h3 className="font-semibold">Namespaced Translations:</h3>
        <p>Match: {tennis.t('match.newMatch')}</p>
        <p>Player: {tennis.t('player.firstName')}</p>
        <p>Dashboard: {tennis.t('dashboard.welcomeBack')}</p>
      </div>

      {/* Parameter interpolation */}
      <div>
        <h3 className="font-semibold">Parameter Interpolation:</h3>
        <p>{tennis.t('dashboard.matchVsOpponent', { opponentName: 'John Doe' })}</p>
        <p>{tennis.t('dashboard.inProgressWithCount', { count: 3 })}</p>
      </div>
    </div>
  )
}

// Server component example
export function ServerI18nExample() {
  // In server components, you'll use next-intl directly
  // This is just for demonstration - actual server usage would be different
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">
        Server Component I18n
      </h2>
      <p>Server components use next-intl directly with useTranslations from next-intl/server</p>
    </div>
  )
}

// Backward compatibility example
export function LegacyCompatibilityExample() {
  const t = useTranslations()

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Legacy Compatibility</h2>
      
      {/* These old-style keys will be automatically mapped */}
      <p>{t('loading')}</p>
      <p>{t('dashboard')}</p>
      <p>{t('newMatch')}</p>
      <p>{t('firstName')}</p>
      
      {/* New namespaced keys also work */}
      <p>{t('common.save')}</p>
      <p>{t('navigation.matches')}</p>
      <p>{t('match.liveScoring')}</p>
    </div>
  )
}