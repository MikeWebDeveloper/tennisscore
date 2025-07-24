import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Locale } from '@/lib/i18n'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: 'locale-storage',
      skipHydration: true,
    }
  )
) 