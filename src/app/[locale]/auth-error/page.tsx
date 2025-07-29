"use client"

import { Link } from "@/i18n/navigation"
import { AlertCircle } from "lucide-react"
import { useTranslations } from "@/i18n"

export default function AuthErrorPage() {
  const t = useTranslations('auth')
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-destructive/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('authenticationError')}</h1>
          <p className="text-muted-foreground">
            {t('authErrorDescription')}
          </p>
        </div>
        
        <ul className="text-left space-y-2 text-sm text-muted-foreground">
          <li>• {t('sessionExpired')}</li>
          <li>• {t('cookiesDisabled')}</li>
          <li>• {t('temporaryServerIssue')}</li>
          <li>• {t('invalidSessionData')}</li>
        </ul>
        
        <div className="space-y-4 pt-4">
          <Link
            href="/clear-session"
            className="block w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            {t('clearSessionAndTryAgain')}
          </Link>
          
          <Link
            href="/login"
            className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            {t('goToLogin')}
          </Link>
          
          <Link
            href="/"
            className="block w-full px-4 py-2 text-muted-foreground hover:text-white transition-colors"
          >
            {t('backToHome')}
          </Link>
        </div>
        
        <div className="pt-6 text-xs text-muted-foreground">
          <p>{t('troubleshootingTitle')}</p>
          <ul className="mt-2 space-y-1">
            <li>• {t('clearBrowserCache')}</li>
            <li>• {t('useDifferentBrowser')}</li>
            <li>• {t('checkInternetConnection')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}