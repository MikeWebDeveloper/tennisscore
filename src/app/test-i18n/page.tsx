"use client"

import { useTranslations } from "@/hooks/use-translations"
import { useLocaleStore } from "@/stores/localeStore"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestI18nPage() {
  const { locale } = useLocaleStore()
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const tMatch = useTranslations('match')
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">i18n Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Locale: {locale}</h2>
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
            <CardTitle>Navigation Translations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><strong>dashboard:</strong> {tNav('dashboard')}</li>
              <li><strong>matches:</strong> {tNav('matches')}</li>
              <li><strong>players:</strong> {tNav('players')}</li>
              <li><strong>statistics:</strong> {tNav('statistics')}</li>
              <li><strong>settings:</strong> {tNav('settings')}</li>
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