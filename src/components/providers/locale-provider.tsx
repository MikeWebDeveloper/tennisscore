'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/stores/localeStore'
import type { Locale } from '@/i18n/config'
import { locales } from '@/i18n/config'

interface LocaleProviderProps {
  children: React.ReactNode
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const { setLocale } = useLocaleStore()

  useEffect(() => {
    // Initialize locale on mount
    const initializeLocale = () => {
      // 1. Check localStorage for saved preference
      const savedLocale = localStorage.getItem('preferred-locale') as Locale
      if (savedLocale && locales.includes(savedLocale)) {
        setLocale(savedLocale)
        return
      }

      // 2. Check browser language
      const browserLang = navigator.language.split('-')[0] as Locale
      if (locales.includes(browserLang)) {
        setLocale(browserLang)
        return
      }

      // 3. Default to English
      setLocale('en')
    }

    // Rehydrate the store first
    useLocaleStore.persist.rehydrate()
    initializeLocale()
  }, [setLocale])

  return <>{children}</>
}