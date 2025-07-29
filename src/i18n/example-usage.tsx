'use client'

import { 
  useTranslations,
} from '@/i18n'

// Example component showing new i18n usage
export function ExampleI18nUsage() {
  const t = useTranslations('common')

  // Example of tennis data
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
        <p>{t('save')}</p>
        <p>{t('cancel')}</p>
      </div>

      {/* Example data display */}
      <div>
        <h3 className="font-semibold">Example Match Data:</h3>
        <p>Duration: {exampleMatch.duration} minutes</p>
        <p>Sets: {exampleMatch.sets.map(set => `${set[0]}-${set[1]}`).join(', ')}</p>
        <p>Wins: {exampleMatch.player1Wins}/{exampleMatch.totalMatches}</p>
      </div>

      {/* Namespace usage */}
      <div>
        <h3 className="font-semibold">Namespaced Translations:</h3>
        <p>Common Save: {t('save')}</p>
        <p>Common Cancel: {t('cancel')}</p>
        <p>Common Loading: {t('loading')}</p>
      </div>
    </div>
  )
}

// Server component example
export function ServerI18nExample() {
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
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tMatch = useTranslations('match')

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Legacy Compatibility</h2>
      
      {/* Basic keys */}
      <p>{tCommon('loading')}</p>
      <p>{tCommon('save')}</p>
      <p>{tCommon('cancel')}</p>
      
      {/* Namespaced keys */}
      <p>{tCommon('save')}</p>
      <p>{tNav('matches')}</p>
      <p>{tMatch('liveScoring')}</p>
    </div>
  )
}