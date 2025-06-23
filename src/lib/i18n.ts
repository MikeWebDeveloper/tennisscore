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
  settings: string
  overviewStats: string
  matchHistory: string
  managePlayers: string
  
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
  
  // Create match form
  setUpMatch: string
  matchType: string
  quickMatch: string
  trackedPlayers: string
  actions: string
  createNewPlayer: string
  searchOrSelectPlayer: string
  noPlayersFound: string
  player1: string
  player2: string
  player3: string
  player4: string
  team1: string
  team2: string
  noTracking: string
  matchFormat: string
  numberOfSets: string
  bestOf1: string
  bestOf3: string
  bestOf5: string
  scoringSystem: string
  advantage: string
  noAdvantage: string
  finalSet: string
  fullSet: string
  superTiebreak: string
  scoringDetailLevel: string
  pointsOnly: string
  trackJustScore: string
  simpleStats: string
  acesDoubleFaultsWinnersErrors: string
  detailedStats: string
  shotPlacementRallyLength: string
  creatingMatch: string
  startMatch: string
  matchCreatedSuccessfully: string
  failedToCreateMatch: string
  searchByTyping: string
  
  // Dashboard
  winRate: string
  completedMatches: string
  totalMatches: string
  inProgressMatches: string
  profilesCreated: string
  startNewMatch: string
  beginScoringLiveMatch: string
  recentMatches: string
  viewAll: string
  noMatchesYet: string
  startYourFirstMatch: string
  matchVsOpponent: string
  yourPlayers: string
  addPlayer: string
  noPlayersCreated: string
  createYourFirstPlayer: string
  
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
  // New keys for point-by-point view
  server: string
  game: string
  lostServe: string
  // New keys for live scoring tabs
  statsTab: string
  pointsTab: string
  commentaryTab: string
  undo: string
  firstServe: string
  match: string
  
  // Dashboard Stats Cards
  performance: string
  inProgressWithCount: string
  completedWithCount: string
  playersCreated: string
  excellent: string
  good: string
  fair: string
  needsWork: string
  overallRating: string
  hot: string
  
  // Match creation and forms  
  singlesMatch: string
  trackBasicStats: string
  trackDetailedStats: string
  
  // Tennis stats
  servicePoints: string
  receivingPoints: string
  
  // Common actions
  add: string
  close: string
  confirm: string
  
  // Status and states
  upcoming: string
  
  // Time and dates
  today: string
  yesterday: string
  thisWeek: string
  thisMonth: string
  
  // Player management
  createPlayer: string
  editPlayer: string
  profilePicture: string
  
  // Error messages
  errorOccurred: string
  tryAgain: string
  connectionError: string
  loadingError: string
  
  // Success messages
  playerCreated: string
  playerUpdated: string
  matchCreated: string
  
  // Empty states
  noPlayersYet: string
  noDataAvailable: string
  
  // Dashboard bento grid specific
  matchesWon: string
  avgDuration: string
  winStreak: string
  setsWon: string
  activeMatches: string
  performanceOverview: string
  last30Days: string
  
  // Matches page specific
  yourMatches: string
  unableToLoadMatches: string
  matchesConnectivityIssue: string
  unknownPlayer: string
  noMatchesFound: string
  tennisMatchResults: string
  checkMatchResults: string
  matchSharedSuccessfully: string
  matchLinkCopied: string
  copyLinkManually: string
  final: string
  shareMatchResults: string
  player: string
  
  // Players page specific
  confirmDeletePlayer: string
  managePlayersDescription: string
  mainPlayer: string
  born: string
  plays: string
  leftHanded: string
  rightHanded: string
  addNewPlayerDescription: string
  uploadPictureOptional: string
  birthYear: string
  ratingPlaceholder: string
  clubPlaceholder: string
  selectOption: string
  setAsMainPlayer: string
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
    settings: "Settings",
    overviewStats: "Overview Stats",
    matchHistory: "Match History",
    managePlayers: "Manage Players",
    
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
    
    // Create match form
    setUpMatch: "Set Up Match",
    matchType: "Match Type",
    quickMatch: "Quick Match",
    trackedPlayers: "Tracked Players",
    actions: "Actions",
    createNewPlayer: "Create New Player",
    searchOrSelectPlayer: "Search or Select Player",
    noPlayersFound: "No players found",
    player1: "Player 1",
    player2: "Player 2",
    player3: "Player 3",
    player4: "Player 4",
    team1: "Team 1",
    team2: "Team 2",
    noTracking: "No Tracking",
    matchFormat: "Match Format",
    numberOfSets: "Number of Sets",
    bestOf1: "Best of 1",
    bestOf3: "Best of 3",
    bestOf5: "Best of 5",
    scoringSystem: "Scoring System",
    advantage: "Advantage",
    noAdvantage: "No Advantage",
    finalSet: "Final Set",
    fullSet: "Full Set",
    superTiebreak: "Super Tiebreak",
    scoringDetailLevel: "Scoring Detail Level",
    pointsOnly: "Points Only",
    trackJustScore: "Track Just Score",
    simpleStats: "Simple Stats",
    acesDoubleFaultsWinnersErrors: "Aces, Double Faults, Winners, Errors",
    detailedStats: "Detailed Stats",
    shotPlacementRallyLength: "Shot Placement, Rally Length",
    creatingMatch: "Creating Match",
    startMatch: "Start Match",
    matchCreatedSuccessfully: "Match Created Successfully",
    failedToCreateMatch: "Failed to Create Match",
    searchByTyping: "Search by Typing",
    
    // Dashboard
    winRate: "Win Rate",
    completedMatches: "Completed Matches",
    totalMatches: "Total Matches",
    inProgressMatches: "In Progress Matches",
    profilesCreated: "Profiles Created",
    startNewMatch: "Start New Match",
    beginScoringLiveMatch: "Begin Scoring Live Match",
    recentMatches: "Recent Matches",
    viewAll: "View All",
    noMatchesYet: "No Matches Yet",
    startYourFirstMatch: "Start Your First Match",
    matchVsOpponent: "Match vs Opponent",
    yourPlayers: "Your Players",
    addPlayer: "Add Player",
    noPlayersCreated: "No Players Created",
    createYourFirstPlayer: "Create Your First Player",
    
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
    matchDetails: "Match details",
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
    liveScoreboard: "Live Scoreboard",
    // New keys
    server: "Server",
    game: "Game",
    lostServe: "LOST SERVE",
    statsTab: "Stats",
    pointsTab: "Points",
    commentaryTab: "Commentary",
    undo: "Undo",
    firstServe: "1st Serve",
    match: "Match",
    
    // Dashboard Stats Cards
    performance: "Performance",
    inProgressWithCount: "{count} in progress",
    completedWithCount: "{count} completed",
    playersCreated: "Players created",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needsWork: "Needs Work",
    overallRating: "Overall rating",
    hot: "Hot",
    
    // Match creation and forms
    singlesMatch: "Singles Match",
    trackBasicStats: "Track basic stats",
    trackDetailedStats: "Track detailed stats",
    
    // Tennis stats
    servicePoints: "Service Points %",
    receivingPoints: "Receiving Points %",
    
    // Common actions
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    
    // Status and states
    upcoming: "Upcoming",
    
    // Time and dates
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    
    // Player management
    createPlayer: "Create Player",
    editPlayer: "Edit Player",
    profilePicture: "Profile Picture",
    
    // Error messages
    errorOccurred: "An error occurred",
    tryAgain: "Try again",
    connectionError: "Connection Error",
    loadingError: "Loading Error",
    
    // Success messages
    playerCreated: "Player created successfully",
    playerUpdated: "Player updated successfully",
    matchCreated: "Match created successfully",
    
    // Empty states
    noPlayersYet: "No players yet",
    noDataAvailable: "No data available",
    
    // Dashboard bento grid specific
    matchesWon: "Matches won",
    avgDuration: "Avg Duration",
    winStreak: "Win Streak",
    setsWon: "Sets won",
    activeMatches: "Active matches",
    performanceOverview: "Performance Overview",
    last30Days: "Last 30 Days",
    
    // Matches page specific
    yourMatches: "Your Matches",
    unableToLoadMatches: "Unable to load matches",
    matchesConnectivityIssue: "Matches connectivity issue",
    unknownPlayer: "Unknown player",
    noMatchesFound: "No matches found",
    tennisMatchResults: "Tennis match results",
    checkMatchResults: "Check match results",
    matchSharedSuccessfully: "Match shared successfully",
    matchLinkCopied: "Match link copied",
    copyLinkManually: "Copy link manually",
    final: "Final",
    shareMatchResults: "Share match results",
    player: "Player",
    
    // Players page specific
    confirmDeletePlayer: "Confirm Delete Player",
    managePlayersDescription: "Manage players description",
    mainPlayer: "Main Player",
    born: "Born",
    plays: "Plays",
    leftHanded: "Left-Handed",
    rightHanded: "Right-Handed",
    addNewPlayerDescription: "Add a new player to track matches and statistics",
    uploadPictureOptional: "Upload picture (optional)",
    birthYear: "Birth Year",
    ratingPlaceholder: "4.0, UTR 8",
    clubPlaceholder: "Tennis Club Name",
    selectOption: "Select...",
    setAsMainPlayer: "Set as main player",
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
    settings: "Nastavení",
    overviewStats: "Přehled statistik",
    matchHistory: "Historie zápasů",
    managePlayers: "Spravovat hráče",
    
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
    
    // Create match form
    setUpMatch: "Nastavit zápas",
    matchType: "Typ zápasu",
    quickMatch: "Rychlý zápas",
    trackedPlayers: "Sledovaní hráči",
    actions: "Akce",
    createNewPlayer: "Vytvořit nového hráče",
    searchOrSelectPlayer: "Hledat nebo vybrat hráče",
    noPlayersFound: "Žádní hráči nebyli nalezeni",
    player1: "Hráč 1",
    player2: "Hráč 2",
    player3: "Hráč 3",
    player4: "Hráč 4",
    team1: "Tým 1",
    team2: "Tým 2",
    noTracking: "Žádné sledování",
    matchFormat: "Formát zápasu",
    numberOfSets: "Počet sad",
    bestOf1: "Na 1",
    bestOf3: "Na 3",
    bestOf5: "Na 5",
    scoringSystem: "Systém skórování",
    advantage: "Výhoda",
    noAdvantage: "Bez výhody",
    finalSet: "Poslední sad",
    fullSet: "Plná sad",
    superTiebreak: "Super tiebreak",
    scoringDetailLevel: "Detailní úroveň skórování",
    pointsOnly: "Body jen",
    trackJustScore: "Sledovat jen skóre",
    simpleStats: "Jednoduché statistiky",
    acesDoubleFaultsWinnersErrors: "Esa, dvojchyby, vítězové, chyby",
    detailedStats: "Podrobné statistiky",
    shotPlacementRallyLength: "Místo zásahu, délka rally",
    creatingMatch: "Vytvoření zápasu",
    startMatch: "Začít zápas",
    matchCreatedSuccessfully: "Zápas vytvořen úspěšně",
    failedToCreateMatch: "Nepodařilo se vytvořit zápas",
    searchByTyping: "Hledat při psaní",
    
    // Dashboard
    winRate: "Úspěšnost",
    completedMatches: "Dokončené zápasy",
    totalMatches: "Celkový počet zápasů",
    inProgressMatches: "Probíhající zápasy",
    profilesCreated: "Vytvořené profily",
    startNewMatch: "Začít nový zápas",
    beginScoringLiveMatch: "Začít skórovat živý zápas",
    recentMatches: "Nedávné zápasy",
    viewAll: "Zobrazit vše",
    noMatchesYet: "Zatím žádné zápasy",
    startYourFirstMatch: "Začněte svým prvním zápasem",
    matchVsOpponent: "Zápas proti soupeři",
    yourPlayers: "Tvé hráče",
    addPlayer: "Přidat hráče",
    noPlayersCreated: "Žádní hráči nebyli vytvořeni",
    createYourFirstPlayer: "Vytvořte svého prvního hráče",
    
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
    liveScoreboard: "Živé skóre",
    // New keys
    server: "Podání",
    game: "Hra",
    lostServe: "ZTRÁTA PODÁNÍ",
    statsTab: "Statistiky",
    pointsTab: "Body",
    commentaryTab: "Komentář",
    undo: "Zpět",
    firstServe: "1. podání",
    match: "Zápas",
    
    // Dashboard Stats Cards
    performance: "Výkonnost",
    inProgressWithCount: "{count} probíhá",
    completedWithCount: "{count} dokončeno",
    playersCreated: "Hráči vytvořeni",
    excellent: "Výborné",
    good: "Dobré",
    fair: "Průměrné",
    needsWork: "Potřebuje zlepšení",
    overallRating: "Celkové hodnocení",
    hot: "Horké",
    
    // Match creation and forms
    singlesMatch: "Dvouhra",
    trackBasicStats: "Sledovat základní statistiky",
    trackDetailedStats: "Sledovat detailní statistiky",
    
    // Tennis stats
    servicePoints: "Body na podání %",
    receivingPoints: "Body na příjmu %",
    
    // Common actions
    add: "Přidat",
    close: "Zavřít",
    confirm: "Potvrdit",
    
    // Status and states
    upcoming: "Nadcházející",
    
    // Time and dates
    today: "Dnes",
    yesterday: "Včera",
    thisWeek: "Tento týden",
    thisMonth: "Tento měsíc",
    
    // Player management
    createPlayer: "Vytvořit hráče",
    editPlayer: "Upravit hráče",
    profilePicture: "Profilový obrázek",
    
    // Error messages
    errorOccurred: "Došlo k chybě",
    tryAgain: "Zkusit znovu",
    connectionError: "Chyba připojení",
    loadingError: "Chyba načítání",
    
    // Success messages
    playerCreated: "Hráč byl úspěšně vytvořen",
    playerUpdated: "Hráč byl úspěšně upraven",
    matchCreated: "Zápas byl úspěšně vytvořen",
    
    // Empty states
    noPlayersYet: "Zatím žádní hráči",
    noDataAvailable: "Nejsou k dispozici žádná data",
    
    // Dashboard bento grid specific
    matchesWon: "Vyhráno zápasů",
    avgDuration: "Průměrná doba",
    winStreak: "Vítězná série",
    setsWon: "Vyhráno setů",
    activeMatches: "Aktivní zápasy",
    performanceOverview: "Přehled výkonu",
    last30Days: "Posledních 30 dní",
    
    // Matches page specific
    yourMatches: "Vaše zápasy",
    unableToLoadMatches: "Nepodařilo se načíst zápasy",
    matchesConnectivityIssue: "Problém s připojením k zápasům",
    unknownPlayer: "Neznámý hráč",
    noMatchesFound: "Žádné zápasy nenalezeny",
    tennisMatchResults: "Výsledky tenisového zápasu",
    checkMatchResults: "Podívejte se na výsledky zápasu",
    matchSharedSuccessfully: "Zápas byl úspěšně sdílen",
    matchLinkCopied: "Odkaz na zápas byl zkopírován",
    copyLinkManually: "Zkopírujte odkaz ručně",
    final: "Finální",
    shareMatchResults: "Sdílet výsledky zápasu",
    player: "Hráč",
    
    // Players page specific
    confirmDeletePlayer: "Opravdu chcete smazat tohoto hráče?",
    managePlayersDescription: "Spravujte své tenisové hráče a jejich profily",
    mainPlayer: "Hlavní hráč",
    born: "Narozen",
    plays: "Hrál",
    leftHanded: "Levoruký",
    rightHanded: "Pravoruký",
    addNewPlayerDescription: "Přidejte nového hráče pro sledování zápasů a statistik",
    uploadPictureOptional: "Nahrát obrázek (volitelné)",
    birthYear: "Rok narození",
    ratingPlaceholder: "4.0, UTR 8",
    clubPlaceholder: "Název tenisového klubu",
    selectOption: "Vybrat...",
    setAsMainPlayer: "Nastavit jako hlavního hráče",
  }
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.en
}

export function t(locale: Locale, key: keyof Translations): string {
  const trans = getTranslations(locale)
  return trans[key] || translations.en[key] || key
} 