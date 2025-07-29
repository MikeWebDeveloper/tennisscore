"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { useTranslations } from "@/i18n"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('common')

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
    const newLocale = locale === 'en' ? 'cs' : 'en'
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={cn("h-8 w-8 p-0", className)}
      title={locale === 'en' ? t('switchToCzech') : t('switchToEnglish')}
    >
      <span className="text-base">
        {locale === 'en' ? '🇬🇧' : '🇨🇿'}
      </span>
    </Button>
  )
} 