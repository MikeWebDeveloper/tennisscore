"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { 
  Home, 
  Trophy, 
  Users, 
  Menu, 
  X, 
  Plus,
  Sun,
  Moon,
  LogOut,
  Settings,
  Shield,
  BarChart3
} from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { useTheme } from "next-themes"
import { User } from "@/lib/types"
import { isAdmin } from "@/lib/auth"
import { CollapsibleMobileNav } from "./collapsible-mobile-nav"
import { useTranslations } from "@/hooks/use-translations"
import { ExtensionConflictNotice } from "@/components/shared/extension-conflict-notice"
import { HydrationErrorBoundary } from "@/components/shared/hydration-error-boundary"

interface AppShellProps {
  children: React.ReactNode
  user: User
}

const navigation = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Dashboard",
    description: "Overview & stats"
  },
  {
    href: "/matches",
    icon: Trophy,
    label: "Matches",
    description: "Match history"
  },
  {
    href: "/players",
    icon: Users,
    label: "Players",
    description: "Manage players"
  },
  {
    href: "/statistics",
    icon: BarChart3,
    label: "Statistics",
    description: "Detailed stats"
  }
]

// Animation variants
const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  }
}

const overlayVariants = {
  open: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  closed: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
}



export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const t = useTranslations('navigation')

  // Localized navigation
  const baseNavigation = [
    {
      href: "/dashboard",
      icon: Home,
      label: t('dashboard'),
      description: t('overviewStats')
    },
    {
      href: "/matches",
      icon: Trophy,
      label: t('matches'),
      description: t('matchHistory')
    },
    {
      href: "/players",
      icon: Users,
      label: t('players'),
      description: t('managePlayers')
    },
    {
      href: "/statistics",
      icon: BarChart3,
      label: t('statistics') || 'Statistics',
      description: t('detailedStats') || 'Detailed stats'
    }
  ]

  // Add admin link only for privileged users
  const localizedNavigation = isAdmin(user.email) 
    ? [...baseNavigation, {
        href: "/admin",
        icon: Shield,
        label: t("adminLabel"),
        description: t("adminDescription")
      }]
    : baseNavigation

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background" suppressHydrationWarning>
        <div className="flex items-center justify-center min-h-screen" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" suppressHydrationWarning></div>
        </div>
      </div>
    )
  }

  return (
    <HydrationErrorBoundary>
      <div className="min-h-screen bg-background" suppressHydrationWarning>
        {/* Desktop Sidebar */}
        <div className="hidden md:flex" suppressHydrationWarning>
          <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border shadow-lg">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center border-b border-border px-6">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-background" />
                  </div>
                  <span className="text-xl font-bold text-foreground">TennisScore</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2 p-4">
                {localizedNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                        isActive 
                          ? "bg-foreground text-background shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* New Match CTA - More Prominent */}
              <div className="p-4 border-t border-border">
                <Button asChild className="w-full minimal-button font-medium shadow-sm">
                  <Link href="/matches/new">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('newMatchButton')}
                  </Link>
                </Button>
              </div>

              {/* Theme Toggle & Language */}
              <div className="px-4 pb-2 space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      {t('lightMode')}
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      {t('darkMode')}
                    </>
                  )}
                </Button>
                <div className="flex justify-center">
                  <LanguageSwitcher variant="dropdown" size="sm" showFlags={true} showNativeNames={false} />
                </div>
              </div>

              {/* User Profile */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center space-x-3 mb-2">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                      {getInitials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name || t("defaultUserName")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" asChild className="hover:bg-accent text-muted-foreground">
                      <Link href="/settings">
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                    <form action={signOut}>
                      <Button variant="ghost" size="sm" type="submit" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1" id="main-content" role="main">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50"
            >
              Skip to main content
            </a>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <ExtensionConflictNotice />
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full max-w-full overflow-x-hidden">
          {/* Mobile Header */}
          <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-card border-b border-border flex items-center justify-between px-4 shadow-sm w-full max-w-full overflow-x-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="hover:bg-accent"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
                <Trophy className="h-4 w-4 text-background" />
              </div>
              <span className="font-bold text-foreground">TennisScore</span>
            </div>

            <div className="flex items-center space-x-2">
              <LanguageSwitcher variant="compact" size="sm" showFlags={true} showNativeNames={false} className="mr-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src="" />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {getInitials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/50"
                  variants={overlayVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  className="fixed left-0 top-0 z-50 h-screen w-80 max-w-[100vw] bg-card border-r border-border shadow-xl overflow-x-hidden"
                  variants={sidebarVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <div className="flex h-full flex-col">
                    {/* Mobile Header */}
                    <div className="flex h-16 items-center justify-between border-b border-border px-6">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">TennisScore</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex-1 space-y-2 p-4">
                      {localizedNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                              isActive 
                                ? "bg-foreground text-background shadow-sm" 
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-xs opacity-70">{item.description}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </nav>

                    {/* Mobile New Match CTA */}
                    <div className="p-4 border-t border-border">
                      <Button asChild className="w-full minimal-button font-medium shadow-sm" onClick={() => setSidebarOpen(false)}>
                        <Link href="/matches/new">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('newMatchButton')}
                        </Link>
                      </Button>
                    </div>

                    {/* Mobile User Profile */}
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                            {getInitials(user.name || user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name || t("defaultUserName")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button variant="ghost" size="sm" asChild className="w-full hover:bg-accent text-muted-foreground border border-border" onClick={() => setSidebarOpen(false)}>
                          <Link href="/settings">
                            <Settings className="h-4 w-4 mr-2" />
                            {t('settings')}
                          </Link>
                        </Button>
                        <form action={signOut}>
                          <Button variant="ghost" size="sm" type="submit" className="w-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-border">
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('signOut')}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </motion.aside>
                {/* Prevent body scroll when sidebar is open */}
                {typeof window !== 'undefined' && document && (document.body.style.overflow = 'hidden')}
              </>
            )}
            {/* Restore body scroll when sidebar is closed */}
            {!sidebarOpen && typeof window !== 'undefined' && document && (document.body.style.overflow = '')}
          </AnimatePresence>

          {/* Mobile Main Content */}
          <main className="pt-16 w-full max-w-full overflow-x-hidden" role="main" aria-label="Main content">
            <div className="mx-auto w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 overflow-x-hidden">
              <ExtensionConflictNotice />
              {children}
            </div>
          </main>

          {/* Enhanced Collapsible Mobile Bottom Navigation */}
          <CollapsibleMobileNav navigation={localizedNavigation} />
        </div>
      </div>
    </HydrationErrorBoundary>
  )
} 