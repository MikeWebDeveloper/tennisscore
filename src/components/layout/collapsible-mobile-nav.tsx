"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Plus, ChevronUp } from "lucide-react"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}

interface CollapsibleMobileNavProps {
  navigation: NavItem[]
}

export function CollapsibleMobileNav({ navigation }: CollapsibleMobileNavProps) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const handleNavigation = () => {
    // Haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    setShowMore(false) // Auto-collapse after navigation
  }

  // Split navigation into core and additional items
  const coreNavItems = navigation.slice(0, 3) // Dashboard, Matches, Players
  const moreNavItems = navigation.slice(3) // Any additional nav items

  return (
    <motion.nav 
      initial={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <div className="bg-card border-t border-border shadow-lg">
        {/* Core Navigation - Always Visible */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-around">
            {coreNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.href}
                  whileTap={{ scale: 0.9 }}
                  className="flex-1 max-w-[5rem]"
                >
                  <Link
                    href={item.href}
                    onClick={handleNavigation}
                    className={cn(
                      "flex flex-col items-center space-y-1 px-2 py-2 text-xs transition-all rounded-xl",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium truncate">{item.label}</span>
                  </Link>
                </motion.div>
              )
            })}
            
            {/* Special "New Match" Button */}
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex-1 max-w-[5rem]"
            >
              <Link
                href="/matches/new"
                onClick={handleNavigation}
                className="flex flex-col items-center space-y-1 px-2 py-2 text-xs text-foreground font-medium"
              >
                <div className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-sm transition-colors">
                  <Plus className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="truncate">New</span>
              </Link>
            </motion.div>

            {/* More button (only if there are additional nav items) */}
            {moreNavItems.length > 0 && (
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex-1 max-w-[5rem]"
              >
                <button
                  onClick={() => setShowMore(!showMore)}
                  className={cn(
                    "flex flex-col items-center space-y-1 px-2 py-2 text-xs transition-all rounded-xl w-full",
                    showMore 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <motion.div
                    animate={{ rotate: showMore ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </motion.div>
                  <span className="font-medium truncate">More</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Additional Navigation - Collapsible */}
        <AnimatePresence>
          {showMore && moreNavItems.length > 0 && (
            <motion.div
              key="more-nav-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", transition: { delay: 0.1, duration: 0.3 } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
              className="border-t border-border/50 px-4 py-3"
            >
              <div className="flex items-center justify-around">
                {moreNavItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.href}
                      whileTap={{ scale: 0.9 }}
                      className="flex-1 max-w-[5rem]"
                    >
                      <Link
                        href={item.href}
                        onClick={handleNavigation}
                        className={cn(
                          "flex flex-col items-center space-y-1 px-2 py-2 text-xs transition-all rounded-xl",
                          isActive 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium truncate">{item.label}</span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
} 