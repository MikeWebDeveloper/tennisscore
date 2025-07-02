"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  GrandSlamTournament, 
  GrandSlamTheme, 
  grandSlamThemes, 
  applyThemeToElement,
  detectTournamentFromName 
} from "@/lib/themes/grand-slam-themes"

interface TournamentThemeContextType {
  tournament: GrandSlamTournament
  theme: GrandSlamTheme
  setTournament: (tournament: GrandSlamTournament) => void
  isGrandSlam: boolean
}

const TournamentThemeContext = createContext<TournamentThemeContextType | undefined>(undefined)

interface TournamentThemeProviderProps {
  children: React.ReactNode
  tournament?: GrandSlamTournament
  tournamentName?: string
  autoDetect?: boolean
}

export function TournamentThemeProvider({ 
  children, 
  tournament, 
  tournamentName,
  autoDetect = false 
}: TournamentThemeProviderProps) {
  const [currentTournament, setCurrentTournament] = useState<GrandSlamTournament>('default')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Determine tournament from props or auto-detection
  useEffect(() => {
    let detectedTournament: GrandSlamTournament = 'default'
    
    if (tournament) {
      detectedTournament = tournament
    } else if (tournamentName && autoDetect) {
      detectedTournament = detectTournamentFromName(tournamentName)
    }
    
    if (detectedTournament !== currentTournament) {
      setIsTransitioning(true)
      
      // Small delay to show transition effect
      setTimeout(() => {
        setCurrentTournament(detectedTournament)
        setIsTransitioning(false)
      }, 150)
    }
  }, [tournament, tournamentName, autoDetect, currentTournament])

  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyThemeToElement(document.body, currentTournament)
    }
  }, [currentTournament])

  const theme = grandSlamThemes[currentTournament]
  const isGrandSlam = currentTournament !== 'default'

  const contextValue: TournamentThemeContextType = {
    tournament: currentTournament,
    theme,
    setTournament: setCurrentTournament,
    isGrandSlam,
  }

  return (
    <TournamentThemeContext.Provider value={contextValue}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTournament}
          initial={{ opacity: isTransitioning ? 0.8 : 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.3 }}
          className={`tournament-theme tournament-${currentTournament}`}
          style={{
            background: theme.gradients.background,
            color: theme.colors.text,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </TournamentThemeContext.Provider>
  )
}

// Hook for consuming theme context
export function useTournamentTheme() {
  const context = useContext(TournamentThemeContext)
  if (!context) {
    throw new Error('useTournamentTheme must be used within a TournamentThemeProvider')
  }
  return context
}

// Tournament header component that shows tournament info
export function TournamentHeader({ className = "" }: { className?: string }) {
  const { theme, tournament, isGrandSlam } = useTournamentTheme()
  
  if (!isGrandSlam) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`tournament-header bg-gradient-to-r ${className}`}
      style={{
        background: theme.gradients.primary,
        borderColor: theme.colors.border,
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tournament badge */}
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: theme.colors.accent,
                color: theme.colors.background,
              }}
            >
              {theme.name}
            </div>
            
            {/* Description */}
            <span 
              className="text-sm hidden sm:inline"
              style={{ color: theme.colors.textSecondary }}
            >
              {theme.description}
            </span>
          </div>
          
          {/* Court surface indicator */}
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded border-2"
              style={{
                backgroundColor: theme.court.color,
                borderColor: theme.court.lines,
              }}
            />
            <span className="text-xs uppercase tracking-wider hidden sm:inline">
              {tournament === 'wimbledon' ? 'Grass' : 
               tournament === 'french-open' ? 'Clay' : 'Hard Court'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Themed card component
export function TournamentCard({ 
  children, 
  className = "",
  style = {},
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  const { theme } = useTournamentTheme()
  
  return (
    <div
      className={`tournament-card rounded-lg border p-4 ${className}`}
      style={{
        background: theme.gradients.card,
        borderColor: theme.colors.border,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

// Themed button component
export function TournamentButton({ 
  children, 
  variant = 'primary',
  className = "",
  style = {},
  onClick,
  disabled,
  type
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent'
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}) {
  const { theme } = useTournamentTheme()
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
          color: theme.colors.text,
          borderColor: theme.colors.primary,
        }
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary,
          color: theme.colors.text,
          borderColor: theme.colors.secondary,
        }
      case 'accent':
        return {
          backgroundColor: theme.colors.accent,
          color: theme.colors.background,
          borderColor: theme.colors.accent,
        }
      default:
        return {}
    }
  }
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`tournament-button px-4 py-2 rounded-lg border font-medium transition-all ${className}`}
      style={{
        ...getVariantStyles(),
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  )
}

// Tournament selector component for forms
export function TournamentSelector({ 
  value, 
  onChange, 
  className = "" 
}: {
  value: GrandSlamTournament
  onChange: (tournament: GrandSlamTournament) => void
  className?: string
}) {
  const tournaments: GrandSlamTournament[] = ['default', 'wimbledon', 'us-open', 'french-open', 'australian-open']
  
  return (
    <div className={`tournament-selector ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {tournaments.map((tournament) => {
          const tournamentTheme = grandSlamThemes[tournament]
          const isSelected = value === tournament
          
          return (
            <motion.button
              key={tournament}
              type="button"
              onClick={() => onChange(tournament)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                isSelected ? 'ring-2 ring-offset-2' : ''
              }`}
              style={{
                backgroundColor: isSelected 
                  ? tournamentTheme.colors.primary 
                  : tournamentTheme.colors.surface,
                color: isSelected 
                  ? tournamentTheme.colors.text 
                  : tournamentTheme.colors.textSecondary,
                borderColor: tournamentTheme.colors.border,
              }}
            >
              <div className="flex flex-col items-center gap-1">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{
                    backgroundColor: tournamentTheme.court.color,
                    borderColor: tournamentTheme.court.lines,
                  }}
                />
                <span className="text-xs">{tournamentTheme.name}</span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
} 