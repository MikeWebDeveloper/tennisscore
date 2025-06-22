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
  const [isCollapsed, setIsCollapsed] = useState(true)

  const handleNavigation = () => {
    // Haptic feedback for navigation
    if ('vibrate' in navigator) {
      navigator.vibrate(30)
    }
    setIsCollapsed(true) // Auto-collapse after navigation
  }

  return (
    <motion.nav 
      initial={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40"
    >
      <motion.div
        animate={{ height: isCollapsed ? "2rem" : "auto" }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="bg-card border-t border-border shadow-lg relative overflow-hidden"
      >
        {/* Minimal Collapse/Expand Handle */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileTap={{ scale: 0.9 }}
          className="w-full h-8 flex items-center justify-center bg-card/95 backdrop-blur-sm hover:bg-accent/50 transition-colors group"
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="group-hover:scale-125 transition-transform"
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
          </motion.div>
        </motion.button>

        {/* Navigation Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              key="nav-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }}
              exit={{ opacity: 0, y: 10, transition: { duration: 0.2 } }}
              className="px-4 py-3"
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
                      >
                        <item.icon className="h-5 w-5" />
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
                  >
                    <div className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-sm transition-colors">
                      <Plus className="h-4 w-4 text-primary-foreground" />
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