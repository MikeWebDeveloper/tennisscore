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
    description: "Overview & Statistics"
  },
  {
    href: "/matches",
    icon: Trophy,
    label: "Matches",
    description: "Live Scoring & History"
  },
  {
    href: "/players",
    icon: Users,
    label: "Players",
    description: "Manage Player Profiles"
  }
]

const sidebarVariants = {
  open: { x: 0 },
  closed: { x: "-100%" }
}

const overlayVariants = {
  open: { opacity: 1 },
  closed: { opacity: 0 }
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:block md:w-72 md:overflow-y-auto md:border-r md:border-slate-800 bg-slate-900/95 backdrop-blur-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center px-6 py-8 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 font-satoshi">TennisScore</h1>
                <p className="text-sm text-slate-500 font-inter">Professional Analytics</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-4 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-4 transition-colors",
                    isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                  )} />
                  <div>
                    <div className={cn(
                      "font-medium font-satoshi",
                      isActive ? "text-primary" : "group-hover:text-slate-200"
                    )}>
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-500 font-inter">
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Quick Action */}
          <div className="px-4 py-4">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-semibold font-satoshi">
              <Link href="/matches/new">
                <Plus className="h-4 w-4 mr-2" />
                New Match
              </Link>
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary/20 text-primary border border-primary/30 font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate font-satoshi">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate font-inter">
                  {user.email}
                </p>
              </div>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:pl-72 pt-20 md:pt-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-slate-100 font-satoshi">TennisScore</span>
            </div>

            <Avatar className="h-8 w-8">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Bottom Tab Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mb-1",
                    isActive ? "text-primary" : ""
                  )} />
                  <span className={cn(
                    "text-xs font-medium font-satoshi truncate",
                    isActive ? "text-primary" : ""
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            {/* New Match FAB */}
            <Link
              href="/matches/new"
              className="flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mb-1">
                <Plus className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-medium font-satoshi text-primary">
                New
              </span>
            </Link>
          </div>
        </nav>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                variants={overlayVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-slate-900 border-r border-slate-800"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-6 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold text-slate-100 font-satoshi">TennisScore</h1>
                        <p className="text-xs text-slate-500 font-inter">Professional Analytics</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center px-4 py-3 rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 mr-3",
                            isActive ? "text-primary" : "text-slate-500"
                          )} />
                          <div>
                            <div className={cn(
                              "font-medium font-satoshi",
                              isActive ? "text-primary" : ""
                            )}>
                              {item.label}
                            </div>
                            <div className="text-xs text-slate-500 font-inter">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </nav>

                  {/* Quick Action */}
                  <div className="px-4 py-4">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-black font-semibold font-satoshi">
                      <Link href="/matches/new" onClick={() => setSidebarOpen(false)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Match
                      </Link>
                    </Button>
                  </div>

                  {/* User Profile */}
                  <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary border border-primary/30 font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate font-satoshi">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate font-inter">
                          {user.email}
                        </p>
                      </div>
                      <form action={signOut}>
                        <Button variant="ghost" size="sm" type="submit" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200">
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 