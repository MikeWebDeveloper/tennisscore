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
  const [isExpanded, setIsExpanded] = useState(false)

  const handleNavigation = () => {
    // Haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    setIsExpanded(false) // Auto-collapse after navigation
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <motion.nav 
      initial={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40"
      role="navigation"
      aria-label="Main navigation"
    >
      <motion.div
        animate={{ height: isExpanded ? "auto" : "3rem" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="bg-card border-t border-border shadow-lg relative overflow-hidden"
      >
        {/* Compact Handle - Always Visible */}
        <motion.button
          onClick={toggleExpanded}
          whileTap={{ scale: 0.95 }}
          className="w-full h-12 flex items-center justify-center bg-card/95 backdrop-blur-sm hover:bg-accent/50 transition-colors group relative"
          aria-expanded={isExpanded}
          aria-controls="mobile-navigation-content"
          aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
        >
          {/* Compact indicator showing current page */}
          <div className="flex items-center gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              if (!isActive) return null
              return (
                <div key={item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              )
            })}
            {!navigation.some(item => pathname === item.href) && (
              <span className="text-sm font-medium text-muted-foreground">Menu</span>
            )}
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute right-4 group-hover:scale-125 transition-transform"
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
          </motion.div>
        </motion.button>

        {/* Full Navigation Content - Collapsible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="nav-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
              className="px-4 py-3 border-t border-border/50"
              id="mobile-navigation-content"
              role="menu"
              aria-label="Navigation options"
            >
              <div className="flex items-center justify-around">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <motion.div
                      key={item.href}
                      whileTap={{ scale: 0.9 }}
                      className="min-w-[4rem]"
                    >
                      <Link
                        href={item.href}
                        onClick={handleNavigation}
                        className={cn(
                          "flex flex-col items-center space-y-1 px-3 py-2 text-xs transition-all rounded-xl",
                          isActive 
                            ? "text-primary bg-primary/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                        role="menuitem"
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`Navigate to ${item.label}`}
                      >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </motion.div>
                  )
                })}
                
                {/* Special "New Match" Button */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="min-w-[4rem]"
                >
                  <Link
                    href="/matches/new"
                    onClick={handleNavigation}
                    className="flex flex-col items-center space-y-1 px-3 py-2 text-xs text-foreground font-medium"
                    aria-label="Create new match"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-sm transition-colors">
                      <Plus className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <span>New</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  )
}