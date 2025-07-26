'use client'

import { useLocaleStore } from '@/stores/localeStore'
import { locales, type Locale } from '@/i18n/config'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Globe } from 'lucide-react'

const languageNames: Record<Locale, string> = {
  en: 'English',
  cs: 'Čeština',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
}

const languageFlags: Record<Locale, string> = {
  en: '🇬🇧',
  cs: '🇨🇿',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ru: '🇷🇺',
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
  const { locale, setLocale } = useLocaleStore()

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    // Store preference in localStorage for persistence
    localStorage.setItem('preferred-locale', newLocale)
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
          {locales.map((loc) => (
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
        {locales.map((loc) => (
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