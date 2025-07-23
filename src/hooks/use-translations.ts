"use client"

import { useEffect, useState } from "react"
import { useLocaleStore } from "@/stores/localeStore"
import { t, Translations, Locale } from "@/lib/i18n"

export function useTranslations() {
  const { locale } = useLocaleStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Set hydrated to true once client-side
    // Remove forced rehydration that could cause navigation loops
    setHydrated(true)
  }, [])

  // Use 'en' as fallback during SSR and before hydration
  const currentLocale: Locale = hydrated ? locale : 'en'
  
  return (key: keyof Translations) => t(currentLocale, key)
} 