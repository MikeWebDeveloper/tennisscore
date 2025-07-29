'use client'

import { useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Globe } from 'lucide-react'

type Locale = 'en' | 'cs'

const languageNames: Record<Locale, string> = {
  en: 'English',
  cs: 'Čeština',
}

const languageFlags: Record<Locale, string> = {
  en: '🇬🇧',
  cs: '🇨🇿',
}

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  showFlags?: boolean
  showNativeNames?: boolean
  className?: string
}

export function LanguageSwitcher({ 
  variant = 'dropdown',
  size = 'sm',
  showFlags = false,
  showNativeNames = true,
  className
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size={size === 'md' ? 'default' : size} className={className}>
            {showFlags ? languageFlags[locale] : locale.toUpperCase()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[150px]">
          {routing.locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={locale === loc ? 'bg-accent' : ''}
            >
              {showFlags && `${languageFlags[loc]} `}
              {showNativeNames ? languageNames[loc] : loc.toUpperCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size === 'md' ? 'default' : size} className={`gap-2 ${className}`}>
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showFlags && `${languageFlags[locale]} `}
            {showNativeNames ? languageNames[locale] : locale.toUpperCase()}
          </span>
          <span className="sm:hidden">
            {showFlags ? languageFlags[locale] : locale.toUpperCase()}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLocaleChange(loc as Locale)}
            className={locale === loc ? 'bg-accent' : ''}
          >
            {showFlags && `${languageFlags[loc as Locale]} `}
            {showNativeNames ? languageNames[loc as Locale] : loc.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}