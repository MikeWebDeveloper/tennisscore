"use client"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Users, Trophy, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/players",
    label: "Players",
    icon: Users,
  },
  {
    href: "/matches/new",
    label: "New Match",
    icon: Plus,
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Trophy,
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    // Haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    
    router.push(href)
  }

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700">
        <div className="safe-area-pb px-4 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <motion.button
                  key={item.href}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors",
                    "min-w-[3.5rem] min-h-[3rem]",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    <Icon 
                      className={cn(
                        "h-5 w-5 transition-all",
                        isActive ? "scale-110" : "scale-100"
                      )} 
                    />
                    
                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <span className="text-xs text-white font-semibold">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={cn(
                      "text-xs font-medium mt-1 transition-colors relative z-10",
                      isActive ? "text-primary" : "text-slate-500"
                    )}
                  >
                    {item.label}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

// Spacer component to prevent content from being hidden behind bottom nav
export function MobileBottomNavSpacer() {
  return <div className="h-20 md:hidden" />
} 