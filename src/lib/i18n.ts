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
  
  // Navigation
  dashboard: string
  matches: string
  players: string
  settings: string
  
  // Navigation descriptions
  overviewStats: string
  matchHistory: string
  managePlayers: string
  
  // Theme
  lightMode: string
  darkMode: string
  
  // Match scoring and setup
  newMatch: string
  winner: string
  score: string
  points: string
  
  // Match setup
  matchType: string
  singles: string
  doubles: string
  player1: string
  player2: string
  player3: string
  player4: string
  advantage: string
  noAdvantage: string
  finalSet: string
  fullSet: string
  bestOf1: string
  bestOf3: string
  bestOf5: string
  noTracking: string
  startMatch: string
  
  // Stats
  totalPoints: string
  totalPointsWon: string
  winners: string
  unforcedErrors: string
  aces: string
  doubleFaults: string
  servicePoints: string
  receivingPoints: string
  pointsAndOutcomes: string
  serviceStatistics: string
  breakPoints: string
  forcedErrors: string
  
  // Detailed stats
  firstServePercentage: string
  firstServePointsWonPercentage: string
  breakPointsWon: string
  breakPointConversion: string
  breakPointsFaced: string
  breakPointsConverted: string
  breakPointsSaved: string
  conversionRatePercent: string
  
  // Point outcomes
  ace: string
  aceDescription: string
  winnerDescription: string
  forcedError: string
  forcedErrorDescription: string
  unforcedError: string
  unforcedErrorDescription: string
  doubleFault: string
  doubleFaultDescription: string
  
  // Player management
  firstName: string
  lastName: string
  yearOfBirth: string
  rating: string
  club: string
  playingHand: string
  left: string
  right: string
  createPlayer: string
  editPlayer: string
  mainPlayer: string
  born: string
  plays: string
  leftHanded: string
  rightHanded: string
  
  // Image upload
  replaceWithNewImage: string
  editCrop: string
  removeImage: string
  upload: string
  
  // Dashboard
  welcomeToTennisScore: string
  performanceTrackingStarts: string
  welcomeBack: string
  dashboardSubtitle: string
  readyToElevate: string
  
  // Stats cards
  totalMatches: string
  inProgress: string
  completed: string
  winRate: string
  excellent: string
  good: string
  fair: string
  needsWork: string
  playersCreated: string
  performance: string
  overallRating: string
  hot: string
  noMatchesYet: string
  
  // Point by point view
  noPointDataAvailable: string
  set: string
  lostServe: string
  matchPoint: string
  setPoint: string
  breakPoint: string
  
  // Enhanced bento grid
  performanceOverviewHeader: string
  performanceOverviewDescription: string
  matchesWon: string
  ofTotal: string
  qualityExcellent: string
  qualityGood: string
  qualityWorkNeeded: string
  completedDescription: string
  winStreakLabel: string
  best: string
  serveStatisticsHeader: string
  serveStatisticsDescription: string
  acesLabel: string
  firstServePercentageLabel: string
  servicePointsLabel: string
  pointsWonServing: string
  doubleFaultsLabel: string
  returnGameHeader: string
  returnGameDescription: string
  breakPointsWonLabel: string
  opportunitiesConverted: string
  returnPointsLabel: string
  pointsWonReturning: string
  breakPointsSavedLabel: string
  defensiveHolds: string
  firstReturnPercentageLabel: string
  qualityImproving: string
  shotMakingHeader: string
  shotMakingDescription: string
  winnersLabel: string
  unforcedErrorsLabel: string
  unforcedErrorsDescription: string
  performanceOverview: string
  last30Days: string
  recentMatches: string
  viewAll: string
  vs: string
  thisMonthHeader: string
  matchesLabel: string
  
  // Match deletion
  deleteMatch: string
  deleteMatchConfirm: string
  matchDeleted: string
  failedToDeleteMatch: string
  deleting: string
  
  // Common actions
  add: string
  close: string
  confirm: string
  
  // Error messages
  errorOccurred: string
  tryAgain: string
  
  // Success messages
  playerCreated: string
  matchCreated: string
  
  // Stats descriptions
  statsWillAppearDescription: string
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
    
    // Navigation
    dashboard: "Dashboard",
    matches: "Matches",
    players: "Players",
    settings: "Settings",
    
    // Navigation descriptions
    overviewStats: "Overview & stats",
    matchHistory: "Match history",
    managePlayers: "Manage players",
    
    // Theme
    lightMode: "Light mode",
    darkMode: "Dark mode",
    
    // Match scoring and setup
    newMatch: "New Match",
    winner: "Winner",
    score: "Score",
    points: "Points",
    
    // Match setup
    matchType: "Match Type",
    singles: "Singles",
    doubles: "Doubles",
    player1: "Player 1",
    player2: "Player 2",
    player3: "Player 3",
    player4: "Player 4",
    advantage: "With advantage",
    noAdvantage: "No advantage",
    finalSet: "Final set",
    fullSet: "Full set",
    bestOf1: "Best of 1",
    bestOf3: "Best of 3",
    bestOf5: "Best of 5",
    noTracking: "(no tracking)",
    startMatch: "Start Match",
    
    // Stats
    totalPoints: "Total Points",
    totalPointsWon: "Total Points Won",
    winners: "Winners",
    unforcedErrors: "Unforced Errors",
    aces: "Aces",
    doubleFaults: "Double Faults",
    servicePoints: "Service Points %",
    receivingPoints: "Receiving Points %",
    pointsAndOutcomes: "Points & Outcomes",
    serviceStatistics: "Service Statistics",
    breakPoints: "Break Points",
    forcedErrors: "Forced Errors",
    
    // Detailed stats
    firstServePercentage: "First Serve %",
    firstServePointsWonPercentage: "First Serve Points Won %",
    breakPointsWon: "Break Points Won",
    breakPointConversion: "Break Point Conversion %",
    breakPointsFaced: "Break Points Faced",
    breakPointsConverted: "Break Points Converted",
    breakPointsSaved: "Break Points Saved",
    conversionRatePercent: "Conversion Rate %",
    
    // Point outcomes
    ace: "Ace",
    aceDescription: "Unreturnable serve",
    winnerDescription: "Clean winner",
    forcedError: "Forced Error",
    forcedErrorDescription: "Opponent forced into error",
    unforcedError: "Unforced Error",
    unforcedErrorDescription: "Unforced mistake",
    doubleFault: "Double Fault",
    doubleFaultDescription: "Two consecutive faults",
    
    // Player management
    firstName: "First Name",
    lastName: "Last Name",
    yearOfBirth: "Year of Birth",
    rating: "Rating",
    club: "Club",
    playingHand: "Playing Hand",
    left: "Left",
    right: "Right",
    createPlayer: "Create Player",
    editPlayer: "Edit Player",
    mainPlayer: "Main Player",
    born: "Born",
    plays: "Plays",
    leftHanded: "Left-handed",
    rightHanded: "Right-handed",
    
    // Image upload
    replaceWithNewImage: "Replace with new image",
    editCrop: "Edit crop",
    removeImage: "Remove image",
    upload: "Upload",
    
    // Dashboard
    welcomeToTennisScore: "Welcome to TennisScore",
    performanceTrackingStarts: "Your performance tracking starts here",
    welcomeBack: "Welcome back",
    dashboardSubtitle: "Track your progress and analyze your game",
    readyToElevate: "Ready to elevate your game?",
    
    // Stats cards
    totalMatches: "Total Matches",
    inProgress: "in progress",
    completed: "completed",
    winRate: "Win Rate",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needsWork: "Needs work",
    playersCreated: "players created",
    performance: "Performance",
    overallRating: "Overall rating",
    hot: "Hot",
    noMatchesYet: "No matches yet",
    
    // Point by point view
    noPointDataAvailable: "No point data available",
    set: "Set",
    lostServe: "Lost serve",
    matchPoint: "Match point",
    setPoint: "Set point",
    breakPoint: "Break point",
    
    // Enhanced bento grid
    performanceOverviewHeader: "Performance Overview",
    performanceOverviewDescription: "Track your wins, losses, and overall progress",
    matchesWon: "Matches Won",
    ofTotal: "of total",
    qualityExcellent: "Excellent",
    qualityGood: "Good",
    qualityWorkNeeded: "Work needed",
    completedDescription: "this month",
    winStreakLabel: "Win Streak",
    best: "Best",
    serveStatisticsHeader: "Service Statistics",
    serveStatisticsDescription: "Analyze your serving performance",
    acesLabel: "Aces",
    firstServePercentageLabel: "First Serve %",
    servicePointsLabel: "Service Points Won %",
    pointsWonServing: "Points won serving",
    doubleFaultsLabel: "Double Faults",
    returnGameHeader: "Return Game",
    returnGameDescription: "Break down your return statistics",
    breakPointsWonLabel: "Break Points Won %",
    opportunitiesConverted: "Opportunities converted",
    returnPointsLabel: "Return Points Won %",
    pointsWonReturning: "Points won returning",
    breakPointsSavedLabel: "Break Points Saved %",
    defensiveHolds: "Defensive holds",
    firstReturnPercentageLabel: "First Return %",
    qualityImproving: "Improving",
    shotMakingHeader: "Shot Making",
    shotMakingDescription: "Winners vs unforced errors analysis",
    winnersLabel: "Winners",
    unforcedErrorsLabel: "Unforced Errors",
    unforcedErrorsDescription: "Minimize these for better results",
    performanceOverview: "Performance Overview",
    last30Days: "Last 30 days",
    recentMatches: "Recent Matches",
    viewAll: "View all",
    vs: "vs",
    thisMonthHeader: "This Month",
    matchesLabel: "matches",
    
    // Match deletion
    deleteMatch: "Delete Match",
    deleteMatchConfirm: "Are you sure you want to delete this match between {p1} and {p2}? This action is irreversible and all match data will be permanently deleted.",
    matchDeleted: "Match deleted successfully",
    failedToDeleteMatch: "Failed to delete match",
    deleting: "Deleting...",
    
    // Common actions
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    
    // Error messages
    errorOccurred: "An error occurred",
    tryAgain: "Try again",
    
    // Success messages
    playerCreated: "Player created successfully",
    matchCreated: "Match created successfully",
    
    // Stats descriptions
    statsWillAppearDescription: "Stats will appear here once the first point is played"
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
    
    // Navigation
    dashboard: "Panel",
    matches: "Zápasy",
    players: "Hráči",
    settings: "Nastavení",
    
    // Navigation descriptions
    overviewStats: "Přehled a statistiky",
    matchHistory: "Historie zápasů",
    managePlayers: "Správa hráčů",
    
    // Theme
    lightMode: "Světlý režim",
    darkMode: "Tmavý režim",
    
    // Match scoring and setup
    newMatch: "Nový zápas",
    winner: "Vítězný úder",
    score: "Skóre",
    points: "Body",
    
    // Match setup
    matchType: "Typ zápasu",
    singles: "Dvouhra",
    doubles: "Čtyřhra",
    player1: "Hráč 1",
    player2: "Hráč 2",
    player3: "Hráč 3",
    player4: "Hráč 4",
    advantage: "S výhodou",
    noAdvantage: "Bez výhody",
    finalSet: "Poslední sada",
    fullSet: "Celý set",
    bestOf1: "Na 1 set",
    bestOf3: "Na 3 sety",
    bestOf5: "Na 5 setů",
    noTracking: "(bez sledování)",
    startMatch: "Začít zápas",
    
    // Stats
    totalPoints: "Celkem bodů",
    totalPointsWon: "Celkem vyhraných bodů",
    winners: "Vítězné údery",
    unforcedErrors: "Nevynucené chyby",
    aces: "Esa",
    doubleFaults: "Dvojchyby",
    servicePoints: "Body na podání %",
    receivingPoints: "Body na returnu %",
    pointsAndOutcomes: "Body a výsledky",
    serviceStatistics: "Statistiky podání",
    breakPoints: "Brejkboly",
    forcedErrors: "Vynucené chyby",
    
    // Detailed stats
    firstServePercentage: "1. podání %",
    firstServePointsWonPercentage: "Body na 1. podání %",
    breakPointsWon: "Vyhraté brejkboly",
    breakPointConversion: "Úspěšnost brejkbolů %",
    breakPointsFaced: "Čelené brejkboly",
    breakPointsConverted: "Proměněné brejkboly",
    breakPointsSaved: "Odvrácené brejkboly",
    conversionRatePercent: "Úspěšnost %",
    
    // Point outcomes
    ace: "Eso",
    aceDescription: "Nepreturnovatelný servis",
    winnerDescription: "Čistý vítězný úder",
    forcedError: "Vynucená chyba",
    forcedErrorDescription: "Soupeř donucen k chybě",
    unforcedError: "Nevynucená chyba",
    unforcedErrorDescription: "Nevynucená chyba",
    doubleFault: "Dvojchyba",
    doubleFaultDescription: "Dvě chyby v řadě (dvojchyba)",
    
    // Player management
    firstName: "Jméno",
    lastName: "Příjmení",
    yearOfBirth: "Rok narození",
    rating: "Hodnocení",
    club: "Klub",
    playingHand: "Hrací ruka",
    left: "Levá",
    right: "Pravá",
    createPlayer: "Vytvořit hráče",
    editPlayer: "Upravit hráče",
    mainPlayer: "Hlavní hráč",
    born: "Narozen",
    plays: "Hraje",
    leftHanded: "Levák",
    rightHanded: "Pravák",
    
    // Image upload
    replaceWithNewImage: "Nahradit novým obrázkem",
    editCrop: "Upravit ořez",
    removeImage: "Odebrat obrázek",
    upload: "Nahrát",
    
    // Dashboard
    welcomeToTennisScore: "Vítejte v TennisScore",
    performanceTrackingStarts: "Sledování vašich výkonů začíná zde",
    welcomeBack: "Vítejte zpět",
    dashboardSubtitle: "Sledujte svůj pokrok a analyzujte svou hru",
    readyToElevate: "Připraveni posunout svou hru na vyšší úroveň?",
    
    // Stats cards
    totalMatches: "Celkem zápasů",
    inProgress: "probíhá",
    completed: "dokončeno",
    winRate: "Úspěšnost",
    excellent: "Výborná",
    good: "Dobrá",
    fair: "Průměrná",
    needsWork: "Potřebuje zlepšení",
    playersCreated: "hráčů vytvořeno",
    performance: "Výkon",
    overallRating: "Celkové hodnocení",
    hot: "V pohodě",
    noMatchesYet: "Zatím žádné zápasy",
    
    // Point by point view
    noPointDataAvailable: "Nejsou k dispozici data o bodech",
    set: "Set",
    lostServe: "Ztráta podání",
    matchPoint: "Mečbol",
    setPoint: "Setbol",
    breakPoint: "Brejkbol",
    
    // Enhanced bento grid
    performanceOverviewHeader: "Přehled výkonů",
    performanceOverviewDescription: "Sledujte své výhry, porážky a celkový pokrok",
    matchesWon: "Vyhraných zápasů",
    ofTotal: "z celkem",
    qualityExcellent: "Výborná",
    qualityGood: "Dobrá",
    qualityWorkNeeded: "Potřebuje práci",
    completedDescription: "tento měsíc",
    winStreakLabel: "Vítězná série",
    best: "Nejlepší",
    serveStatisticsHeader: "Statistiky podání",
    serveStatisticsDescription: "Analyzujte svůj výkon při podání",
    acesLabel: "Esa",
    firstServePercentageLabel: "1. podání %",
    servicePointsLabel: "Body na podání %",
    pointsWonServing: "Body vyhrané při podání",
    doubleFaultsLabel: "Dvojchyby",
    returnGameHeader: "Return",
    returnGameDescription: "Rozbor vašich statistik returnu",
    breakPointsWonLabel: "Brejkboly vyhrané %",
    opportunitiesConverted: "Proměněné příležitosti",
    returnPointsLabel: "Body na returnu %",
    pointsWonReturning: "Body vyhrané na returnu",
    breakPointsSavedLabel: "Odvrácené brejkboly %",
    defensiveHolds: "Obranná udržení",
    firstReturnPercentageLabel: "1. return %",
    qualityImproving: "Zlepšující se",
    shotMakingHeader: "Útočná hra",
    shotMakingDescription: "Analýza vítězných úderů vs nevynucených chyb",
    winnersLabel: "Vítězné údery",
    unforcedErrorsLabel: "Nevynucené chyby",
    unforcedErrorsDescription: "Minimalizujte je pro lepší výsledky",
    performanceOverview: "Přehled výkonů",
    last30Days: "Posledních 30 dní",
    recentMatches: "Nedávné zápasy",
    viewAll: "Zobrazit vše",
    vs: "vs",
    thisMonthHeader: "Tento měsíc",
    matchesLabel: "zápasů",
    
    // Match deletion
    deleteMatch: "Smazat zápas",
    deleteMatchConfirm: "Opravdu chcete smazat tento zápas mezi {p1} a {p2}? Tato akce je nevratná a všechna data zápasu budou trvale odstraněna.",
    matchDeleted: "Zápas byl úspěšně smazán",
    failedToDeleteMatch: "Nepodařilo se smazat zápas",
    deleting: "Mazání...",
    
    // Common actions
    add: "Přidat",
    close: "Zavřít",
    confirm: "Potvrdit",
    
    // Error messages
    errorOccurred: "Nastala chyba",
    tryAgain: "Zkusit znovu",
    
    // Success messages
    playerCreated: "Hráč úspěšně vytvořen",
    matchCreated: "Zápas úspěšně vytvořen",
    
    // Stats descriptions
    statsWillAppearDescription: "Statistiky se zobrazí zde po odehrání prvního bodu"
  }
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en
}

export function t(locale: Locale, key: keyof Translations): string {
  const trans = getTranslations(locale)
  return trans[key] || translations.en[key] || key
} 