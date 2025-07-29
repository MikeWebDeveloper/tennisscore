import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)

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