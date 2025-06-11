"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Plus,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { signOut } from "@/lib/actions/auth"

interface User {
  $id: string
  name: string
  email: string
}

interface AppShellProps {
  children: React.ReactNode
  user: User
}

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    description: "Overview & stats"
  },
  {
    href: "/matches",
    icon: Trophy,
    label: "Matches",
    description: "Live scoring & history"
  },
  {
    href: "/players",
    icon: Users,
    label: "Players",
    description: "Manage profiles"
  }
]

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: -280 }
}

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 }
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-black" />
                </div>
                <span className="text-xl font-bold text-slate-200">TennisScore</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-slate-800",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.description}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* New Match CTA */}
            <div className="p-4 border-t border-slate-800">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-medium">
                <Link href="/matches/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Match
                </Link>
              </Button>
            </div>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-black font-medium">
                    {getInitials(user.name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <form action={signOut}>
                  <Button variant="ghost" size="sm" type="submit">
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
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Trophy className="h-4 w-4 text-black" />
            </div>
            <span className="font-bold text-slate-200">TennisScore</span>
          </div>

          <Avatar className="h-8 w-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-black text-xs font-medium">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
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
                className="fixed left-0 top-0 z-50 h-screen w-80 bg-slate-900 border-r border-slate-800"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              >
                <div className="flex h-full flex-col">
                  {/* Header */}
                  <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-black" />
                      </div>
                      <span className="text-xl font-bold text-slate-200">TennisScore</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 space-y-2 p-4">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm transition-all",
                            isActive 
                              ? "bg-primary/10 text-primary border border-primary/20" 
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <div className="flex flex-col">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-xs text-slate-500">{item.description}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* User Profile */}
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-black font-medium">
                          {getInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {user.name || "User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <form action={signOut}>
                      <Button variant="outline" className="w-full" type="submit">
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

        {/* Main Content */}
        <main className="pt-16 pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-slate-900 border-t border-slate-800">
          <div className="flex h-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center space-y-1 transition-all",
                    isActive ? "text-primary" : "text-slate-400"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
            <Link
              href="/matches/new"
              className="flex-1 flex flex-col items-center justify-center space-y-1 text-primary"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Plus className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-medium">New</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
} 