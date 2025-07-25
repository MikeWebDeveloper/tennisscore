import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Locale, locales, defaultLocale } from '@/i18n/config'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  isValidLocale: (locale: string) => locale is Locale
  getPreferredLocale: () => Locale
  syncWithURL: (urlLocale: string | null) => void
}

// Helper function to get initial locale
const getInitialLocale = (): Locale => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const savedLocale = localStorage.getItem('preferred-locale') as Locale
    if (savedLocale && locales.includes(savedLocale)) {
      return savedLocale
    }
    
    // Check browser language
    const browserLanguage = navigator.language.split('-')[0] as Locale
    if (locales.includes(browserLanguage)) {
      return browserLanguage
    }
  }
  
  return defaultLocale
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: getInitialLocale(),
      
      setLocale: (locale: Locale) => {
        if (locales.includes(locale)) {
          set({ locale })
          // Also save to localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('preferred-locale', locale)
          }
        }
      },
      
      isValidLocale: (locale: string): locale is Locale => {
        return locales.includes(locale as Locale)
      },
      
      getPreferredLocale: (): Locale => {
        const { locale } = get()
        
        // Check if stored locale is still valid
        if (locales.includes(locale)) {
          return locale
        }
        
        // Fall back to browser language if available
        if (typeof window !== 'undefined') {
          const browserLanguage = navigator.language.split('-')[0] as Locale
          if (locales.includes(browserLanguage)) {
            return browserLanguage
          }
        }
        
        return defaultLocale
      },
      
      syncWithURL: (urlLocale: string | null) => {
        const { setLocale, isValidLocale } = get()
        
        if (urlLocale && isValidLocale(urlLocale)) {
          setLocale(urlLocale)
        }
      },
    }),
    {
      name: 'tennis-locale-storage',
      skipHydration: true,
      // Only persist the locale, not the methods
      partialize: (state) => ({ locale: state.locale }),
    }
  )
) 