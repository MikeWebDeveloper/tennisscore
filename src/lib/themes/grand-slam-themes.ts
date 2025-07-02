// Grand Slam Tournament Theming System
// Provides distinctive color schemes and styling for major tennis tournaments

export type GrandSlamTournament = 
  | 'wimbledon'
  | 'us-open'
  | 'french-open'
  | 'australian-open'
  | 'default'

export interface GrandSlamTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
  }
  gradients: {
    primary: string
    background: string
    card: string
  }
  court: {
    color: string
    lines: string
  }
  logo?: string
  description: string
}

export const grandSlamThemes: Record<GrandSlamTournament, GrandSlamTheme> = {
  wimbledon: {
    name: 'Wimbledon',
    colors: {
      primary: '#006633', // Dark green
      secondary: '#4A5D23', // Forest green
      accent: '#FFD700', // Championship gold
      background: '#0F1A0F', // Very dark green
      surface: '#1A2B1A', // Dark green surface
      text: '#E8F5E8', // Light green tint
      textSecondary: '#B8D4B8', // Muted green
      border: '#2D4A2D', // Green border
    },
    gradients: {
      primary: 'linear-gradient(135deg, #006633 0%, #4A5D23 100%)',
      background: 'linear-gradient(135deg, #0F1A0F 0%, #1A2B1A 50%, #0F1A0F 100%)',
      card: 'linear-gradient(135deg, rgba(26, 43, 26, 0.8) 0%, rgba(15, 26, 15, 0.9) 100%)',
    },
    court: {
      color: '#2F5F2F', // Grass court green
      lines: '#FFFFFF', // Traditional white lines
    },
    description: 'The Championship - Traditional grass court elegance'
  },

  'us-open': {
    name: 'US Open',
    colors: {
      primary: '#0066CC', // US Open blue
      secondary: '#003D7A', // Navy blue
      accent: '#FF6B35', // Energetic orange
      background: '#0A1428', // Dark navy
      surface: '#1E2A3A', // Blue-tinted dark
      text: '#E6F2FF', // Light blue tint
      textSecondary: '#B3D9FF', // Muted blue
      border: '#2D4A73', // Blue border
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0066CC 0%, #003D7A 100%)',
      background: 'linear-gradient(135deg, #0A1428 0%, #1E2A3A 50%, #0A1428 100%)',
      card: 'linear-gradient(135deg, rgba(30, 42, 58, 0.8) 0%, rgba(10, 20, 40, 0.9) 100%)',
    },
    court: {
      color: '#0066CC', // Hard court blue
      lines: '#FFFFFF', // White lines
    },
    description: 'The US Open - Electric energy and modern dynamism'
  },

  'french-open': {
    name: 'French Open',
    colors: {
      primary: '#CC4400', // Clay court orange
      secondary: '#8B2500', // Deep clay
      accent: '#FFD700', // French gold
      background: '#2A1A0F', // Dark clay
      surface: '#3D2A1A', // Clay-tinted dark
      text: '#FFE6D9', // Light clay tint
      textSecondary: '#D9B899', // Muted clay
      border: '#664433', // Clay border
    },
    gradients: {
      primary: 'linear-gradient(135deg, #CC4400 0%, #8B2500 100%)',
      background: 'linear-gradient(135deg, #2A1A0F 0%, #3D2A1A 50%, #2A1A0F 100%)',
      card: 'linear-gradient(135deg, rgba(61, 42, 26, 0.8) 0%, rgba(42, 26, 15, 0.9) 100%)',
    },
    court: {
      color: '#CC6633', // Clay court color
      lines: '#FFFFFF', // White lines
    },
    description: 'Roland Garros - Classic clay court tradition'
  },

  'australian-open': {
    name: 'Australian Open',
    colors: {
      primary: '#0099FF', // Australian blue
      secondary: '#006BB3', // Deep ocean blue
      accent: '#FF9900', // Australian gold/sunset
      background: '#0F1F2E', // Dark ocean blue
      surface: '#1A2F42', // Blue-tinted surface
      text: '#E6F7FF', // Light ocean tint
      textSecondary: '#B3E0FF', // Muted ocean blue
      border: '#2D5273', // Ocean border
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0099FF 0%, #006BB3 100%)',
      background: 'linear-gradient(135deg, #0F1F2E 0%, #1A2F42 50%, #0F1F2E 100%)',
      card: 'linear-gradient(135deg, rgba(26, 47, 66, 0.8) 0%, rgba(15, 31, 46, 0.9) 100%)',
    },
    court: {
      color: '#0099FF', // Hard court blue
      lines: '#FFFFFF', // White lines
    },
    description: 'Australian Open - Summer slam down under'
  },

  default: {
    name: 'Standard',
    colors: {
      primary: '#3B82F6', // Default blue
      secondary: '#1E40AF', // Dark blue
      accent: '#10B981', // Green accent
      background: '#0F172A', // Dark slate
      surface: '#1E293B', // Slate surface
      text: '#F8FAFC', // Light text
      textSecondary: '#CBD5E1', // Muted text
      border: '#334155', // Slate border
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      card: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
    },
    court: {
      color: '#3B82F6', // Standard court
      lines: '#FFFFFF', // White lines
    },
    description: 'Standard theme for all other tournaments'
  }
}

// Theme detection utilities
export const detectTournamentFromName = (tournamentName: string): GrandSlamTournament => {
  const name = tournamentName.toLowerCase()
  
  if (name.includes('wimbledon') || name.includes('championship')) {
    return 'wimbledon'
  }
  if (name.includes('us open') || name.includes('u.s. open')) {
    return 'us-open'
  }
  if (name.includes('french open') || name.includes('roland garros')) {
    return 'french-open'
  }
  if (name.includes('australian open')) {
    return 'australian-open'
  }
  
  return 'default'
}

// CSS custom properties generator
export const generateThemeCSS = (theme: GrandSlamTheme): string => {
  return `
    :root {
      --tournament-primary: ${theme.colors.primary};
      --tournament-secondary: ${theme.colors.secondary};
      --tournament-accent: ${theme.colors.accent};
      --tournament-background: ${theme.colors.background};
      --tournament-surface: ${theme.colors.surface};
      --tournament-text: ${theme.colors.text};
      --tournament-text-secondary: ${theme.colors.textSecondary};
      --tournament-border: ${theme.colors.border};
      --tournament-gradient-primary: ${theme.gradients.primary};
      --tournament-gradient-background: ${theme.gradients.background};
      --tournament-gradient-card: ${theme.gradients.card};
      --tournament-court-color: ${theme.court.color};
      --tournament-court-lines: ${theme.court.lines};
    }
  `
}

// Theme application functions
export const applyThemeToElement = (element: HTMLElement, tournament: GrandSlamTournament) => {
  const theme = grandSlamThemes[tournament]
  const css = generateThemeCSS(theme)
  
  // Create or update style element
  let styleElement = document.getElementById('tournament-theme-styles') as HTMLStyleElement
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = 'tournament-theme-styles'
    document.head.appendChild(styleElement)
  }
  
  styleElement.textContent = css
  
  // Add tournament class to body
  document.body.className = document.body.className.replace(/tournament-\w+/g, '')
  document.body.classList.add(`tournament-${tournament}`)
}

// React hook for theme management
export const useGrandSlamTheme = (tournament: GrandSlamTournament) => {
  const theme = grandSlamThemes[tournament]
  
  return {
    theme,
    tournament,
    applyTheme: () => applyThemeToElement(document.body, tournament),
    getTournamentName: () => theme.name,
    getThemeColors: () => theme.colors,
    getGradients: () => theme.gradients,
    getCourtStyle: () => theme.court,
  }
}

// Tournament selector options for forms
export const tournamentOptions = [
  { value: 'default', label: 'Regular Tournament', description: 'Standard styling' },
  { 
    value: 'wimbledon', 
    label: 'Wimbledon', 
    description: 'The Championship - Grass court tradition',
    icon: '🌱'
  },
  { 
    value: 'us-open', 
    label: 'US Open', 
    description: 'Electric energy - Hard court power',
    icon: '🇺🇸'
  },
  { 
    value: 'french-open', 
    label: 'French Open', 
    description: 'Roland Garros - Clay court elegance',
    icon: '🇫🇷'
  },
  { 
    value: 'australian-open', 
    label: 'Australian Open', 
    description: 'Summer slam - Hard court intensity',
    icon: '🇦🇺'
  },
] 