"use client"

import { useTranslations } from "@/hooks/use-translations"
import { useLocaleStore } from "@/stores/localeStore"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestI18nPage() {
  const { locale, setLocale } = useLocaleStore()
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tMatch = useTranslations('match')
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">i18n Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Locale: {locale}</h2>
        <div className="flex gap-2 mb-4">
          <Button onClick={() => setLocale('en')} variant={locale === 'en' ? 'default' : 'outline'}>
            English
          </Button>
          <Button onClick={() => setLocale('cs')} variant={locale === 'cs' ? 'default' : 'outline'}>
            Czech
          </Button>
        </div>
        <LanguageSwitcher variant="dropdown" size="md" showFlags={true} />
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>signIn:</strong> {tAuth('signIn')}</li>
              <li><strong>email:</strong> {tAuth('email')}</li>
              <li><strong>password:</strong> {tAuth('password')}</li>
              <li><strong>tennisScore:</strong> {tAuth('tennisScore')}</li>
              <li><strong>welcomeBackAuth:</strong> {tAuth('welcomeBackAuth')}</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Common Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>save:</strong> {tCommon('save')}</li>
              <li><strong>cancel:</strong> {tCommon('cancel')}</li>
              <li><strong>loading:</strong> {tCommon('loading')}</li>
              <li><strong>signOut:</strong> {tCommon('signOut')}</li>
              <li><strong>lightMode:</strong> {tCommon('lightMode')}</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Navigation Translations (Key Issues Testing)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>navigation.dashboard:</strong> {tNav('dashboard')}</li>
              <li><strong>navigation.matches:</strong> {tNav('matches')}</li>
              <li><strong>navigation.players:</strong> {tNav('players')}</li>
              <li><strong>navigation.statistics:</strong> {tNav('statistics')}</li>
              <li><strong>navigation.settings:</strong> {tNav('settings')}</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Match Translations (Problematic Keys)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>match.showingMatchesSummary:</strong> {tMatch('showingMatchesSummary', { shown: 5, total: 10 })}</li>
              <li><strong>match.winner:</strong> {tMatch('winner')}</li>
              <li><strong>match.newMatch:</strong> {tMatch('newMatch')}</li>
              <li><strong>match.vs:</strong> {tMatch('vs')}</li>
              <li><strong>match.completed:</strong> {tMatch('completed')}</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Match Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>liveScoring:</strong> {tMatch('liveScoring')}</li>
              <li><strong>score:</strong> {tMatch('score')}</li>
              <li><strong>serving:</strong> {tMatch('serving')}</li>
              <li><strong>winner:</strong> {tMatch('winner')}</li>
              <li><strong>matchType:</strong> {tMatch('matchType')}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}