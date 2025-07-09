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
  complexAnalytics: string
  userSelectableTracking: string
  creatingMatch: string
  startMatch: string
  matchCreatedSuccessfully: string
  failedToCreateMatch: string
  searchByTyping: string
  
  // Tournament/League field
  tournamentLeague: string
  enterTournamentName: string
  tournamentOptional: string
  
  // Anonymous player options
  anonymousPlayer: string
  dontTrackStats: string
  
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
  breakPoint: string
  setPoint: string
  matchPoint: string
  // New keys for live scoring tabs
  statsTab: string
  pointsTab: string
  commentaryTab: string
  undo: string
  firstServe: string
  secondServe: string
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
  sort: string
  saving: string
  saveChanges: string
  
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
  
  // Score displays
  tiebreak: string
  deuce: string

  // Missing translations found in components
  noPointDataAvailable: string
  statsWillAppear: string
  statsWillAppearDescription: string
  serviceStatistics: string
  firstServeWin: string
  secondServeWin: string
  breakPointsFaced: string
  breakPointsSaved: string
  conversionRatePercent: string
  forcedErrors: string
  firstServeWinPercentage: string
  secondServePointsWon: string
  secondServePointsWonPercentage: string
  firstServePointsWon: string
  firstServePointsWonPercentage: string
  totalPointsWon: string
  
  // Additional stat labels for match stats
  breakPointsWon: string
  breakPointConversion: string
  
  // End Match Dialog 
  whyEndingMatch: string
  matchCompletedNormally: string
  playerRetired: string
  weatherConditions: string
  
  // Simple Stats Popup
  point: string
  details: string
  winsPoint: string
  serving: string
  selectHowPointEnded: string
  
  // Point outcome labels and descriptions
  cleanWinner: string
  unreturnableServe: string
  twoConsecutiveFaults: string
  opponentForcedIntoError: string
  unforcedMistake: string
  serverMustWinForAce: string
  onlyOnSecondServeLoss: string
  
  // Tennis shot types
  serve: string
  forehand: string
  backhand: string
  volley: string
  overhead: string
  
  // Court positions and game elements
  deuceSide: string
  adSide: string
  rallyLength: string
  rallyLengthHint: string
  courtPosition: string
  pointOutcome: string
  lastShotType: string
  
  // Point detail sheet
  notes: string
  notesPlaceholder: string
  saveDetailedPoint: string
  whoWonThePoint: string
  howDidTheyWin: string
  whatShotWasIt: string
  courtSide: string
  whichSideOfCourt: string
  whereWasItServed: string
  crossCourt: string
  downTheLine: string
  bodyShot: string
  whereWasItHit: string
  shotDirection: string
  recordPoint: string
  
  // Delete confirmation
  deleteMatch: string
  deleteMatchConfirm: string
  matchDeleted: string
  failedToDeleteMatch: string
  deleting: string
  
  // Tab labels  
  commentary: string
  
  // Additional tennis terms
  forcedError: string
  unforcedError: string
  pointsAndOutcomes: string
  returnStatistics: string
  totalServicePoints: string
  totalReturnPoints: string
  returnPointsWon: string
  
  // Detailed scoring terms
  detailedStatistics: string
  serveType: string
  servePlacement: string
  wide: string
  body: string
  tDownTheMiddle: string
  serveSpeed: string
  ace: string
  doubleFault: string
  
  // Missing translations for components
  quickActions: string
  aceDescription: string
  winnerDescription: string
  unforcedErrorDescription: string
  doubleFaultDescription: string
  pointByPointAnalysis: string
  noDetailedPointLog: string
  enableDetailedLogging: string
  noDetailedAnalysis: string
  enableDetailedLoggingForAnalysis: string
  setBySetBreakdownTitle: string
  
  // Additional validation error messages
  doubleFaultSecondServeError: string
  doubleFaultReceiverError: string
  aceServerError: string
  serviceWinnerError: string
  aceDisabledHint: string
  doubleFaultDisabledHint: string
  pointDetailsTitle: string
  pointContext: string
  
  wins: string
  ongoing: string
  noData: string
  switchToCzech: string
  switchToEnglish: string
  unableToConnect: string
  checkInternetConnection: string
  connectionIssue: string
  failedToClearCache: string
  failedToGetCacheInfo: string
  clearingCache: string
  cacheCleared: string
  refreshing: string
  checking: string
  clearing: string
  clearCache: string
  hardRefresh: string
  checkCacheInfo: string
  cacheFound: string
  cachesWithEntries: string
  profilePreview: string
  clickUploadButton: string
  clickCropButton: string
  uploadImageDescription: string
  cropMe: string
  replaceWithNewImage: string
  editCrop: string
  removeImage: string
  recommendedActions: string
  cleanup: string
  dismiss: string
  extensionConflictDetected: string
  expandNavigation: string
  collapseNavigation: string
  newMatchButton: string
  pleaseSelectImage: string
  failedToReadFile: string
  failedToProcessCroppedImage: string
  pleaseSelectImageFile: string
  copyLink: string
  failed: string
  unable: string
  cannot: string
  setNumber: string
  selectAll: string
  getLink: string
  copy: string
  failedTo: string
  click: string
  upload: string
  select: string
  choose: string
  start: string
  end: string
  continue: string
  appUpdated: string
  refreshToGetLatest: string
  somethingWentWrong: string
  pleaseRefresh: string
  managementDescription: string
  forDoubles: string
  returnDefaultAvatar: string
  buildFullUrl: string
  missingEnvironmentVariables: string
  setUpPeriodicCleanup: string
  dontRenderOnServer: string
  couldNotGetCanvasContext: string
  fallbackDataURLFailed: string
  canvasToBlob: string
  totalEntriesFound: string
  cacheNames: string
  cacheInfoCheck: string
  cacheClearFailed: string
  foundCaches: string
  clearCacheAndReload: string
  justifyStart: string
  flexItemsCenter: string
  pointsPlayed: string
  matchLinkCopiedToClipboard: string
  liveMatchLinkCopied: string
  matchResultsLinkCopied: string
  
  // Enhanced Dashboard Statistics
  performanceOverviewHeader: string
  performanceOverviewDescription: string
  serveStatisticsHeader: string
  serveStatisticsDescription: string
  returnGameHeader: string
  returnGameDescription: string
  shotMakingHeader: string
  shotMakingDescription: string
  
  // Stat card labels
  winStreakLabel: string
  acesLabel: string
  firstServePercentageLabel: string
  servicePointsLabel: string
  doubleFaultsLabel: string
  breakPointsWonLabel: string
  returnPointsLabel: string
  breakPointsSavedLabel: string
  firstReturnPercentageLabel: string
  winnersLabel: string
  unforcedErrorsLabel: string
  netPointsLabel: string
  forehandBackhandRatioLabel: string
  
  // Performance quality descriptors
  qualityExcellent: string
  qualityGood: string
  qualityWorkNeeded: string
  qualityImproving: string
  
  // Stat descriptions
  opportunitiesConverted: string
  pointsWonServing: string
  pointsWonReturning: string
  defensiveHolds: string
  unforcedErrorsDescription: string
  forwardPlay: string
  winnerBalance: string
  perMatch: string
  ofTotal: string
  completedDescription: string
  best: string
  
  // Monthly stats
  thisMonthHeader: string
  matchesLabel: string
  wonLabel: string
  avgDurationLabel: string
  winStreakMonthlyLabel: string
  
  // MainPlayerSetupPrompt translations
  welcomeToTennisScorePrompt: string
  getStartedPersonalized: string
  helpShowRelevantStats: string
  createPlayersHint: string
  setMainPlayerHint: string
  
  // Extension conflict translations
  browserExtensionDetected: string
  browserExtensionMayInterfere: string
  detectedExtensions: string
  tryCleanup: string
  
  // Image upload translations
  cropYourImage: string
  clickUploadToReplace: string
  clickCropToEdit: string
  uploadImageUpTo10MB: string
  
  // Hydration error translations
  hydrationError: string
  applicationError: string
  hydrationMismatch: string
  commonCauses: string
  browserSecurityExtensions: string
  adBlockersModifying: string
  browserDeveloperTools: string
  errorDetails: string
  
  // Enhanced bento grid translations
  secondServePointsWonPercent: string
  forcedErrorsLabel: string
  unforcedErrorsChart: string
  
  // Tournament theming translations
  tournamentTheme: string
  selectTournamentForTheme: string
  
  // Wizard specific translations
  next: string
  chooseMatchFormat: string
  oneVsOne: string
  twoVsTwo: string
  selectTwoPlayers: string
  selectFourPlayers: string
  addTournamentOptional: string
  tournamentName: string
  skipTournament: string
  tournamentOptionalDescription: string
  configureMatchSettings: string
  traditionalScoring: string
  fasterGameplay: string
  traditionalFinalSet: string
  quickerFinish: string
  chooseTrackingLevel: string
  detailLevelCanBeChanged: string
  comingSoon: string
  reviewMatch: string
  confirmDetailsBeforeStart: string
  tournament: string
  casualMatch: string
  detailLevel: string
  readyToStart: string
  clickStartToBeginMatch: string
  review: string
  step: string
  creating: string
  autoAdvancing: string
  pleaseCompleteMatchFormat: string

  // Live match settings
  failedToUpdateSettings: string
  settingsUpdatedSuccessfully: string
  matchSettings: string
  adjustMatchSettingsDescription: string
  bestOfN: string

  // New translations
  createMatchError: string
  selectMatchRules: string
}

export const translations = {
  en: {
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    share: "Share",
    back: "Back",
    signOut: 'Sign Out',
    lightMode: "Light",
    darkMode: "Dark",

    // Navigation
    dashboard: "Dashboard",
    matches: "Matches",
    players: "Players",
    profile: "Profile",
    settings: "Settings",
    overviewStats: "Overview & Stats",
    matchHistory: "Match History",
    managePlayers: "Manage Players",

    // Dashboard specific
    welcomeBack: "Welcome back",
    welcomeToTennisScore: "Welcome to TennisScore!",
    dashboardSubtitle: "Your personal tennis match tracker.",
    performanceTrackingStarts: "Performance tracking starts here.",
    readyToElevate: "Ready to elevate your game?",

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
    setUpMatch: "Set up your match",
    matchType: "Match Type",
    quickMatch: "Quick Match",
    trackedPlayers: 'Tracked Players',
    actions: 'Actions',
    createNewPlayer: 'Create a new player',
    searchOrSelectPlayer: 'Search or select a player',
    noPlayersFound: 'No players found.',
    player1: "Player 1",
    player2: "Player 2",
    player3: "Player 3",
    player4: "Player 4",
    team1: "Team 1",
    team2: "Team 2",
    noTracking: "No tracking",
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
    trackJustScore: "Track just the score, no extra stats.",
    simpleStats: "Simple Stats",
    acesDoubleFaultsWinnersErrors: "Aces, Double Faults, Winners, Errors",
    detailedStats: "Detailed Stats",
    shotPlacementRallyLength: "Shot Placement, Rally Length",
    complexAnalytics: "Complex Analytics",
    userSelectableTracking: "User-selectable tracking options & analytics",
    creatingMatch: "Creating match...",
    startMatch: "Start Match",
    matchCreatedSuccessfully: 'Match created successfully!',
    failedToCreateMatch: 'Failed to create match. Please check your inputs.',
    searchByTyping: "Search by typing...",

    // Tournament/League field
    tournamentLeague: "Tournament / League",
    enterTournamentName: "Enter tournament name...",
    tournamentOptional: "This is optional",

    // Anonymous player options
    anonymousPlayer: "Anonymous Player",
    dontTrackStats: "Don't track stats",

    // Dashboard
    winRate: "Win Rate",
    completedMatches: "Completed Matches",
    totalMatches: "Total Matches",
    inProgressMatches: "In Progress",
    profilesCreated: "Profiles Created",
    startNewMatch: "Start New Match",
    beginScoringLiveMatch: "Begin scoring a new match live.",
    recentMatches: "Recent Matches",
    viewAll: "View all",
    noMatchesYet: "No matches yet.",
    startYourFirstMatch: "Start your first match to see it here.",
    matchVsOpponent: "Match vs. {opponentName}",
    yourPlayers: "Your Players",
    addPlayer: "Add Player",
    noPlayersCreated: "No players created yet.",
    createYourFirstPlayer: "Create your first player profile.",

    // Players
    firstName: "First Name",
    lastName: "Last Name",
    yearOfBirth: "Year of Birth",
    rating: "Rating (e.g., UTR, NTRP)",
    club: "Club (optional)",
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
    matchEndedDue: "Match ended due to {reason}",

    // Stats
    totalPoints: "Total Points",
    winners: "Winners",
    unforcedErrors: "Unforced Errors",
    aces: "Aces",
    doubleFaults: "Double Faults",
    firstServePercentage: "1st Serve %",
    breakPoints: "Break Points",

    // Time formats
    minutes: "min",
    hours: "hr",
    ago: "ago",
    
    // Match information
    date: "Date",
    time: "Time",
    format: "Format",
    type: "Type",
    singles: "Singles",
    doubles: "Doubles",
    bestOf: "Best of {sets}",
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
    servicePower: "Service Power",
    pressurePoints: "Pressure Points",
    matchRhythm: "Match Rhythm",
    playingPace: "Playing Pace",
    
    // Analysis insights
    excellentConversion: "Excellent conversion rate under pressure.",
    goodConversion: "Good conversion rate, but can be improved.",
    roomForImprovement: "Room for improvement on crucial points.",
    perfectServiceRecord: "Perfect record on service games.",
    strongServiceGames: "Strong performance on service games.",
    serviceUnderPressure: "Service games were under pressure.",
    
    // Profile picture
    uploadNewPicture: "Upload new picture",
    optional: "Optional",

    // Errors
    invalidDocumentStructure: "Invalid document structure.",
    unknownAttribute: "Unknown attribute in document.",

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
    setBySetBreakdown: "Set-by-Set Breakdown",
    set: "Set",
    matchAnalysisInsights: "Match Analysis & Insights",
    matchSummary: "Match Summary",
    ended: "Ended",
    finish: "Finish",
    refresh: "Refresh",
    vs: "vs.",
    live: "Live",
    changeServer: "Change Server",
    cannotChangeServer: "Server can only be changed at the start of a game.",
    switchServer: "Switch Server",
    liveScoreboard: "Live Scoreboard",

    // New keys for point-by-point view
    server: "Server",
    game: "Game",
    lostServe: "lost serve",
    breakPoint: "Break Point",
    setPoint: "Set Point",
    matchPoint: "Match Point",
    // New keys for live scoring tabs
    statsTab: "Stats",
    pointsTab: "Points",
    commentaryTab: "Commentary",
    undo: "Undo",
    firstServe: "1st Serve",
    secondServe: "2nd Serve",
    match: "Match",

    // Dashboard Stats Cards
    performance: "Performance",
    inProgressWithCount: "{count} in Progress",
    completedWithCount: "{count} Completed",
    playersCreated: "Players Created",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    needsWork: "Needs Work",
    overallRating: "Overall Rating",
    hot: "Hot!",

    // Match creation and forms
    singlesMatch: "Singles Match",
    trackBasicStats: "Track Basic Stats",
    trackDetailedStats: "Track Detailed Stats",

    // Tennis stats
    servicePoints: "Service Points",
    receivingPoints: "Receiving Points",

    // Common actions
    add: "Add",
    close: "Close",
    confirm: "Confirm",
    sort: "Sort",
    saving: 'Saving...',
    saveChanges: 'Save Changes',

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
    tryAgain: "Try Again",
    connectionError: "Connection Error",
    loadingError: "Loading Error",

    // Success messages
    playerCreated: "Player created successfully.",
    playerUpdated: "Player updated successfully.",
    matchCreated: "Match created successfully.",

    // Empty states
    noPlayersYet: "No players yet.",
    noDataAvailable: "No data available.",

    // Dashboard bento grid specific
    matchesWon: "Matches Won",
    avgDuration: "Avg. Duration",
    winStreak: "Win Streak",
    setsWon: "Sets Won",
    activeMatches: "Active Matches",
    performanceOverview: "Performance Overview",
    last30Days: "Last 30 Days",

    // Matches page specific
    yourMatches: "Your Matches",
    unableToLoadMatches: "Unable to load matches",
    matchesConnectivityIssue: "There seems to be a connectivity issue.",
    unknownPlayer: "Unknown Player",
    noMatchesFound: "No matches found.",
    tennisMatchResults: "Tennis Match Results",
    checkMatchResults: "Check out the results of my tennis match!",
    matchSharedSuccessfully: "Match shared successfully!",
    matchLinkCopied: "Match link copied to clipboard.",
    copyLinkManually: "Could not copy link. Please copy it manually.",
    final: "Final",
    shareMatchResults: "Share Match Results",
    player: "Player",
    
    // Players page specific
    confirmDeletePlayer: "Are you sure you want to delete this player?",
    managePlayersDescription: "Add, edit, or delete player profiles.",
    mainPlayer: "Main Player",
    born: "Born",
    plays: "Plays",
    leftHanded: "Left-handed",
    rightHanded: "Right-handed",
    addNewPlayerDescription: "Add a new player to your list for tracking.",
    uploadPictureOptional: "Upload a picture (optional)",
    birthYear: "Birth Year",
    ratingPlaceholder: "e.g., UTR 10.5, NTRP 4.5",
    clubPlaceholder: "e.g., City Tennis Club",
    selectOption: "Select an option",
    setAsMainPlayer: "Set as Main Player",

    // Score displays
    tiebreak: "Tiebreak",
    deuce: "Deuce",

    // Missing translations found in components
    noPointDataAvailable: "No point-by-point data available for this match.",
    statsWillAppear: "Statistics will appear here as the match progresses.",
    statsWillAppearDescription: "Complete points to see detailed match stats.",
    serviceStatistics: "Service Statistics",
    firstServeWin: "1st Serve Win %",
    secondServeWin: "2nd Serve Win %",
    breakPointsFaced: "Break Points Faced",
    breakPointsSaved: "Break Points Saved",
    conversionRatePercent: "({rate}%)",
    forcedErrors: "Forced Errors",
    firstServeWinPercentage: "1st Serve Win",
    secondServePointsWon: "2nd Serve Points Won",
    secondServePointsWonPercentage: "2nd Serve Points Won %",
    firstServePointsWon: "1st Serve Points Won",
    firstServePointsWonPercentage: "1st Serve Points Won %",
    totalPointsWon: "Total Points Won",
    
    // Additional stat labels for match stats
    breakPointsWon: "Break Points Won",
    breakPointConversion: "Break Point Conversion",
    
    // End Match Dialog
    whyEndingMatch: "Why are you ending the match?",
    matchCompletedNormally: "Match completed normally",
    playerRetired: "{playerName} retired",
    weatherConditions: "Weather conditions",
    
    // Simple Stats Popup
    point: "Point",
    details: "Details",
    winsPoint: "{playerName} wins the point.",
    serving: "Serving",
    selectHowPointEnded: "Select how the point ended:",

    // Point outcome labels and descriptions
    cleanWinner: "Clean Winner",
    unreturnableServe: "Unreturnable Serve (Ace or Service Winner)",
    twoConsecutiveFaults: "Double Fault (two consecutive faults)",
    opponentForcedIntoError: "Opponent Forced into Error",
    unforcedMistake: "Unforced Mistake by Opponent",
    serverMustWinForAce: "Server must win the point for an Ace/Service Winner.",
    onlyOnSecondServeLoss: "Only applicable when server loses point on 2nd serve.",
    
    // Tennis shot types
    serve: "Serve",
    forehand: "Forehand",
    backhand: "Backhand",
    volley: "Volley",
    overhead: "Overhead",

    // Court positions and game elements
    deuceSide: "Deuce Side",
    adSide: "Ad Side",
    rallyLength: "Rally Length",
    rallyLengthHint: "e.g., 3",
    courtPosition: "Court Position",
    pointOutcome: "Point Outcome",
    lastShotType: "Last Shot Type",
    
    // Point detail sheet
    notes: "Notes",
    notesPlaceholder: "e.g., Great backhand down the line",
    saveDetailedPoint: "Save Detailed Point",
    whoWonThePoint: "Who won the point?",
    howDidTheyWin: "How did they win?",
    whatShotWasIt: "What shot was it?",
    courtSide: "Court Side",
    whichSideOfCourt: "Which side of the court?",
    whereWasItServed: "Where was it served?",
    crossCourt: "Cross-court",
    downTheLine: "Down the line",
    bodyShot: "Body shot",
    whereWasItHit: "Where was it hit?",
    shotDirection: "Shot Direction",
    recordPoint: "Record Point",

    // Delete confirmation
    deleteMatch: "Delete Match",
    deleteMatchConfirm: "Are you sure you want to delete this match? This action cannot be undone.",
    matchDeleted: "Match deleted.",
    failedToDeleteMatch: "Failed to delete match.",
    deleting: "Deleting...",
    
    // Tab labels
    commentary: "Commentary",
    
    // Additional tennis terms
    forcedError: "Forced Error",
    unforcedError: "Unforced Error",
    pointsAndOutcomes: "Points & Outcomes",
    returnStatistics: "Return Statistics",
    totalServicePoints: "Total Service Points",
    totalReturnPoints: "Total Return Points",
    returnPointsWon: "Return Points Won",

    // Detailed scoring terms
    detailedStatistics: "Detailed Statistics",
    serveType: "Serve Type",
    servePlacement: "Serve Placement",
    wide: "Wide",
    body: "Body",
    tDownTheMiddle: "T (Down the Middle)",
    serveSpeed: "Serve Speed (km/h)",
    ace: "Ace",
    doubleFault: "Double Fault",

    // Missing translations for components
    quickActions: "Quick Actions",
    aceDescription: "A serve that is not touched by the receiver.",
    winnerDescription: "A shot that the opponent cannot return.",
    unforcedErrorDescription: "A mistake made by the player.",
    doubleFaultDescription: "Two consecutive serving faults.",
    pointByPointAnalysis: "Point-by-Point Analysis",
    noDetailedPointLog: "No detailed point log available.",
    enableDetailedLogging: "Enable detailed logging to see point-by-point data.",
    noDetailedAnalysis: "No detailed analysis available.",
    enableDetailedLoggingForAnalysis: "Enable detailed logging for match analysis.",
    setBySetBreakdownTitle: "Set-by-Set Breakdown",

    // Additional validation error messages
    doubleFaultSecondServeError: "A double fault must be on a second serve.",
    doubleFaultReceiverError: "The receiver cannot make a double fault.",
    aceServerError: "Only the server can hit an ace.",
    serviceWinnerError: "Only the server can hit a service winner.",
    aceDisabledHint: "Select 'Serve' as shot type for Ace.",
    doubleFaultDisabledHint: "Select 'Serve' as shot type for Double Fault.",
    pointDetailsTitle: "Point Details",
    pointContext: "Game {game}, Point {point}, {serverName} serving",
    
    wins: "wins",
    ongoing: "Ongoing",
    noData: "No data",
    switchToCzech: 'Switch to Czech',
    switchToEnglish: 'Switch to English',
    unableToConnect: 'Unable to connect to the server.',
    checkInternetConnection: 'Please check your internet connection.',
    connectionIssue: 'Connection Issue',
    failedToClearCache: "Failed to clear cache:",
    failedToGetCacheInfo: "Failed to get cache info:",
    clearingCache: "Clearing cache...",
    cacheCleared: "Cache cleared successfully!",
    refreshing: "Refreshing...",
    checking: "Checking...",
    clearing: "Clearing...",
    clearCache: "Clear Cache",
    hardRefresh: "Hard Refresh",
    checkCacheInfo: "Check Cache Info",
    cacheFound: "Cache found:",
    cachesWithEntries: "Caches with entries:",
    profilePreview: "Profile Preview",
    clickUploadButton: "Click the upload button to select an image",
    clickCropButton: "Click the crop button to save your changes",
    uploadImageDescription: "Upload a picture to personalize your profile",
    cropMe: "Crop me!",
    replaceWithNewImage: "Replace with new image",
    editCrop: "Edit Crop",
    removeImage: "Remove Image",
    recommendedActions: "Recommended Actions:",
    cleanup: "Cleanup",
    dismiss: "Dismiss",
    extensionConflictDetected: "Browser Extension Conflict Detected",
    expandNavigation: "Expand navigation",
    collapseNavigation: "Collapse navigation",
    newMatchButton: "New Match",
    pleaseSelectImage: "Please select an image file.",
    failedToReadFile: "Failed to read the file.",
    failedToProcessCroppedImage: "Failed to process the cropped image.",
    pleaseSelectImageFile: "Please select an image file first.",
    copyLink: "Copy Link",
    failed: "Failed",
    unable: "Unable",
    cannot: "Cannot",
    setNumber: "Set {number}",
    selectAll: "Select all",
    getLink: "Get Link",
    copy: "Copy",
    failedTo: "Failed to",
    click: "Click",
    upload: "Upload",
    select: "Select",
    choose: "Choose",
    start: "Start",
    end: "End",
    continue: "Continue",
    appUpdated: "App Updated",
    refreshToGetLatest: "The application has been updated. Please refresh to get the latest version.",
    somethingWentWrong: "Something went wrong.",
    pleaseRefresh: "Please refresh the page and try again.",
    managementDescription: "Add, edit, and manage your player profiles here.",
    forDoubles: "for doubles",
    returnDefaultAvatar: "Return default avatar",
    buildFullUrl: "buildFullUrl",
    missingEnvironmentVariables: "Missing environment variables",
    setUpPeriodicCleanup: "Set up periodic cleanup",
    dontRenderOnServer: "Don't render on server",
    couldNotGetCanvasContext: "Could not get canvas context",
    fallbackDataURLFailed: "Fallback data URL generation failed",
    canvasToBlob: "canvas.toBlob",
    totalEntriesFound: "Total entries found:",
    cacheNames: "Cache names:",
    cacheInfoCheck: "Cache info check",
    cacheClearFailed: "Cache clear failed",
    foundCaches: "Found caches:",
    clearCacheAndReload: "Clear Cache and Reload",
    justifyStart: "justify-start",
    flexItemsCenter: "flex items-center",
    pointsPlayed: "Points Played",
    matchLinkCopiedToClipboard: 'Match link copied to clipboard!',
    liveMatchLinkCopied: 'Live match link copied!',
    matchResultsLinkCopied: 'Match results link copied!',

    // Enhanced Dashboard Statistics
    performanceOverviewHeader: "Performance Overview",
    performanceOverviewDescription: "A quick look at your overall performance.",
    serveStatisticsHeader: "Serve Statistics",
    serveStatisticsDescription: "Key metrics related to your serving game.",
    returnGameHeader: "Return Game",
    returnGameDescription: "How well you perform when returning serve.",
    shotMakingHeader: "Shot Making",
    shotMakingDescription: "Analysis of your winners and errors.",
    
    // Stat card labels
    winStreakLabel: "Win Streak",
    acesLabel: "Aces",
    firstServePercentageLabel: "1st Serve %",
    servicePointsLabel: "Service Pts Won",
    doubleFaultsLabel: "Double Faults",
    breakPointsWonLabel: "Break Pts Won",
    returnPointsLabel: "Return Pts Won",
    breakPointsSavedLabel: "Break Pts Saved",
    firstReturnPercentageLabel: "1st Return %",
    winnersLabel: "Winners",
    unforcedErrorsLabel: "Unforced Err.",
    netPointsLabel: "Net Pts Won",
    forehandBackhandRatioLabel: "FH/BH Ratio",

    // Performance quality descriptors
    qualityExcellent: "Excellent",
    qualityGood: "Good",
    qualityWorkNeeded: "Work Needed",
    qualityImproving: "Improving",

    // Stat descriptions
    opportunitiesConverted: "opportunities converted",
    pointsWonServing: "points won when serving",
    pointsWonReturning: "points won when returning",
    defensiveHolds: "defensive holds under pressure",
    unforcedErrorsDescription: "unforced errors per match",
    forwardPlay: "forward play effectiveness",
    winnerBalance: "balance between winners and errors",
    perMatch: "per match",
    ofTotal: "of total",
    completedDescription: "completed",
    best: "Best",

    // Monthly stats
    thisMonthHeader: "This Month",
    matchesLabel: "Matches",
    wonLabel: "Won",
    avgDurationLabel: "Avg. Duration",
    winStreakMonthlyLabel: "Win Streak",
    
    // MainPlayerSetupPrompt translations
    welcomeToTennisScorePrompt: "Welcome to TennisScore!",
    getStartedPersonalized: "To get started with personalized stats, let's set up your players.",
    helpShowRelevantStats: "This will help us show you the most relevant stats and insights.",
    createPlayersHint: "Create profiles for yourself and your opponents.",
    setMainPlayerHint: "Don't forget to set one player as your main profile!",
    
    // Extension conflict translations
    browserExtensionDetected: "Browser Extension Detected",
    browserExtensionMayInterfere: "The following browser extension(s) may interfere with the application's functionality:",
    detectedExtensions: "Detected Extension(s):",
    tryCleanup: "If you experience issues, please try disabling these extensions for this site or use the cleanup tools in settings.",
    
    // Image upload translations
    cropYourImage: "Crop your image",
    clickUploadToReplace: "Click 'Upload' to select a new image to replace the current one.",
    clickCropToEdit: "Click 'Crop' to save the changes to your profile picture.",
    uploadImageUpTo10MB: "Upload an image (up to 10MB)",
    
    // Hydration error translations
    hydrationError: "Hydration Error",
    applicationError: "Application Error",
    hydrationMismatch: "A hydration mismatch occurred. The page content rendered on the server is different from the content rendered on the client.",
    commonCauses: "Common Causes:",
    browserSecurityExtensions: "Browser extensions (e.g., Grammarly, ad-blockers) modifying the page.",
    adBlockersModifying: "Ad-blockers or privacy extensions.",
    browserDeveloperTools: "Browser developer tools or other scripts injecting elements.",
    errorDetails: "Error Details",
    
    // Enhanced bento grid translations
    secondServePointsWonPercent: "2nd Srv Pts Won",
    forcedErrorsLabel: "Forced Err.",
    unforcedErrorsChart: "Unforced Errors",
    
    // Tournament theming translations
    tournamentTheme: "Tournament Theme",
    selectTournamentForTheme: "Select a Grand Slam to apply its theme.",
    
    // Wizard specific translations
    next: "Next",
    chooseMatchFormat: "Choose a format to get started.",
    oneVsOne: "One player vs. another.",
    twoVsTwo: "Two players vs. another two.",
    selectTwoPlayers: "Select two players for a singles match.",
    selectFourPlayers: "Select four players for a doubles match.",
    addTournamentOptional: "Optionally, add a tournament or league name.",
    tournamentName: "Tournament Name",
    skipTournament: "Skip for now",
    tournamentOptionalDescription: "Helps you filter and group matches later.",
    configureMatchSettings: "Configure the match settings.",
    traditionalScoring: "Traditional tennis scoring with advantage.",
    fasterGameplay: "Faster gameplay with sudden death at deuce.",
    traditionalFinalSet: "The final set is played as a full set.",
    quickerFinish: "A 10-point tiebreak decides the match.",
    chooseTrackingLevel: "Choose how much detail to track during the match.",
    detailLevelCanBeChanged: "You can change the detail level during the match from the settings.",
    comingSoon: "Coming Soon",
    reviewMatch: "Review Match Details",
    confirmDetailsBeforeStart: "Confirm the details below before starting the match.",
    tournament: "Tournament",
    casualMatch: "Casual Match",
    detailLevel: "Detail Level",
    readyToStart: "Ready to start?",
    clickStartToBeginMatch: "Click 'Start Match' to begin scoring.",
    review: "Review",
    step: "Step",
    creating: "Creating...",
    autoAdvancing: "Auto-advancing...",
    pleaseCompleteMatchFormat: "Please complete all match format selections.",

    // Live match settings
    failedToUpdateSettings: "Failed to update match settings",
    settingsUpdatedSuccessfully: "Settings updated successfully",
    matchSettings: 'Match Settings',
    adjustMatchSettingsDescription: 'Adjust the settings for this match. This can be changed at any time.',
    bestOfN: 'Best of {n}',

    // New translations
    createMatchError: "Failed to create match",
    selectMatchRules: "Select the rules for the match",
  },
  cs: {
    // Common
    loading: "Načítání...",
    save: "Uložit",
    cancel: "Zrušit",
    delete: "Smazat",
    edit: "Upravit",
    create: "Vytvořit",
    share: "Sdílet",
    back: "Zpět",
    signOut: 'Odhlásit se',
    lightMode: "Světlý",
    darkMode: "Tmavý",

    // Navigation
    dashboard: "Nástěnka",
    matches: "Zápasy",
    players: "Hráči",
    profile: "Profil",
    settings: "Nastavení",
    overviewStats: "Přehled a statistiky",
    matchHistory: "Historie zápasů",
    managePlayers: "Spravovat hráče",

    // Dashboard specific
    welcomeBack: "Vítejte zpět",
    welcomeToTennisScore: "Vítejte v TennisScore!",
    dashboardSubtitle: "Váš osobní záznamník tenisových zápasů.",
    performanceTrackingStarts: "Sledování výkonu začíná zde.",
    readyToElevate: "Jste připraveni pozvednout svou hru?",

    // Match scoring
    newMatch: "Nový zápas",
    liveScoring: "Živé skórování",
    matchCompleted: "Zápas dokončen",
    winner: "Vítěz",
    score: "Skóre",
    sets: "Sety",
    games: "Gemy",
    points: "Body",

    // Create match form
    setUpMatch: "Nastavit zápas",
    matchType: "Typ zápasu",
    quickMatch: "Rychlý zápas",
    trackedPlayers: 'Sledovaní hráči',
    actions: 'Akce',
    createNewPlayer: 'Vytvořit nového hráče',
    searchOrSelectPlayer: 'Vyhledat nebo vybrat hráče',
    noPlayersFound: 'Nenalezeni žádní hráči.',
    player1: "Hráč 1",
    player2: "Hráč 2",
    player3: "Hráč 3",
    player4: "Hráč 4",
    team1: "Tým 1",
    team2: "Tým 2",
    noTracking: "Bez sledování",
    matchFormat: "Formát zápasu",
    numberOfSets: "Počet setů",
    bestOf1: "Na 1 vítězný set",
    bestOf3: "Na 2 vítězné sety",
    bestOf5: "Na 3 vítězné sety",
    scoringSystem: "Systém bodování",
    advantage: "Výhoda",
    noAdvantage: "Bez výhody",
    finalSet: "Poslední set",
    fullSet: "Plný set",
    superTiebreak: "Super Tiebreak",
    scoringDetailLevel: "Úroveň detailů skórování",
    pointsOnly: "Pouze body",
    trackJustScore: "Sledovat pouze skóre, žádné další statistiky.",
    simpleStats: "Jednoduché statistiky",
    acesDoubleFaultsWinnersErrors: "Esa, dvojchyby, vítězné údery, chyby",
    detailedStats: "Detailní statistiky",
    shotPlacementRallyLength: "Umístění úderů, délka výměn",
    complexAnalytics: "Komplexní analytika",
    userSelectableTracking: "Uživatelem volitelné možnosti sledování a analytiky",
    creatingMatch: "Vytváření zápasu...",
    startMatch: "Začít zápas",
    matchCreatedSuccessfully: 'Zápas úspěšně vytvořen!',
    failedToCreateMatch: 'Nepodařilo se vytvořit zápas. Zkontrolujte prosím zadané údaje.',
    searchByTyping: "Hledejte psaním...",

    // Tournament/League field
    tournamentLeague: "Turnaj / Liga",
    enterTournamentName: "Zadejte název turnaje...",
    tournamentOptional: "Toto je volitelné",

    // Anonymous player options
    anonymousPlayer: "Anonymní hráč",
    dontTrackStats: "Nesledovat statistiky",

    // Dashboard
    winRate: "Míra výher",
    completedMatches: "Dokončené zápasy",
    totalMatches: "Celkem zápasů",
    inProgressMatches: "Probíhající",
    profilesCreated: "Vytvořené profily",
    startNewMatch: "Začít nový zápas",
    beginScoringLiveMatch: "Začněte skórovat nový zápas živě.",
    recentMatches: "Nedávné zápasy",
    viewAll: "Zobrazit vše",
    noMatchesYet: "Zatím žádné zápasy.",
    startYourFirstMatch: "Začněte svůj první zápas, aby se zde zobrazil.",
    matchVsOpponent: "Zápas vs. {opponentName}",
    yourPlayers: "Vaši hráči",
    addPlayer: "Přidat hráče",
    noPlayersCreated: "Zatím žádní vytvoření hráči.",
    createYourFirstPlayer: "Vytvořte si svůj první profil hráče.",

    // Players
    firstName: "Jméno",
    lastName: "Příjmení",
    yearOfBirth: "Rok narození",
    rating: "Hodnocení (např. BH, rCŽ)",
    club: "Klub (volitelné)",
    playingHand: "Hrající ruka",
    left: "Levá",
    right: "Pravá",

    // Match details
    matchDetails: "Detaily zápasu",
    overview: "Přehled",
    pointLog: "Záznam bodů",
    statistics: "Statistiky",
    analysis: "Analýza",
    duration: "Doba trvání",
    started: "Zahájeno",
    finished: "Ukončeno",

    // Match retirement
    endMatch: "Ukončit zápas",
    retired: "Skreč",
    weather: "Počasí",
    injury: "Zranění",
    matchEndedDue: "Zápas ukončen z důvodu: {reason}",

    // Stats
    totalPoints: "Celkem bodů",
    winners: "Vítězné údery",
    unforcedErrors: "Nevynucené chyby",
    aces: "Esa",
    doubleFaults: "Dvojchyby",
    firstServePercentage: "% 1. podání",
    breakPoints: "Brejkboly",

    // Time formats
    minutes: "min",
    hours: "hod",
    ago: "před",
    
    // Match information
    date: "Datum",
    time: "Čas",
    format: "Formát",
    type: "Typ",
    singles: "Dvouhra",
    doubles: "Čtyřhra",
    bestOf: "Na {sets} sety",
    noAd: "Bez výhody",
    traditional: "Tradiční",
    completed: "Dokončeno",
    inProgress: "Probíhá",
    reason: "Důvod",

    // Match stats detailed
    totalPointsPlayed: "Celkem odehraných bodů",
    setsCompleted: "Dokončené sety",
    serviceGames: "Hry na podání",
    breaksOfServe: "Ztracená podání",
    lastTenPoints: "Posledních 10 bodů",
    momentumTracker: "Sledování momentu",
    conversionRate: "Míra konverze",
    breakPointPressure: "Tlak při brejkbolech",
    breakPointsCreated: "Vytvořené brejkboly",
    breakPointsConverted: "Proměněné brejkboly",
    serviceDominance: "Dominance na podání",
    serviceGamesHeld: "Udržené hry na podání",
    gamesLostOnServe: "Ztracené hry na podání",
    pointDistributionAnalysis: "Analýza rozdělení bodů",
    performanceInsights: "Pohledy na výkon",
    servicePower: "Síla podání",
    pressurePoints: "Tlakové body",
    matchRhythm: "Rytmus zápasu",
    playingPace: "Tempo hry",

    // Analysis insights
    excellentConversion: "Vynikající míra konverze pod tlakem.",
    goodConversion: "Dobrá míra konverze, ale lze zlepšit.",
    roomForImprovement: "Prostor pro zlepšení v klíčových momentech.",
    perfectServiceRecord: "Perfektní záznam her na podání.",
    strongServiceGames: "Silný výkon při hrách na podání.",
    serviceUnderPressure: "Hry na podání byly pod tlakem.",

    // Profile picture
    uploadNewPicture: "Nahrát nový obrázek",
    optional: "Volitelné",

    // Errors
    invalidDocumentStructure: "Neplatná struktura dokumentu.",
    unknownAttribute: "Neznámý atribut v dokumentu.",

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
    setBySetBreakdown: "Rozpis po setech",
    set: "Set",
    matchAnalysisInsights: "Analýza a postřehy ze zápasu",
    matchSummary: "Shrnutí zápasu",
    ended: "Ukončeno",
    finish: "Dokončit",
    refresh: "Obnovit",
    vs: "vs.",
    live: "Živě",
    changeServer: "Změnit podávajícího",
    cannotChangeServer: "Podávajícího lze změnit pouze na začátku gemu.",
    switchServer: "Změnit podávajícího",
    liveScoreboard: "Živé skóre",

    // New keys for point-by-point view
    server: "Podávající",
    game: "Gem",
    lostServe: "ztratil(a) podání",
    breakPoint: "Brejkbol",
    setPoint: "Setbol",
    matchPoint: "Mečbol",
    // New keys for live scoring tabs
    statsTab: "Statistiky",
    pointsTab: "Body",
    commentaryTab: "Komentář",
    undo: "Zpět",
    firstServe: "1. podání",
    secondServe: "2. podání",
    match: "Zápas",

    // Dashboard Stats Cards
    performance: "Výkon",
    inProgressWithCount: "{count} probíhá",
    completedWithCount: "{count} dokončeno",
    playersCreated: "Vytvoření hráči",
    excellent: "Vynikající",
    good: "Dobrý",
    fair: "Průměrný",
    needsWork: "Je co zlepšovat",
    overallRating: "Celkové hodnocení",
    hot: "Ve formě!",

    // Match creation and forms
    singlesMatch: "Dvouhra",
    trackBasicStats: "Sledovat základní statistiky",
    trackDetailedStats: "Sledovat detailní statistiky",

    // Tennis stats
    servicePoints: "Body na podání",
    receivingPoints: "Body na příjmu",
    
    // Common actions
    add: "Přidat",
    close: "Zavřít",
    confirm: "Potvrdit",
    sort: "Třídit",
    saving: 'Ukládání...',
    saveChanges: 'Uložit změny',
    
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
    playerCreated: "Hráč úspěšně vytvořen.",
    playerUpdated: "Hráč úspěšně aktualizován.",
    matchCreated: "Zápas úspěšně vytvořen.",
    
    // Empty states
    noPlayersYet: "Zatím žádní hráči.",
    noDataAvailable: "Nejsou k dispozici žádná data.",

    // Dashboard bento grid specific
    matchesWon: "Vyhrané zápasy",
    avgDuration: "Prům. délka",
    winStreak: "Série výher",
    setsWon: "Vyhrané sety",
    activeMatches: "Aktivní zápasy",
    performanceOverview: "Přehled výkonu",
    last30Days: "Posledních 30 dní",
    
    // Matches page specific
    yourMatches: "Vaše zápasy",
    unableToLoadMatches: "Nepodařilo se načíst zápasy",
    matchesConnectivityIssue: "Zdá se, že je problém s připojením.",
    unknownPlayer: "Neznámý hráč",
    noMatchesFound: "Nenalezeny žádné zápasy.",
    tennisMatchResults: "Výsledky tenisového zápasu",
    checkMatchResults: "Podívejte se na výsledky mého tenisového zápasu!",
    matchSharedSuccessfully: "Zápas úspěšně sdílen!",
    matchLinkCopied: "Odkaz na zápas zkopírován do schránky.",
    copyLinkManually: "Nepodařilo se zkopírovat odkaz. Zkopírujte ho prosím ručně.",
    final: "Konečný",
    shareMatchResults: "Sdílet výsledky zápasu",
    player: "Hráč",

    // Players page specific
    confirmDeletePlayer: "Jste si jisti, že chcete smazat tohoto hráče?",
    managePlayersDescription: "Přidávejte, upravujte nebo mažte profily hráčů.",
    mainPlayer: "Hlavní hráč",
    born: "Narozen",
    plays: "Hraje",
    leftHanded: "Levou rukou",
    rightHanded: "Pravou rukou",
    addNewPlayerDescription: "Přidejte nového hráče do svého seznamu pro sledování.",
    uploadPictureOptional: "Nahrát obrázek (volitelné)",
    birthYear: "Rok narození",
    ratingPlaceholder: "např. UTR 10.5, NTRP 4.5",
    clubPlaceholder: "např. Městský tenisový klub",
    selectOption: "Vyberte možnost",
    setAsMainPlayer: "Nastavit jako hlavního hráče",

    // Score displays
    tiebreak: "Tiebreak",
    deuce: "Shoda",

    // Missing translations found in components
    noPointDataAvailable: "Pro tento zápas nejsou k dispozici žádná data bod po bodu.",
    statsWillAppear: "Statistiky se zde objeví v průběhu zápasu.",
    statsWillAppearDescription: "Dokončete body, abyste viděli podrobné statistiky zápasu.",
    serviceStatistics: "Statistiky podání",
    firstServeWin: "% výhry 1. podání",
    secondServeWin: "% výhry 2. podání",
    breakPointsFaced: "Čelil brejkbolům",
    breakPointsSaved: "Zachráněné brejkboly",
    conversionRatePercent: "({rate}%)",
    forcedErrors: "Vynucené chyby",
    firstServeWinPercentage: "Výhra 1. podání",
    secondServePointsWon: "Vyhrané body po 2. podání",
    secondServePointsWonPercentage: "% vyhraných bodů po 2. podání",
    firstServePointsWon: "Vyhrané body po 1. podání",
    firstServePointsWonPercentage: "% vyhraných bodů po 1. podání",
    totalPointsWon: "Celkem vyhraných bodů",

    // Additional stat labels for match stats
    breakPointsWon: "Vyhrané brejkboly",
    breakPointConversion: "Proměnění brejkbolů",
    
    // End Match Dialog
    whyEndingMatch: "Proč ukončujete zápas?",
    matchCompletedNormally: "Zápas dokončen normálně",
    playerRetired: "{playerName} skrečoval(a)",
    weatherConditions: "Povětrnostní podmínky",
    
    // Simple Stats Popup
    point: "Bod",
    details: "Detaily",
    winsPoint: "{playerName} vyhrává bod.",
    serving: "Podává",
    selectHowPointEnded: "Vyberte, jak bod skončil:",

    // Point outcome labels and descriptions
    cleanWinner: "Čistý vítězný úder",
    unreturnableServe: "Nehratelný servis (Eso nebo servis winner)",
    twoConsecutiveFaults: "Dvojchyba (dvě po sobě jdoucí chyby)",
    opponentForcedIntoError: "Soupeř donucen k chybě",
    unforcedMistake: "Nevynucená chyba soupeře",
    serverMustWinForAce: "Podávající musí vyhrát bod pro Eso/servis winner.",
    onlyOnSecondServeLoss: "Platí pouze, když podávající ztratí bod při 2. podání.",
    
    // Tennis shot types
    serve: "Podání",
    forehand: "Forhend",
    backhand: "Bekhend",
    volley: "Volej",
    overhead: "Smeč",

    // Court positions and game elements
    deuceSide: "Strana shody",
    adSide: "Strana výhody",
    rallyLength: "Délka výměny",
    rallyLengthHint: "např. 3",
    courtPosition: "Pozice na kurtu",
    pointOutcome: "Výsledek bodu",
    lastShotType: "Typ posledního úderu",
    
    // Point detail sheet
    notes: "Poznámky",
    notesPlaceholder: "např. Skvělý bekhend po lajně",
    saveDetailedPoint: "Uložit detailní bod",
    whoWonThePoint: "Kdo vyhrál bod?",
    howDidTheyWin: "Jak vyhrál?",
    whatShotWasIt: "Jaký to byl úder?",
    courtSide: "Strana kurtu",
    whichSideOfCourt: "Která strana kurtu?",
    whereWasItServed: "Kam bylo podáno?",
    crossCourt: "Křížem",
    downTheLine: "Po lajně",
    bodyShot: "Na tělo",
    whereWasItHit: "Kam bylo zahráno?",
    shotDirection: "Směr úderu",
    recordPoint: "Zaznamenat bod",
    
    // Delete confirmation
    deleteMatch: "Smazat zápas",
    deleteMatchConfirm: "Jste si jisti, že chcete smazat tento zápas? Tuto akci nelze vrátit.",
    matchDeleted: "Zápas smazán.",
    failedToDeleteMatch: "Nepodařilo se smazat zápas.",
    deleting: "Mazání...",
    
    // Tab labels
    commentary: "Komentář",

    // Additional tennis terms
    forcedError: "Vynucená chyba",
    unforcedError: "Nevynucená chyba",
    pointsAndOutcomes: "Body a výsledky",
    returnStatistics: "Statistiky returnů",
    totalServicePoints: "Celkem bodů na servisu",
    totalReturnPoints: "Celkem bodů na returnu",
    returnPointsWon: "Vyhráno bodů na returnu",
    
    // Detailed scoring terms
    detailedStatistics: "Detailní statistiky",
    serveType: "Typ podání",
    servePlacement: "Umístění podání",
    wide: "Do strany",
    body: "Na tělo",
    tDownTheMiddle: "Na téčko (středem)",
    serveSpeed: "Rychlost podání (km/h)",
    ace: "Eso",
    doubleFault: "Dvojchyba",

    // Missing translations for components
    quickActions: "Rychlé akce",
    aceDescription: "Podání, kterého se příjemce nedotkne.",
    winnerDescription: "Úder, který soupeř nemůže vrátit.",
    unforcedErrorDescription: "Chyba způsobená hráčem.",
    doubleFaultDescription: "Dvě po sobě jdoucí chyby při podání.",
    pointByPointAnalysis: "Analýza bod po bodu",
    noDetailedPointLog: "Není k dispozici žádný podrobný záznam bodů.",
    enableDetailedLogging: "Povolte podrobné zaznamenávání pro zobrazení dat bod po bodu.",
    noDetailedAnalysis: "Není k dispozici žádná podrobná analýza.",
    enableDetailedLoggingForAnalysis: "Povolte podrobné zaznamenávání pro analýzu zápasu.",
    setBySetBreakdownTitle: "Rozpis po setech",

    // Additional validation error messages
    doubleFaultSecondServeError: "Dvojchyba musí být při druhém podání.",
    doubleFaultReceiverError: "Příjemce nemůže udělat dvojchybu.",
    aceServerError: "Eso může zahrát pouze podávající.",
    serviceWinnerError: "Servis winner může zahrát pouze podávající.",
    aceDisabledHint: "Pro Eso vyberte jako typ úderu 'Podání'.",
    doubleFaultDisabledHint: "Pro Dvojchybu vyberte jako typ úderu 'Podání'.",
    pointDetailsTitle: "Detaily bodu",
    pointContext: "Gem {game}, Bod {point}, podává {serverName}",
    
    wins: "vyhrává",
    ongoing: "Probíhá",
    noData: "Žádná data",
    switchToCzech: 'Přepnout do češtiny',
    switchToEnglish: 'Přepnout do angličtiny',
    unableToConnect: 'Nelze se připojit k serveru.',
    checkInternetConnection: 'Zkontrolujte prosím své internetové připojení.',
    connectionIssue: 'Problém s připojením',
    failedToClearCache: "Nepodařilo se vymazat mezipaměť:",
    failedToGetCacheInfo: "Nepodařilo se získat informace o mezipaměti:",
    clearingCache: "Mazání mezipaměti...",
    cacheCleared: "Mezipaměť úspěšně vymazána!",
    refreshing: "Obnovování...",
    checking: "Kontrola...",
    clearing: "Mazání...",
    clearCache: "Vymazat mezipaměť",
    hardRefresh: "Tvrdé obnovení",
    checkCacheInfo: "Zkontrolovat info o mezipaměti",
    cacheFound: "Nalezena mezipaměť:",
    cachesWithEntries: "Mezipaměti s položkami:",
    profilePreview: "Náhled profilu",
    clickUploadButton: "Klikněte na tlačítko nahrát pro výběr obrázku",
    clickCropButton: "Klikněte na tlačítko oříznout pro uložení změn",
    uploadImageDescription: "Nahrajte obrázek pro personalizaci svého profilu",
    cropMe: "Oříznout!",
    replaceWithNewImage: "Nahradit novým obrázkem",
    editCrop: "Upravit ořez",
    removeImage: "Odstranit obrázek",
    recommendedActions: "Doporučené akce:",
    cleanup: "Vyčistit",
    dismiss: "Zavřít",
    extensionConflictDetected: "Zjištěn konflikt rozšíření prohlížeče",
    expandNavigation: "Rozbalit navigaci",
    collapseNavigation: "Sbalit navigaci",
    newMatchButton: "Nový zápas",
    pleaseSelectImage: "Prosím vyberte obrázek.",
    failedToReadFile: "Nepodařilo se přečíst soubor.",
    failedToProcessCroppedImage: "Nepodařilo se zpracovat oříznutý obrázek.",
    pleaseSelectImageFile: "Prosím nejprve vyberte obrázek.",
    copyLink: "Kopírovat odkaz",
    failed: "Nepodařilo se",
    unable: "Nelze",
    cannot: "Nelze",
    setNumber: "Set {number}",
    selectAll: "Vybrat vše",
    getLink: "Získat odkaz",
    copy: "Kopírovat",
    failedTo: "Nepodařilo se",
    click: "Klikněte",
    upload: "Nahrát",
    select: "Vybrat",
    choose: "Zvolit",
    start: "Začít",
    end: "Konec",
    continue: "Pokračovat",
    appUpdated: "Aplikace aktualizována",
    refreshToGetLatest: "Aplikace byla aktualizována. Obnovte prosím stránku, abyste získali nejnovější verzi.",
    somethingWentWrong: "Něco se pokazilo.",
    pleaseRefresh: "Obnovte prosím stránku a zkuste to znovu.",
    managementDescription: "Zde můžete přidávat, upravovat a spravovat profily svých hráčů.",
    forDoubles: "pro čtyřhru",
    returnDefaultAvatar: "Vrátit výchozí avatar",
    buildFullUrl: "sestavit celou URL",
    missingEnvironmentVariables: "Chybějící proměnné prostředí",
    setUpPeriodicCleanup: "Nastavit periodické čištění",
    dontRenderOnServer: "Nevykreslovat na serveru",
    couldNotGetCanvasContext: "Nepodařilo se získat kontext plátna",
    fallbackDataURLFailed: "Generování záložní data URL se nezdařilo",
    canvasToBlob: "canvas.toBlob",
    totalEntriesFound: "Celkem nalezeno položek:",
    cacheNames: "Názvy mezipamětí:",
    cacheInfoCheck: "Kontrola informací o mezipaměti",
    cacheClearFailed: "Vymazání mezipaměti se nezdařilo",
    foundCaches: "Nalezeny mezipaměti:",
    clearCacheAndReload: "Vymazat mezipaměť a znovu načíst",
    justifyStart: "justify-start",
    flexItemsCenter: "flex items-center",
    pointsPlayed: "Odehrané body",
    matchLinkCopiedToClipboard: 'Odkaz na zápas zkopírován do schránky!',
    liveMatchLinkCopied: 'Odkaz na živý zápas zkopírován!',
    matchResultsLinkCopied: 'Odkaz na výsledky zápasu zkopírován!',

    // Enhanced Dashboard Statistics
    performanceOverviewHeader: "Přehled výkonu",
    performanceOverviewDescription: "Rychlý pohled na váš celkový výkon.",
    serveStatisticsHeader: "Statistiky podání",
    serveStatisticsDescription: "Klíčové metriky týkající se vaší hry na podání.",
    returnGameHeader: "Hra na příjmu",
    returnGameDescription: "Jak dobře si vedete při příjmu podání.",
    shotMakingHeader: "Tvorba úderů",
    shotMakingDescription: "Analýza vašich vítězných úderů a chyb.",

    // Stat card labels
    winStreakLabel: "Série výher",
    acesLabel: "Esa",
    firstServePercentageLabel: "% 1. podání",
    servicePointsLabel: "Vyhrané body na podání",
    doubleFaultsLabel: "Dvojchyby",
    breakPointsWonLabel: "Vyhrané brejkboly",
    returnPointsLabel: "Vyhrané body na příjmu",
    breakPointsSavedLabel: "Zachráněné brejkboly",
    firstReturnPercentageLabel: "% 1. příjmu",
    winnersLabel: "Vítězné údery",
    unforcedErrorsLabel: "Nevynucené chyby",
    netPointsLabel: "Vyhrané body na síti",
    forehandBackhandRatioLabel: "Poměr FH/BH",

    // Performance quality descriptors
    qualityExcellent: "Vynikající",
    qualityGood: "Dobrý",
    qualityWorkNeeded: "Je třeba zapracovat",
    qualityImproving: "Zlepšuje se",

    // Stat descriptions
    opportunitiesConverted: "proměněných příležitostí",
    pointsWonServing: "vyhraných bodů při podání",
    pointsWonReturning: "vyhraných bodů při příjmu",
    defensiveHolds: "ubráněných her pod tlakem",
    unforcedErrorsDescription: "nevynucených chyb za zápas",
    forwardPlay: "efektivita hry dopředu",
    winnerBalance: "rovnováha mezi vítěznými údery a chybami",
    perMatch: "na zápas",
    ofTotal: "z celku",
    completedDescription: "dokončeno",
    best: "Nejlepší",

    // Monthly stats
    thisMonthHeader: "Tento měsíc",
    matchesLabel: "Zápasy",
    wonLabel: "Vyhráno",
    avgDurationLabel: "Prům. délka",
    winStreakMonthlyLabel: "Série výher",

    // MainPlayerSetupPrompt translations
    welcomeToTennisScorePrompt: "Vítejte v TennisScore!",
    getStartedPersonalized: "Chcete-li začít s personalizovanými statistikami, nastavme vaše hráče.",
    helpShowRelevantStats: "To nám pomůže zobrazit vám nejrelevantnější statistiky a postřehy.",
    createPlayersHint: "Vytvořte profily pro sebe a své soupeře.",
    setMainPlayerHint: "Nezapomeňte nastavit jednoho hráče jako svůj hlavní profil!",

    // Extension conflict translations
    browserExtensionDetected: "Zjištěno rozšíření prohlížeče",
    browserExtensionMayInterfere: "Následující rozšíření prohlížeče mohou narušovat funkčnost aplikace:",
    detectedExtensions: "Zjištěná rozšíření:",
    tryCleanup: "Pokud máte problémy, zkuste tato rozšíření pro tuto stránku zakázat nebo použijte nástroje pro čištění v nastavení.",

    // Image upload translations
    cropYourImage: "Ořízněte svůj obrázek",
    clickUploadToReplace: "Klikněte na 'Nahrát' pro výběr nového obrázku, který nahradí ten současný.",
    clickCropToEdit: "Klikněte na 'Oříznout' pro uložení změn vašeho profilového obrázku.",
    uploadImageUpTo10MB: "Nahrajte obrázek (až 10 MB)",

    // Hydration error translations
    hydrationError: "Chyba hydratace",
    applicationError: "Chyba aplikace",
    hydrationMismatch: "Došlo k neshodě hydratace. Obsah stránky vykreslený na serveru se liší od obsahu vykresleného na klientovi.",
    commonCauses: "Běžné příčiny:",
    browserSecurityExtensions: "Rozšíření prohlížeče (např. Grammarly, blokátory reklam), která upravují stránku.",
    adBlockersModifying: "Blokátory reklam nebo rozšíření pro ochranu soukromí.",
    browserDeveloperTools: "Nástroje pro vývojáře v prohlížeči nebo jiné skripty vkládající prvky.",
    errorDetails: "Detaily chyby",

    // Enhanced bento grid translations
    secondServePointsWonPercent: "% vyhraných bodů po 2. podání",
    forcedErrorsLabel: "Vynucené chyby",
    unforcedErrorsChart: "Nevynucené chyby",
    
    // Tournament theming translations
    tournamentTheme: "Téma turnaje",
    selectTournamentForTheme: "Vyberte Grand Slam pro použití jeho tématu.",
    
    // Wizard specific translations
    next: "Další",
    chooseMatchFormat: "Vyberte formát pro začátek.",
    oneVsOne: "Jeden hráč proti druhému.",
    twoVsTwo: "Dva hráči proti druhým dvěma.",
    selectTwoPlayers: "Vyberte dva hráče pro dvouhru.",
    selectFourPlayers: "Vyberte čtyři hráče pro čtyřhru.",
    addTournamentOptional: "Volitelně přidejte název turnaje nebo ligy.",
    tournamentName: "Název turnaje",
    skipTournament: "Přeskočit prozatím",
    tournamentOptionalDescription: "Zadání názvu turnaje nebo ligy je volitelné. Můžete jej přidat později.",
    configureMatchSettings: "Nakonfigurujte nastavení zápasu.",
    traditionalScoring: "Tradiční tenisové bodování se shodou.",
    fasterGameplay: "Rychlejší hra s náhlou smrtí při shodě.",
    traditionalFinalSet: "Poslední set se hraje jako plný set.",
    quickerFinish: "10-bodový tiebreak rozhodne zápas.",
    chooseTrackingLevel: "Zvolte, jak moc detailů chcete během zápasu sledovat.",
    detailLevelCanBeChanged: "Úroveň detailů můžete kdykoli změnit v nastavení během zápasu.",
    comingSoon: "Brzy k dispozici",
    reviewMatch: "Zkontrolovat detaily zápasu",
    confirmDetailsBeforeStart: "Před zahájením zápasu potvrďte níže uvedené údaje.",
    tournament: "Turnaj",
    casualMatch: "Přátelský zápas",
    detailLevel: "Úroveň detailů",
    readyToStart: "Jste připraveni začít?",
    clickStartToBeginMatch: "Klikněte na 'Začít zápas' pro zahájení skórování.",
    review: "Zkontrolovat",
    step: "Krok",
    creating: "Vytváření...",
    autoAdvancing: "Automatické pokračování...",
    pleaseCompleteMatchFormat: "Prosím, dokončete všechna nastavení formátu zápasu.",

    // Live match settings
    failedToUpdateSettings: "Nepodařilo se aktualizovat nastavení zápasu",
    settingsUpdatedSuccessfully: "Nastavení úspěšně aktualizováno",
    matchSettings: 'Nastavení zápasu',
    adjustMatchSettingsDescription: 'Upravte nastavení pro tento zápas. Toto lze kdykoli změnit.',
    bestOfN: 'Na {n} sety',

    // New translations
    createMatchError: "Nepodařilo se vytvořit zápas",
    selectMatchRules: "Vyberte pravidla pro zápas",
  }
}

export type TranslationsKeys = keyof Translations

// Small helper function to get translations with type safety
export function getTranslations(locale: Locale): Translations {
  return translations[locale]
}

export function t(locale: Locale, key: keyof Translations): string {
  return translations[locale][key] || translations.en[key]
}