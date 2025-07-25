// Fallback navigation without next-intl
import NextLink from 'next/link'
import { redirect as nextRedirect } from 'next/navigation'
import { usePathname as nextUsePathname, useRouter as nextUseRouter } from 'next/navigation'
import { locales, defaultLocale } from './config'

// Mock Link component that ignores locale
export const Link = NextLink

// Mock redirect that ignores locale
export const redirect = nextRedirect

// Mock usePathname that returns the path without locale prefix
export const usePathname = () => {
  const pathname = nextUsePathname()
  // Remove locale prefix if present
  const segments = pathname.split('/')
  if (segments[1] && locales.includes(segments[1] as any)) {
    segments.splice(1, 1)
    return segments.join('/') || '/'
  }
  return pathname
}

// Mock useRouter that provides a replace method with locale support
export const useRouter = () => {
  const router = nextUseRouter()
  
  return {
    ...router,
    replace: (pathname: string, options?: { locale?: string }) => {
      // For now, just navigate to the pathname without locale prefix
      router.replace(pathname)
    },
    push: (pathname: string, options?: { locale?: string }) => {
      // For now, just navigate to the pathname without locale prefix
      router.push(pathname)
    }
  }
}

// Path configuration for internationalized routes
export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/matches': '/matches',
  '/matches/new': '/matches/new',
  '/matches/[id]': '/matches/[id]',
  '/matches/live/[id]': '/matches/live/[id]',
  '/players': '/players',
  '/statistics': '/statistics',
  '/settings': '/settings',
  '/live/[matchId]': '/live/[matchId]',
  '/login': '/login',
  '/signup': '/signup',
} as const

export type Pathnames = typeof pathnames
export type Pathname = keyof Pathnames