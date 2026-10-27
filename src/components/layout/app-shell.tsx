"use client"

import { useState, useEffect } from "react"
import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { Home, Trophy, Users, Menu, X, Plus, LogOut, Settings, Shield, BarChart3 } from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { ThemeSwitcher, ThemeCycleButton } from "@/components/ui/theme-switcher"
import { User } from "@/lib/types"
import { isAdmin } from "@/lib/auth"
import { MobileTabBar } from "./collapsible-mobile-nav"
import { InstallAppItem } from "@/components/shared/install-app-item"
import { useTranslations } from "@/i18n"
import { ExtensionConflictNotice } from "@/components/shared/extension-conflict-notice"
import { HydrationErrorBoundary } from "@/components/shared/hydration-error-boundary"

interface AppShellProps {
  children: React.ReactNode
  user: User
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('navigation')

  const baseNavigation = [
    { href: "/dashboard", icon: Home, label: t('dashboard'), description: t('overviewStats') },
    { href: "/matches", icon: Trophy, label: t('matches'), description: t('matchHistory') },
    { href: "/players", icon: Users, label: t('players'), description: t('managePlayers') },
    { href: "/statistics", icon: BarChart3, label: t('statistics'), description: t('detailedStats') },
  ]

  const navigation = isAdmin(user.email)
    ? [...baseNavigation, {
      href: "/admin",
      icon: Shield,
      label: t("adminLabel"),
      description: t("adminDescription"),
      target: "_blank" as const,
    }]
    : baseNavigation

  // Close the drawer on navigation, lock page scroll while it is open
  useEffect(() => { setDrawerOpen(false) }, [pathname])
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [drawerOpen])

  // "N" jumps to the new-match form (ignored while typing or with modifiers)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      router.push("/matches/new")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router])

  // Live scoring has its own fixed controls at the bottom of the screen
  const hideTabBar = pathname.startsWith("/matches/live")

  const renderNavLinks = (compact: boolean) =>
    navigation.map((item) => {
      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={!(item as { target?: string }).target}
          target={(item as { target?: string }).target}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 text-sm transition-colors",
            compact ? "py-2.5" : "py-3",
            isActive
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{item.label}</span>
            {!compact && <span className="text-xs opacity-70">{item.description}</span>}
          </div>
        </Link>
      )
    })

  const userBlock = (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 border border-border">
        <AvatarImage src="" />
        <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
          {getInitials(user.name || user.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{user.name || t("defaultUserName")}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )

  return (
    <HydrationErrorBoundary>
      <div className="min-h-dvh bg-background">
        {/* Desktop sidebar */}
        <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-60 flex-col border-r border-foreground/10 bg-card/60 md:flex">
          <div className="flex h-14 items-center border-b border-border px-5">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                <Trophy className="h-4 w-4 text-background" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">Tenis.click</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label={t('mainContent')}>
            {renderNavLinks(false)}
          </nav>

          <div className="space-y-2 border-t border-border p-3">
            <Button asChild className="w-full">
              <Link href="/matches/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                {t('newMatchButton')}
              </Link>
            </Button>
            <ThemeSwitcher />
            <div className="flex justify-center">
              <LanguageSwitcher variant="compact" size="sm" showFlags={true} showNativeNames={false} />
            </div>
          </div>

          <div className="border-t border-border p-3">
            {userBlock}
            <div className="mt-2 flex gap-1">
              <Button variant="ghost" size="sm" asChild className="flex-1 text-muted-foreground">
                <Link href="/settings">
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  {t('settings')}
                </Link>
              </Button>
              <form action={signOut} className="flex-1">
                <Button variant="ghost" size="sm" type="submit" className="w-full text-muted-foreground">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t('signOut')}
                </Button>
              </form>
            </div>
          </div>
        </aside>

        {/* Mobile header */}
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b glass px-2 pt-[env(safe-area-inset-top)] md:hidden box-content">
          <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label={t('openNavigationMenu')}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
              <Trophy className="h-3.5 w-3.5 text-background" aria-hidden="true" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">Tenis.click</span>
          </Link>
          <div className="flex items-center">
            <LanguageSwitcher variant="compact" size="sm" showFlags={true} showNativeNames={false} />
            <ThemeCycleButton />
          </div>
        </header>

        {/* Mobile drawer: CSS-only transition, always mounted so it opens instantly */}
        <div className={cn("md:hidden", drawerOpen ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!drawerOpen}>
          <div
            className={cn(
              "fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
              drawerOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className={cn(
              "fixed left-0 top-0 z-50 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-border bg-card pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out",
              drawerOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <span className="font-semibold tracking-tight text-foreground">Tenis.click</span>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label={t('collapseNavigation')}>
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">{renderNavLinks(true)}</nav>
            <div className="space-y-3 border-t border-border p-4">
              <InstallAppItem />
              <ThemeSwitcher />
              {userBlock}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild className="min-h-11">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    {t('settings')}
                  </Link>
                </Button>
                <form action={signOut}>
                  <Button variant="outline" size="sm" type="submit" className="min-h-11 w-full">
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {t('signOut')}
                  </Button>
                </form>
              </div>
            </div>
          </aside>
        </div>

        {/* Single content tree for every breakpoint */}
        <main
          id="main-content"
          role="main"
          aria-label={t('mainContent')}
          className={cn(
            "w-full max-w-full pt-[calc(3.5rem+env(safe-area-inset-top))] md:ml-60 md:w-[calc(100%-15rem)] md:pt-0",
            hideTabBar ? "pb-[env(safe-area-inset-bottom)]" : "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
          )}
        >
          <a
            href="#main-content"
            className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            {t('skipToContent')}
          </a>
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 md:py-6 lg:px-8">
            <ExtensionConflictNotice />
            {children}
          </div>
        </main>

        {!hideTabBar && <MobileTabBar navigation={navigation} />}
      </div>
    </HydrationErrorBoundary>
  )
}
