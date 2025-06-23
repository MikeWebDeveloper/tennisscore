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

  return (
    <div className={cn("flex items-center space-x-1 bg-muted rounded-md p-1", className)}>
      <Button
        variant={locale === 'en' ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocale('en')}
        className="h-8 w-8 p-0"
      >
        <span className="text-base">🇬🇧</span>
      </Button>
      <Button
        variant={locale === 'cs' ? "default" : "ghost"}
        size="sm"
        onClick={() => setLocale('cs')}
        className="h-8 w-8 p-0"
      >
        <span className="text-base">🇨🇿</span>
      </Button>
    </div>
  )
} 