"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useTranslations } from "@/i18n"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  target?: string
}

interface MobileTabBarProps {
  navigation: NavItem[]
}

/** Flat, always-visible bottom tab bar: four destinations with a centred "New" action. */
export function MobileTabBar({ navigation }: MobileTabBarProps) {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  // Admin opens in a new tab and lives in the drawer, not the bar
  const tabs = navigation.filter(item => !item.target).slice(0, 4)
  const left = tabs.slice(0, 2)
  const right = tabs.slice(2)

  const renderTab = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/tab flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className={cn("flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 motion-reduce:transition-none motion-safe:group-active/tab:scale-95", isActive && "bg-brand/15 text-brand")}>
          <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
        </span>
        <span className="max-w-full truncate px-1">{item.label}</span>
      </Link>
    )
  }

  return (
    <nav
      aria-label={t('mainContent')}
      className="fixed inset-x-0 bottom-0 z-40 border-t glass pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {left.map(renderTab)}
        <Link
          href="/matches/new"
          aria-label={t('createNewMatch')}
          className="group/new flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex h-8 w-11 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-100 motion-reduce:transition-none motion-safe:group-active/new:scale-95">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="max-w-full truncate px-1">{t('new')}</span>
        </Link>
        {right.map(renderTab)}
      </div>
    </nav>
  )
}
