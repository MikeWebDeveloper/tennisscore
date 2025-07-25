// Core message types for next-intl integration
export interface Messages {
  // Common namespace
  common: {
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
    add: string
    close: string
    confirm: string
    sort: string
    saving: string
    saveChanges: string
    start: string
    end: string
    continue: string
    next: string
    copied: string
    copy: string
    view: string
    unknown: string
    failed: string
    unable: string
    cannot: string
    upload: string
    select: string
    choose: string
    click: string
    optional: string
    all: string
    refresh: string
    undo: string
  }

  // Navigation namespace
  navigation: {
    dashboard: string
    matches: string
    players: string
    profile: string
    settings: string
    overviewStats: string
    matchHistory: string
    managePlayers: string
    expandNavigation: string
    collapseNavigation: string
    newMatchButton: string
  }

  // Authentication namespace
  auth: {
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
  }

  // Match namespace
  match: {
    newMatch: string
    liveScoring: string
    liveDisplay: string
    matchCompleted: string
    winner: string
    score: string
    sets: string
    games: string
    points: string
    setUpMatch: string
    matchType: string
    quickMatch: string
    player1: string
    player2: string
    player3: string
    player4: string
    team1: string
    team2: string
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
    singles: string
    doubles: string
    bestOf: string
    noAd: string
    traditional: string
    completed: string
    inProgress: string
    vs: string
    live: string
    changeServer: string
    cannotChangeServer: string
    switchServer: string
    liveScoreboard: string
    server: string
    game: string
    lostServe: string
    breakPoint: string
    setPoint: string
    matchPoint: string
    statsTab: string
    pointsTab: string
    commentaryTab: string
    firstServe: string
    secondServe: string
    match: string
    endMatch: string
    retired: string
    weather: string
    injury: string
    matchEndedDue: string
    deleteMatch: string
    deleteMatchConfirm: string
    matchDeleted: string
    failedToDeleteMatch: string
    deleting: string
    tiebreak: string
    deuce: string
    ace: string
    doubleFault: string
    currentGame: string
    noPointsYet: string
    pointsWillAppearHere: string
  }

  // Dashboard namespace
  dashboard: {
    welcomeBack: string
    welcomeToTennisScore: string
    dashboardSubtitle: string
    performanceTrackingStarts: string
    readyToElevate: string
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
    matchesWon: string
    avgDuration: string
    winStreak: string
    setsWon: string
    activeMatches: string
    performanceOverview: string
    last30Days: string
    welcomeToTennisScorePrompt: string
    getStartedPersonalized: string
    helpShowRelevantStats: string
    createPlayersHint: string
    setMainPlayerHint: string
    performanceOverviewHeader: string
    performanceOverviewDescription: string
    thisMonthHeader: string
    matchesLabel: string
    wonLabel: string
    avgDurationLabel: string
    winStreakMonthlyLabel: string
  }

  // Player namespace
  player: {
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
    profilePicture: string
    uploadNewPicture: string
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
    noPlayersYet: string
    playerCreated: string
    playerUpdated: string
    unknownPlayer: string
    searchPlayers: string
    showingPlayersSummary: string
    createNewPlayer: string
    searchOrSelectPlayer: string
    noPlayersFound: string
    trackedPlayers: string
    actions: string
    anonymousPlayer: string
    dontTrackStats: string
  }

  // Statistics namespace
  statistics: {
    statistics: string
    totalPoints: string
    winners: string
    unforcedErrors: string
    aces: string
    doubleFaults: string
    firstServePercentage: string
    breakPoints: string
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
    excellentConversion: string
    goodConversion: string
    roomForImprovement: string
    perfectServiceRecord: string
    strongServiceGames: string
    serviceUnderPressure: string
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
    breakPointsWon: string
    breakPointConversion: string
    servicePoints: string
    receivingPoints: string
    forcedError: string
    unforcedError: string
    pointsAndOutcomes: string
    returnStatistics: string
    totalServicePoints: string
    totalReturnPoints: string
    returnPointsWon: string
    detailedStatistics: string
    pointsPlayed: string
    serveStatisticsHeader: string
    serveStatisticsDescription: string
    returnGameHeader: string
    returnGameDescription: string
    shotMakingHeader: string
    shotMakingDescription: string
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
    qualityExcellent: string
    qualityGood: string
    qualityWorkNeeded: string
    qualityImproving: string
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
    secondServePointsWonPercent: string
    forcedErrorsLabel: string
    unforcedErrorsChart: string
  }
}

// Type for getting nested keys with dot notation
export type MessageKeys = {
  [K in keyof Messages]: {
    [P in keyof Messages[K]]: `${K}.${string & P}`
  }[keyof Messages[K]]
}[keyof Messages]

// Helper type for parameter interpolation
export type MessageParams<T extends string> = T extends `${string}{${infer P}}${infer Rest}`
  ? { [K in P]: string | number } & MessageParams<Rest>
  : Record<string, never>

declare global {
  // Use type safe messages in useTranslations() and similar
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}