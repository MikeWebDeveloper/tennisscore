"use client"

import { useEffect, useState } from "react"
import { useLocaleStore } from "@/stores/localeStore"
import { getNestedTranslation } from "@/lib/translations"
import type { Locale } from "@/i18n/config"

export function useTranslations(namespace?: string) {
  const { locale } = useLocaleStore()
  const [hydrated, setHydrated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Force hydration on client side
    useLocaleStore.persist.rehydrate()
    setHydrated(true)
  }, [])

  // During SSR and initial client render, always use 'en' to avoid mismatches
  // Only use the stored locale after the component is mounted and hydrated
  const currentLocale = (mounted && hydrated ? locale : 'en') as Locale
  
  return (key: string, params?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    let translation = getNestedTranslation(currentLocale, fullKey)
    
    // Handle parameter replacement
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value))
      })
    }
    
    return translation
  }
} 