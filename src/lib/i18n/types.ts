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
  manageAppPreferences: string
  cacheUpdates: string
  soundEffects: string
  soundEffectsNote: string

  cacheManagement: string
  cacheInfo: string
  cacheManagementTools: string
  cacheInfoShows: string
  whyUseCacheManagement: string
  checkUpdatesWhen: string
  clearCacheWhen: string
  ensureLatestVersion: string
  fixIssuesWithApp: string
  forceReloadWhen: string
  improvePerformance: string
  installAppWhen: string
  resolveProblemsWithData: string
  whenToUseFeatures: string
  appNotLoadingProperly: string
  clearCache: string
  clearCacheRemoves: string
  clearingCache: string
  connectionStatus: string
  experiencingSlowPerformance: string
  failedToClearCache: string
  failedToGetCacheInfo: string
  hardRefresh: string
  hardRefreshReloads: string
  needToTroubleshoot: string
  refreshing: string
  wantToCheckStorage: string
  whenToUseTools: string
  overviewStats: string
  matchHistory: string
  managePlayers: string
  playerStats: string
  playerMetrics: string
  
  // Dashboard specific
  welcomeBack: string
  welcomeToTennisScore: string
  dashboardSubtitle: string
  performanceTrackingStarts: string
  readyToElevate: string
  
  // Match scoring
  newMatch: string
  liveScoring: string
  liveDisplay: string
  matchCompleted: string
  winner: string
  winnerType: string
  winnerTypeHint: string
  regular: string
  return: string
  pointDetails: string
  shotDirection: string
  crossCourt: string
  downTheLine: string
  bodyShot: string
  howDidTheyWin: string
  wasItReturn: string
  shotTypes: string
  shotDirections: string
  dropShot: string
  lob: string
  score: string
  sets: string
  games: string
  points: string
  pointsOver: string
  pointsPerSet: string
  pointsPerMinute: string
  
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
  totalServiceGames: string
  breaksOfServe: string
  lastTenPoints: string
  momentumTracker: string
  conversionRate: string
  excellentConversionRate: string
  goodConversionRate: string
  roomForImprovement: string
  breakPointPressure: string
  breakPointsCreated: string
  breakPointsConverted: string
  breakPointOpportunities: string
  serviceDominance: string
  serviceGamesHeld: string
  gamesLostOnServe: string
  pointDistributionAnalysis: string
  performanceInsights: string
  performanceInsightsColon: string
  servicePower: string
  pressurePoints: string
  matchRhythm: string
  playingPace: string
  
  // Analysis insights
  perfectServiceRecord: string
  strongServiceGames: string
  serviceUnderPressure: string
  serviceGamesUnderPressure: string
  
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
  noMatchesFound: string
  noMatchesFoundCriteria: string
  tennisMatchResults: string
  checkMatchResults: string
  matchSharedSuccessfully: string
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
  whatShotWasIt: string
  courtSide: string
  whichSideOfCourt: string
  whereWasItServed: string
  whereWasItHit: string
  recordPoint: string
  
  // Delete confirmation
  deleteMatch: string
  deleteMatchConfirm: string
  matchDeleted: string
  failedToDeleteMatch: string
  deleting: string
  matchReportDownloadedSuccessfully: string
  
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
  long: string
  net: string
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
  cacheCleared: string
  checking: string
  clearing: string
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
  
  // Search placeholders
  searchPlayers: string
  searchMatches: string
  
  // Filter options
  all: string
  allTime: string
  last3Months: string
  thisYear: string
  
  // Summary messages
  showingMatchesSummary: string
  showingPlayersSummary: string
  
  // Authentication
  signingIn: string
  signIn: string
  tennisScore: string
  welcomeBackAuth: string
  signInToYourAccount: string
  email: string
  enterYourEmail: string
  password: string
  enterYourPassword: string
  createYourAccount: string
  getStartedWithTennisScore: string
  name: string
  enterYourName: string
  createPassword: string
  confirmPassword: string
  confirmYourPassword: string
  creatingAccount: string
  createAccount: string
  dontHaveAccount: string
  signUp: string
  alreadyHaveAccount: string
  passwordsDoNotMatch: string
  unexpectedError: string
  yourDigitalTennisCompanion: string
  
  // Status labels
  completedStatus: string
  liveStatus: string
  retiredStatus: string
  
  // Match types
  doublesType: string
  singlesType: string
  unknownPlayer: string
  createdBy: string
  vs: string
  watchLive: string
  
  // Public live match
  previewModeStatus: string
  matchLinkCopied: string
  liveTennisMatch: string
  liveTennis: string
  
  // Point by point view
  currentGame: string
  noPointsYet: string
  pointsWillAppearHere: string
  
  // Admin section
  adminMenuDescription: string
  allMatchesAdminView: string
  viewAllMatchesCreated: string
  searchByPlayerNames: string
  searching: string
  showingMatches: string
  noMatchesFoundSearch: string
  loadMoreMatches: string
  
  // Dashboard - View More/Show Less
  viewMoreStats: string
  showLess: string
  showAll: string
  
  // Match Details
  setLabel: string
  opponentAnalysis: string
  noOpponentData: string
  opponents: string
  yourNemeses: string
  toughOpponents: string
  closeRivalries: string
  competitiveMatches: string
  yourBunnies: string
  favorableMatchups: string
  breaksOfServeStats: string
  momentumTrackerHeader: string
  lastTenPointsLabel: string
  breakPointPressureAnalysis: string
  conversionRateLabel: string
  excellentConversionRateDescription: string
  goodConversionRateDescription: string
  gamesLostOnServeLabel: string
  perfectServiceRecordDescription: string
  doubleFaultsAbbr: string
  acesServedTotalLabel: string
  matchRhythmLabel: string
  noDetailedPointLogMatch: string
  enableDetailedLoggingMatch: string
  formatLabel: string
  bestOfLabel: string
  noAdLabel: string
  doublesLabel: string
  exportSetReport: string
  exportMatchReport: string
  generateProfessionalTennis: string
  matchInformation: string
  exportOptions: string
  chooseWhatToInclude: string
  reportTemplate: string
  professional: string
  modernDesignWithCore: string
  detailed: string
  completeAnalysisWithServe: string
  basic: string
  cleanMinimalistFormat: string
  includeContent: string
  pointByPointLog: string
  advancedStatistics: string
  chartsVisualizations: string
  comingSoonFeature: string
  momentumTrends: string
  exportPreview: string
  templateSections: string
  matchOverview: string
  coreStatistics: string
  tacticalAnalysis: string
  setAnalysis: string
  liveSetExport: string
  thisWillExportData: string
  downloadPDF: string
  whatsApp: string
  emailOption: string
  matchReportSharedSuccessfully: string
  openingWhatsAppToShare: string
  openingEmailToShare: string
  failedToExportMatchReport: string
  noMatchesFoundMessage: string
  aboutCacheManagementSection: string
  clearCacheButton: string
  cacheClearedMessage: string
  onlineAllFeatures: string
  offlineLimitedFeatures: string
  enableSoundEffects: string
  turnOnAudioFeedback: string
  volume: string
  soundCategories: string
  pointSounds: string
  basicPointScoring: string
  criticalPointSounds: string
  breakPointsSetPoints: string
  matchEventSounds: string
  gameWonSetWon: string
  testDifferentSounds: string
  aceShot: string
  matchPointSound: string
  matchWon: string
  
  // Player Statistics Page
  playerStatsTitle: string
  playerStatsSubtitle: string
  backToDashboard: string
  detailedAnalysis: string
  wantDeeperInsights: string
  exploreDeeperInsights: string
  viewFullAnalysis: string
  
  // Stat Card Titles
  statTotalMatches: string
  statCurrentRating: string
  statBestWinStreak: string
  statAvgMatchDuration: string
  statLongestMatch: string
  statShortestMatch: string
  statSetsRecord: string
  statGamesRecord: string
  statPointsRecord: string
  statAceRate: string
  statDoubleFaultRate: string
  statServiceGamesWon: string
  statReturnGamesWon: string
  statTiebreakRecord: string
  statBestMonth: string
  statChallengingMonth: string
  statBestDay: string
  statTimePreference: string
  statMostPlayedOpponent: string
  statBestRecordAgainst: string
  statToughestOpponent: string
  statAvgOpponentRating: string
  statCurrentStreak: string
  statLongestWinStreak: string
  statLongestLossStreak: string
  statComebackVictories: string
  statClutchPerformance: string
  statDominanceScore: string
  statConsistencyRating: string
  statImprovementTrend: string
  
  // Stat Card Subvalues
  statStarting: string
  statConsecutiveWins: string
  statPerMatch: string
  statTotalAces: string
  statTotal: string
  statWins: string
  statLosses: string
  statConsecutiveLosses: string
  statFromSetDown: string
  statDecidingSets: string
  statOutOf100: string
  statPerformanceStability: string
  statLast3Months: string
  statEloRating: string
  
  // Dashboard specific translations
  loadingMoreMatches: string
  improving: string
  building: string
  onFire: string
  played: string
  noMatches: string
  lastMatch: string
  of: string
  won: string
  lost: string
  
  // Smart Notifications
  amazingComebackTitle: string
  amazingComebackMessage: string
  stayActiveTitle: string
  stayActiveMessage: string
  scheduleMatch: string
  
  // Activity Feed
  recentActivity: string
  noRecentActivity: string
  startByRecordingFirstMatch: string
  
  // What's New Section
  whatsNew: string
  viewFullChangelog: string
  performanceOptimizations: string
  performanceOptimizationsDescription: string
  enhancedStatistics: string
  enhancedStatisticsDescription: string
  pwaInstallPrompts: string
  pwaInstallPromptsDescription: string
  new: string
  improved: string
  
  // Limited Data Notice
  showingLimitedMatches: string
  forCompleteAnalysisVisitStats: string
  
  // Activity Types
  milestone: string
  activityMatch: string
  achievement: string
  tip: string
  insight: string
  warning: string
  
  // Activity Messages
  goodWinRate: string
  winRateKeepImproving: string
  wonAgainst: string
  lostTo: string
  scoreNotRecorded: string
  viewMatch: string
  viewStats: string
  
  // Quick Actions
  recordLatestGame: string
  createMatch: string
  viewFullPlayerStats: string
  detailedPerformanceAnalysis: string
  viewPlayerStats: string
  showCompletePlayerStats: string
  
  // Achievement Messages
  achievementUnlocked: string
  winRateImproved: string
  
  // Notification Types
  notificationTypeMilestone: string
  notificationTypeAchievement: string
  notificationTypeInsight: string
  notificationTypeWarning: string
  notificationTypeTip: string
}

export type TranslationsKeys = keyof Translations