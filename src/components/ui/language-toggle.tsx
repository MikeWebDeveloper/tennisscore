"use client"

import { useEffect, useState } from "react"
import { useLocaleStore } from "@/stores/localeStore"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocaleStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("flex items-center space-x-1 bg-muted rounded-md p-1", className)}>
        <Button
          variant="default"
          size="sm"
          className="h-8 px-2"
        >
          <span className="text-base mr-1">🇬🇧</span>
          <span className="text-xs">EN</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
        >
          <span className="text-base mr-1">🇨🇿</span>
          <span className="text-xs">CS</span>
        </Button>
      </div>
    )
  }

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'cs' : 'en')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={cn("h-8 w-8 p-0", className)}
      title={`Switch to ${locale === 'en' ? 'Czech' : 'English'}`}
    >
      <span className="text-base">
        {locale === 'en' ? '🇬🇧' : '🇨🇿'}
      </span>
    </Button>
  )
} 