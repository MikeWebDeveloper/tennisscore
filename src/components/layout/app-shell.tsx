"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Home, 
  Trophy, 
  Users, 
  Menu, 
  X, 
  Plus,
  Sun,
  Moon,
  LogOut
} from "lucide-react"
import { signOut } from "@/lib/actions/auth"
import { useTheme } from "next-themes"
import { User } from "@/lib/types"

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
  }
]

// Animation variants
const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  closed: {
    x: "-100%",
    transition: {
      type: "spring",
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
  const { theme, setTheme } = useTheme()

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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
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
              {navigation.map((item) => {
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
                  New Match
                </Link>
              </Button>
            </div>

            {/* Theme Toggle */}
            <div className="px-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-full text-muted-foreground hover:text-foreground hover:bg-accent/50"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                    {getInitials(user.name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <form action={signOut}>
                  <Button variant="ghost" size="sm" type="submit" className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
              <Trophy className="h-4 w-4 text-background" />
            </div>
            <span className="font-bold text-foreground">TennisScore</span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
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
                className="fixed left-0 top-0 z-50 h-screen w-80 bg-card border-r border-border shadow-xl"
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
                    {navigation.map((item) => {
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
                        New Match
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
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <form action={signOut}>
                      <Button variant="ghost" size="sm" type="submit" className="w-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground border border-border">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </form>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Main Content */}
        <main className="pt-16">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg">
          <div className="flex items-center justify-around py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center space-y-1 px-3 py-2 text-xs transition-all",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
            <Link
              href="/matches/new"
              className="flex flex-col items-center space-y-1 px-3 py-2 text-xs text-foreground font-medium"
            >
              <div className="h-8 w-8 rounded-full bg-foreground hover:bg-foreground/90 flex items-center justify-center shadow-sm">
                <Plus className="h-4 w-4 text-background" />
              </div>
              <span>New</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
} 