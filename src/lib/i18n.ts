export type Locale = 'en' | 'cs'

export interface Translations {
  // Common
  loading: string
  save: string
  cancel: string
  delete: string
  edit: string
  create: string
  share: string
  back: string
  signOut: string
  lightMode: string
  darkMode: string
  
  // Navigation
  dashboard: string
  matches: string
  players: string
  profile: string
  
  // Dashboard specific
  welcomeBack: string
  welcomeToTennisScore: string
  dashboardSubtitle: string
  performanceTrackingStarts: string
  readyToElevate: string
  
  // Match scoring
  newMatch: string
  liveScoring: string
  matchCompleted: string
  winner: string
  score: string
  sets: string
  games: string
  points: string
  
  // Players
  firstName: string
  lastName: string
  yearOfBirth: string
  rating: string
  club: string
  playingHand: string
  left: string
  right: string
  
  // Match details
  matchDetails: string
  overview: string
  pointLog: string
  statistics: string
  analysis: string
  duration: string
  started: string
  finished: string
  
  // Match retirement
  endMatch: string
  retired: string
  weather: string
  injury: string
  matchEndedDue: string
  
  // Stats
  totalPoints: string
  winners: string
  unforcedErrors: string
  aces: string
  doubleFaults: string
  firstServePercentage: string
  breakPoints: string
  
  // Time formats
  minutes: string
  hours: string
  ago: string
  
  // Match information
  date: string
  time: string
  format: string
  type: string
  singles: string
  doubles: string
  bestOf: string
  noAd: string
  traditional: string
  completed: string
  inProgress: string
  reason: string
  
  // Match stats detailed
  totalPointsPlayed: string
  setsCompleted: string
  serviceGames: string
  breaksOfServe: string
  lastTenPoints: string
  momentumTracker: string
  conversionRate: string
  breakPointPressure: string
  breakPointsCreated: string
  breakPointsConverted: string
  serviceDominance: string
  serviceGamesHeld: string
  gamesLostOnServe: string
  pointDistributionAnalysis: string
  performanceInsights: string
  servicePower: string
  pressurePoints: string
  matchRhythm: string
  playingPace: string
  
  // Analysis insights
  excellentConversion: string
  goodConversion: string
  roomForImprovement: string
  perfectServiceRecord: string
  strongServiceGames: string
  serviceUnderPressure: string
  
  // Profile picture
  uploadNewPicture: string
  optional: string
  
  // Errors
  invalidDocumentStructure: string
  unknownAttribute: string
  
  // Additional translations for mobile & UI
  backToMatches: string
  shareResults: string
  shareLive: string
  continuScoring: string
  copied: string
  view: string
  unknown: string
  totalAces: string
  doublesMatch: string
  teams: string
  standard: string
  setBySetBreakdown: string
  set: string
  matchAnalysisInsights: string
  matchSummary: string
  ended: string
  finish: string
  refresh: string
  liveMatch: string
  vs: string
  live: string
  changeServer: string
  cannotChangeServer: string
  switchServer: string
  liveScoreboard: string
}

const translations: Record<Locale, Translations> = {
  en: {
    // Common
    loading: "Loading",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    share: "Share",
    back: "Back",
    signOut: "Sign Out",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    
    // Navigation
    dashboard: "Dashboard",
    matches: "Matches",
    players: "Players",
    profile: "Profile",
    
    // Dashboard specific
    welcomeBack: "Welcome back",
    welcomeToTennisScore: "Welcome to TennisScore",
    dashboardSubtitle: "Track your tennis performance and improve your game",
    performanceTrackingStarts: "Your tennis performance tracking starts here",
    readyToElevate: "Ready to elevate your game? Start tracking matches and analyzing your performance.",
    
    // Match scoring
    newMatch: "New Match",
    liveScoring: "Live Scoring",
    matchCompleted: "Match Completed",
    winner: "Winner",
    score: "Score",
    sets: "Sets",
    games: "Games",
    points: "Points",
    
    // Players
    firstName: "First Name",
    lastName: "Last Name",
    yearOfBirth: "Year of Birth",
    rating: "Rating",
    club: "Club",
    playingHand: "Playing Hand",
    left: "Left",
    right: "Right",
    
    // Match details
    matchDetails: "Match Details",
    overview: "Overview",
    pointLog: "Point Log",
    statistics: "Statistics",
    analysis: "Analysis",
    duration: "Duration",
    started: "Started",
    finished: "Finished",
    
    // Match retirement
    endMatch: "End Match",
    retired: "Retired",
    weather: "Weather",
    injury: "Injury",
    matchEndedDue: "Match ended due to",
    
    // Stats
    totalPoints: "Total Points",
    winners: "Winners",
    unforcedErrors: "Unforced Errors",
    aces: "Aces",
    doubleFaults: "Double Faults",
    firstServePercentage: "First Serve %",
    breakPoints: "Break Points",
    
    // Time formats
    minutes: "minutes",
    hours: "hours",
    ago: "ago",
    
    // Match information
    date: "Date",
    time: "Time",
    format: "Format",
    type: "Type",
    singles: "Singles",
    doubles: "Doubles",
    bestOf: "Best of",
    noAd: "No-Ad",
    traditional: "Traditional",
    completed: "Completed",
    inProgress: "In Progress",
    reason: "Reason",
    
    // Match stats detailed
    totalPointsPlayed: "Total Points Played",
    setsCompleted: "Sets Completed",
    serviceGames: "Service Games",
    breaksOfServe: "Breaks of Serve",
    lastTenPoints: "Last 10 Points",
    momentumTracker: "Momentum Tracker",
    conversionRate: "Conversion Rate",
    breakPointPressure: "Break Point Pressure",
    breakPointsCreated: "Break Points Created",
    breakPointsConverted: "Break Points Converted",
    serviceDominance: "Service Dominance",
    serviceGamesHeld: "Service Games Held",
    gamesLostOnServe: "Games Lost on Serve",
    pointDistributionAnalysis: "Point Distribution Analysis",
    performanceInsights: "Performance Insights",
    servicePower: "Service power",
    pressurePoints: "Pressure points",
    matchRhythm: "Match rhythm",
    playingPace: "Playing pace",
    
    // Analysis insights
    excellentConversion: "Excellent conversion rate - efficient in big moments",
    goodConversion: "Good conversion rate - capitalizing on opportunities",
    roomForImprovement: "Room for improvement on big points",
    perfectServiceRecord: "Perfect service record - no breaks of serve",
    strongServiceGames: "Strong service games - rarely broken",
    serviceUnderPressure: "Service games under pressure",
    
    // Profile picture
    uploadNewPicture: "Upload new picture",
    optional: "optional",
    
    // Errors
    invalidDocumentStructure: "Invalid document structure",
    unknownAttribute: "Unknown attribute",
    
    // Additional translations for mobile & UI
    backToMatches: "Back to Matches",
    shareResults: "Share Results",
    shareLive: "Share Live",
    continuScoring: "Continue Scoring",
    copied: "Copied!",
    view: "View",
    unknown: "Unknown",
    totalAces: "Total Aces",
    doublesMatch: "Doubles Match",
    teams: "Teams",
    standard: "Standard",
    setBySetBreakdown: "Set by Set Breakdown",
    set: "Set",
    matchAnalysisInsights: "Match Analysis & Insights",
    matchSummary: "Match Summary",
    ended: "Ended",
    finish: "Finished",
    refresh: "Refresh",
    liveMatch: "Live Match",
    vs: "vs",
    live: "Live",
    changeServer: "Change Server",
    cannotChangeServer: "Cannot change server after match has started.",
    switchServer: "Switch server",
    liveScoreboard: "Live Scoreboard"
  },
  cs: {
    // Common
    loading: "Načítání",
    save: "Uložit",
    cancel: "Zrušit",
    delete: "Smazat",
    edit: "Upravit",
    create: "Vytvořit",
    share: "Sdílet",
    back: "Zpět",
    signOut: "Odhlásit se",
    lightMode: "Světlý režim",
    darkMode: "Tmavý režim",
    
    // Navigation
    dashboard: "Přehled",
    matches: "Zápasy",
    players: "Hráči",
    profile: "Profil",
    
    // Dashboard specific
    welcomeBack: "Vítejte zpět",
    welcomeToTennisScore: "Vítejte v TennisScore",
    dashboardSubtitle: "Sledujte svůj tenisový výkon a zlepšujte svou hru",
    performanceTrackingStarts: "Sledování vašeho tenisového výkonu začíná zde",
    readyToElevate: "Připraveni zvýšit úroveň své hry? Začněte sledovat zápasy a analyzovat svůj výkon.",
    
    // Match scoring
    newMatch: "Nový zápas",
    liveScoring: "Živé skórování",
    matchCompleted: "Zápas dokončen",
    winner: "Vítěz",
    score: "Skóre",
    sets: "Sety",
    games: "Hry",
    points: "Body",
    
    // Players
    firstName: "Jméno",
    lastName: "Příjmení",
    yearOfBirth: "Rok narození",
    rating: "Hodnocení",
    club: "Klub",
    playingHand: "Hrací ruka",
    left: "Levá",
    right: "Pravá",
    
    // Match details
    matchDetails: "Detail zápasu",
    overview: "Přehled",
    pointLog: "Seznam bodů",
    statistics: "Statistiky",
    analysis: "Analýza",
    duration: "Délka",
    started: "Začátek",
    finished: "Konec",
    
    // Match retirement
    endMatch: "Ukončit zápas",
    retired: "Vzdáno",
    weather: "Počasí",
    injury: "Zranění",
    matchEndedDue: "Zápas ukončen kvůli",
    
    // Stats
    totalPoints: "Celkem bodů",
    winners: "Vítězné údery",
    unforcedErrors: "Nevynucené chyby",
    aces: "Esa",
    doubleFaults: "Dvojchyby",
    firstServePercentage: "První servis %",
    breakPoints: "Brejkboly",
    
    // Time formats
    minutes: "minut",
    hours: "hodin",
    ago: "před",
    
    // Match information
    date: "Datum",
    time: "Čas",
    format: "Formát",
    type: "Typ",
    singles: "Singl",
    doubles: "Čtyřhra",
    bestOf: "Na",
    noAd: "Bez výhody",
    traditional: "Tradiční",
    completed: "Dokončeno",
    inProgress: "Probíhá",
    reason: "Důvod",
    
    // Match stats detailed
    totalPointsPlayed: "Celkem odehraných bodů",
    setsCompleted: "Dokončené sety",
    serviceGames: "Podání gemů",
    breaksOfServe: "Prolomení podání",
    lastTenPoints: "Posledních 10 bodů",
    momentumTracker: "Sledování momentu",
    conversionRate: "Úspěšnost proměňování",
    breakPointPressure: "Tlak brejkbolů",
    breakPointsCreated: "Vytvořené brejkboly",
    breakPointsConverted: "Proměněné brejkboly",
    serviceDominance: "Dominance podání",
    serviceGamesHeld: "Udržené podací gemy",
    gamesLostOnServe: "Ztracené gemy na podání",
    pointDistributionAnalysis: "Analýza rozdělení bodů",
    performanceInsights: "Pozorování výkonu",
    servicePower: "Síla podání",
    pressurePoints: "Tlakové body",
    matchRhythm: "Rytmus zápasu",
    playingPace: "Tempo hry",
    
    // Analysis insights
    excellentConversion: "Vynikající úspěšnost - efektivní ve velkých momentech",
    goodConversion: "Dobrá úspěšnost - využívá příležitosti",
    roomForImprovement: "Prostor pro zlepšení u důležitých bodů",
    perfectServiceRecord: "Perfektní podání - žádné prolomení",
    strongServiceGames: "Silné podací gemy - zřídka prolomené",
    serviceUnderPressure: "Podací gemy pod tlakem",
    
    // Profile picture
    uploadNewPicture: "Nahrát nový obrázek",
    optional: "volitelné",
    
    // Errors
    invalidDocumentStructure: "Neplatná struktura dokumentu",
    unknownAttribute: "Neznámý atribut",
    
    // Additional translations for mobile & UI
    backToMatches: "Zpět na zápasy",
    shareResults: "Sdílet výsledky",
    shareLive: "Sdílet živě",
    continuScoring: "Pokračovat ve skórování",
    copied: "Zkopírováno!",
    view: "Zobrazit",
    unknown: "Neznámý",
    totalAces: "Celkem es",
    doublesMatch: "Čtyřhra",
    teams: "Týmy",
    standard: "Standardní",
    setBySetBreakdown: "Rozpis setů",
    set: "Set",
    matchAnalysisInsights: "Analýza a pozorování zápasu",
    matchSummary: "Souhrn zápasu",
    ended: "Ukončeno",
    finish: "Dokončeno",
    refresh: "Obnovit",
    liveMatch: "Živý zápas",
    vs: "vs",
    live: "Živě",
    changeServer: "Změnit podávajícího",
    cannotChangeServer: "Nelze změnit podávajícího po začátku zápasu.",
    switchServer: "Přepnout podávajícího",
    liveScoreboard: "Živé skóre"
  }
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en
}

export function t(locale: Locale, key: keyof Translations): string {
  const trans = getTranslations(locale)
  return trans[key] || translations.en[key] || key
} 