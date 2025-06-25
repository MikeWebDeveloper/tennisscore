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
  winners: string
  unforcedErrors: string
  aces: string
  doubleFaults: string
  servicePoints: string
  receivingPoints: string
  pointsAndOutcomes: string
  serviceStatistics: string
  breakPoints: string
  
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
    winners: "Winners",
    unforcedErrors: "Unforced Errors",
    aces: "Aces",
    doubleFaults: "Double Faults",
    servicePoints: "Service Points %",
    receivingPoints: "Receiving Points %",
    pointsAndOutcomes: "Points & Outcomes",
    serviceStatistics: "Service Statistics",
    breakPoints: "Break Points",
    
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
    winners: "Vítězné údery",
    unforcedErrors: "Nevynucené chyby",
    aces: "Esa",
    doubleFaults: "Dvojchyby",
    servicePoints: "Body na podání %",
    receivingPoints: "Body na returnu %",
    pointsAndOutcomes: "Body a výsledky",
    serviceStatistics: "Statistiky podání",
    breakPoints: "Brejkboly",
    
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