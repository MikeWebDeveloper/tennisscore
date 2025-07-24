import { Translations } from './types'

export const en: Translations = {
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
    playerStats: "Player Stats",
    playerMetrics: "Personal metrics",

    // Dashboard specific
    welcomeBack: "Welcome back",
    welcomeToTennisScore: "Welcome to TennisScore!",
    dashboardSubtitle: "Your personal tennis match tracker.",
    performanceTrackingStarts: "Performance tracking starts here.",
    readyToElevate: "Ready to elevate your game?",

    // Match scoring
    newMatch: "New Match",
    liveScoring: "Live Scoring",
    liveDisplay: "Live",
    matchCompleted: "Match Completed",
    winner: "Winner",
    winnerType: "Winner Type",
    winnerTypeHint: "Specify if this is a regular winner or a return winner (won directly from service)",
    regular: "Regular",
    return: "Return",
    pointDetails: "Point Details",
    shotDirection: "Shot Direction",
    crossCourt: "Cross Court",
    downTheLine: "Down the Line",
    bodyShot: "Body Shot",
    howDidTheyWin: "How did they win?",
    wasItReturn: "Was it return?",
    shotTypes: "Shot Types",
    shotDirections: "Shot Directions",
    dropShot: "Drop Shot",
    lob: "Lob",
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
    excellentConversionRate: "Excellent conversion rate under pressure.",
    goodConversionRate: "Good conversion rate, but can be improved.",
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
    conversionRatePercent: "Conversion Rate",
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
    whatShotWasIt: "What shot was it?",
    courtSide: "Court Side",
    whichSideOfCourt: "Which side of the court?",
    whereWasItServed: "Where was it served?",
    whereWasItHit: "Where was it hit?",
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
    long: "Long",
    net: "Net",
    tDownTheMiddle: "T (Center)",
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

    // Missing dashboard translations
    loadingMoreMatches: "Loading more matches...",
    loadMoreMatches: "Load More Matches", 
    of: "of",
    improving: "Improving",
    onFire: "On Fire!",
    building: "Building",
    played: "played",
    won: "Won",
    lost: "Lost",
    noMatches: "No matches",
    lastMatch: "Last Match",
    recordLatestGame: "Record your latest game",
    createMatch: "Create Match",
    viewFullPlayerStats: "View Full Player Stats",
    detailedPerformanceAnalysis: "Detailed performance analysis",
    viewPlayerStats: "View Player Stats",

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
    
    // Search placeholders
    searchPlayers: "Search players by name or rating...",
    searchMatches: "Search matches by player name...",
    
    // Filter options
    all: "All",
    allTime: "All Time",
    last3Months: "Last 3 Months",
    thisYear: "This Year",
    
    // Summary messages
    showingMatchesSummary: "Showing {shown} of {total} matches",
    showingPlayersSummary: "Showing {shown} of {total} players",
    
    // Authentication
    signingIn: "Signing in...",
    signIn: "Sign In",
    tennisScore: "TennisScore",
    welcomeBackAuth: "Welcome back",
    signInToYourAccount: "Sign in to your account",
    email: "Email",
    enterYourEmail: "Enter your email",
    password: "Password",
    enterYourPassword: "Enter your password",
    createYourAccount: "Create your account",
    getStartedWithTennisScore: "Get started with TennisScore",
    name: "Name",
    enterYourName: "Enter your name",
    createPassword: "Create password",
    confirmPassword: "Confirm password",
    confirmYourPassword: "Confirm your password",
    creatingAccount: "Creating account...",
    createAccount: "Create Account",
    dontHaveAccount: "Don't have an account?",
    signUp: "Sign up",
    alreadyHaveAccount: "Already have an account?",
    passwordsDoNotMatch: "Passwords do not match",
    unexpectedError: "An unexpected error occurred",
    yourDigitalTennisCompanion: "Your digital tennis companion",
    
    // Status labels
    completedStatus: "Completed",
    liveStatus: "Live",
    retiredStatus: "Retired",
    
    // Match types
    doublesType: "Doubles",
    singlesType: "Singles",
    createdBy: "Created by",
    watchLive: "Watch Live",
    
    // Public live match
    previewModeStatus: "Preview mode - scores update every 8-10 seconds",
    matchLinkCopied: "Match link copied to clipboard! Share it with others to let them watch live.",
    liveTennisMatch: "Live Tennis Match",
    liveTennis: "Live Tennis",
    
    // Point by point view
    currentGame: "Current Game",
    noPointsYet: "No points yet",
    pointsWillAppearHere: "Points will appear here as the match progresses",
    
    // Dashboard - View More/Show Less
    viewMoreStats: "View More Stats",
    showLess: "Show Less",
    showAll: "Show All",
    
    // Opponent Analysis
    opponentAnalysis: "Opponent Analysis",
    noOpponentData: "No opponent data available yet. Play more matches to see your nemeses and bunnies!",
    opponents: "opponents",
    yourNemeses: "Your Nemeses",
    toughOpponents: "Tough Opponents", 
    closeRivalries: "Close Rivalries",
    competitiveMatches: "Competitive Matches",
    yourBunnies: "Your Bunnies", 
    favorableMatchups: "Favorable Matchups",
    
    // Matches - Search/Filter
    noMatchesFoundCriteria: "No matches found matching your criteria",
    
    // Match Details
    
    // Analysis Tab
    matchSummary: "MATCH SUMMARY",

    breaksOfServeStats: "Breaks of Serve",
    momentumTrackerHeader: "MOMENTUM TRACKER",
    lastTenPointsLabel: "Last 10 Points",
    breakPointPressureAnalysis: "Break Point Pressure",
    conversionRateLabel: "Conversion Rate",
    excellentConversionRateDescription: "Excellent conversion rate - efficient in big moments",
    goodConversionRateDescription: "Good conversion rate - capitalizing on opportunities", 

    totalServiceGames: "Total Service Games",
    gamesLostOnServeLabel: "Games Lost on Serve",
    perfectServiceRecordDescription: "Perfect service record - no breaks of serve",

    serviceGamesUnderPressure: "Service games under pressure",

    doubleFaultsAbbr: "DFs",
    
    // Overview Tab
    setLabel: "Set",
    performanceInsightsColon: "Performance Insights:",

    acesServedTotalLabel: "aces served total",

    breakPointOpportunities: "break point opportunities created",
    matchRhythmLabel: "Match rhythm",
    pointsOver: "points over",

    pointsPerSet: "points per set",

    pointsPerMinute: "points per minute",
    
    // Point Log Tab
    noDetailedPointLogMatch: "No detailed point log available for this match.",
    enableDetailedLoggingMatch: "Enable detailed logging during live scoring to see point-by-point analysis.",
    
    // Match Information Labels

    formatLabel: "Format",

    bestOfLabel: "Best of",
    noAdLabel: "(No-Ad)",

    doublesLabel: "Doubles",

    // Export dialog
    exportSetReport: "Export Set Report",
    exportMatchReport: "Export Match Report", 
    generateProfessionalTennis: "Generate a professional tennis match report with statistics and analysis",
    matchInformation: "Match Information",

    exportOptions: "Export Options",
    chooseWhatToInclude: "Choose what to include in your report",
    reportTemplate: "Report Template",
    professional: "Professional",
    modernDesignWithCore: "Modern design with core statistics and set analysis",
    detailed: "Detailed",
    completeAnalysisWithServe: "Complete analysis with serve patterns, tactical insights, pressure points",
    basic: "Basic",
    cleanMinimalistFormat: "Clean, minimalist format with key match statistics",
    includeContent: "Include Content",
    pointByPointLog: "Point-by-point log",
    advancedStatistics: "Advanced statistics",
    chartsVisualizations: "Charts & visualizations",
    comingSoonFeature: "Coming soon",
    momentumTrends: "Momentum trends",
    exportPreview: "Export Preview",
    templateSections: "Template Sections",
    matchOverview: "Match Overview",
    coreStatistics: "Core Statistics",
    tacticalAnalysis: "Tactical Analysis",

    setAnalysis: "Set Analysis",

    liveSetExport: "Live Set Export",
    thisWillExportData: "This will export data from Set {setNumber} only. Full match data will be available after completion.",
    downloadPDF: "Download PDF",

    whatsApp: "WhatsApp",
    emailOption: "Email",
    matchReportDownloadedSuccessfully: "Match report downloaded successfully!",
    matchReportSharedSuccessfully: "Match report shared successfully!",
    openingWhatsAppToShare: "Opening WhatsApp to share report...",
    openingEmailToShare: "Opening email to share report...",
    failedToExportMatchReport: "Failed to export match report. Please try again.",
    
    // Admin section
    adminMenuDescription: "All matches",
    allMatchesAdminView: "All Matches (Admin View)",
    viewAllMatchesCreated: "View all matches created by all users. This section is only accessible to privileged users.",
    searchByPlayerNames: "Search by player names, tournament, or creator email...",
    searching: "Searching...",
    
    // Smart Notifications
    amazingComebackTitle: "🚀 Amazing Comeback!",
    amazingComebackMessage: "Your win rate improved by {percentage}% from last month!",
    stayActiveTitle: "🎾 Stay Active",
    stayActiveMessage: "You've only played {count} matches this month. Regular play helps maintain your skills!",
    scheduleMatch: "Schedule Match",
    
    // Activity Feed
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity",
    startByRecordingFirstMatch: "Start by recording your first match",
    
    // What's New Section
    whatsNew: "What's New",
    viewFullChangelog: "View Full Changelog",
    performanceOptimizations: "Performance Optimizations",
    performanceOptimizationsDescription: "Significantly improved dashboard load times with smart caching and data pagination",
    enhancedStatistics: "Enhanced Statistics",
    enhancedStatisticsDescription: "New detailed analytics page with comprehensive match insights and opponent analysis",
    pwaInstallPrompts: "PWA Install Prompts",
    pwaInstallPromptsDescription: "Added native app installation prompts for better mobile experience",
    new: "New",
    improved: "Improved",
    
    // Limited Data Notice
    showingLimitedMatches: "Showing {current} of {total} recent matches",
    forCompleteAnalysisVisitStats: "For complete analysis, visit your stats page",
    
    // Activity Types
    milestone: "milestone",
    activityMatch: "match",
    achievement: "achievement",
    tip: "tip",
    insight: "insight",
    warning: "warning",
    
    // Activity Messages
    goodWinRate: "Good Win Rate",
    winRateKeepImproving: "{percentage}% win rate - keep improving!",
    wonAgainst: "Won against {opponent}",
    lostTo: "Lost to {opponent}",
    scoreNotRecorded: "Score not recorded",
    viewMatch: "View Match",
    viewStats: "View Stats",
    
    // Quick Actions
    showCompletePlayerStats: "Show complete player statistics",
    
    // Achievement Messages
    achievementUnlocked: "achievement",
    winRateImproved: "Your win rate improved by {percentage}% from last month!",
    
    // Notification Types
    notificationTypeMilestone: "milestone",
    notificationTypeAchievement: "achievement", 
    notificationTypeInsight: "insight",
    notificationTypeWarning: "warning",
    notificationTypeTip: "tip",
    
    showingMatches: "Showing {count} of {total} matches",
    noMatchesFoundSearch: "No matches found matching your search.",
    noMatchesFoundMessage: "No matches found.",
    
    // Settings page

    manageAppPreferences: "Manage your app preferences and cache settings",
    cacheUpdates: "Cache & Updates",
    soundEffects: "Sound Effects",
    aboutCacheManagementSection: "About Cache Management",
    whyUseCacheManagement: "Why use cache management?",
    fixIssuesWithApp: "Fix issues with the app not loading properly",
    resolveProblemsWithData: "Resolve problems with outdated data or missing content",
    improvePerformance: "Improve performance and reduce loading times",
    ensureLatestVersion: "Ensure you're running the latest version of the app",
    whenToUseFeatures: "When to use these features:",
    clearCacheWhen: "Clear Cache: When experiencing loading issues or seeing old data",
    forceReloadWhen: "Force Reload: When the app seems stuck or unresponsive",
    checkUpdatesWhen: "Check Updates: When you suspect a new version is available",
    installAppWhen: "Install App: To use the app offline or get a native-like experience",
    
    // Cache manager
    cacheManagement: "Cache Management",
    clearCacheButton: "Clear Cache",

    cacheInfo: "Cache Info",

    cacheClearedMessage: "Cache cleared successfully!",

    cacheManagementTools: "🛠️ Cache Management Tools",
    clearCacheRemoves: "Clear Cache: Removes stored data to fix loading issues",
    hardRefreshReloads: "Hard Refresh: Reloads the entire app bypassing cache",
    cacheInfoShows: "Cache Info: Shows current cache status and storage usage",
    whenToUseTools: "When to use these tools:",
    appNotLoadingProperly: "App not loading properly or showing outdated content",
    experiencingSlowPerformance: "Experiencing slow performance or errors",
    wantToCheckStorage: "Want to check how much storage the app is using",
    needToTroubleshoot: "Need to troubleshoot connection or sync issues",
    connectionStatus: "Connection Status",
    onlineAllFeatures: "🟢 Online - All features available",
    offlineLimitedFeatures: "🟡 Offline - Limited features available",
    
    // Sound settings
    enableSoundEffects: "Enable Sound Effects",
    turnOnAudioFeedback: "Turn on audio feedback for match events",
    volume: "Volume",
    soundCategories: "Sound Categories",
    pointSounds: "Point Sounds",
    basicPointScoring: "Basic point scoring, aces, double faults",
    criticalPointSounds: "Critical Point Sounds",
    breakPointsSetPoints: "Break points, set points, match points",
    matchEventSounds: "Match Event Sounds",
    gameWonSetWon: "Game won, set won, match completion",
    testDifferentSounds: "Test Different Sounds",
    aceShot: "Ace",

    matchPointSound: "Match Point",
    matchWon: "Match Won",
    soundEffectsNote: "Sound effects enhance your tennis scoring experience with audio feedback for important match events.",
    
    // Player Statistics Page
    playerStatsTitle: "{playerName}'s Statistics",
    playerStatsSubtitle: "Comprehensive performance metrics and insights",
    backToDashboard: "Back to Dashboard",
    detailedAnalysis: "Detailed Analysis",
    wantDeeperInsights: "Want deeper insights?",
    exploreDeeperInsights: "Explore detailed match analysis, performance trends, and head-to-head comparisons",
    viewFullAnalysis: "View Full Analysis",
    
    // Stat Card Titles
    statTotalMatches: "Total Matches",
    statCurrentRating: "Current Rating",
    statBestWinStreak: "Best Win Streak",
    statAvgMatchDuration: "Avg Match Duration",
    statLongestMatch: "Longest Match",
    statShortestMatch: "Shortest Match",
    statSetsRecord: "Sets Record",
    statGamesRecord: "Games Record",
    statPointsRecord: "Points Record",
    statAceRate: "Ace Rate",
    statDoubleFaultRate: "Double Fault Rate",
    statServiceGamesWon: "Service Games Won",
    statReturnGamesWon: "Return Games Won",
    statTiebreakRecord: "Tiebreak Record",
    statBestMonth: "Best Month",
    statChallengingMonth: "Challenging Month",
    statBestDay: "Best Day",
    statTimePreference: "Time Preference",
    statMostPlayedOpponent: "Most Played Opponent",
    statBestRecordAgainst: "Best Record Against",
    statToughestOpponent: "Toughest Opponent",
    statAvgOpponentRating: "Avg Opponent Rating",
    statCurrentStreak: "Current Streak",
    statLongestWinStreak: "Longest Win Streak",
    statLongestLossStreak: "Longest Loss Streak",
    statComebackVictories: "Comeback Victories",
    statClutchPerformance: "Clutch Performance",
    statDominanceScore: "Dominance Score",
    statConsistencyRating: "Consistency Rating",
    statImprovementTrend: "Improvement Trend",
    
    // Stat Card Subvalues
    statStarting: "Starting",
    statConsecutiveWins: "consecutive wins",
    statPerMatch: "per match",
    statTotalAces: "total aces",
    statTotal: "total",
    statWins: "wins",
    statLosses: "losses",
    statConsecutiveLosses: "consecutive losses",
    statFromSetDown: "from set down",
    statDecidingSets: "deciding sets",
    statOutOf100: "out of 100",
    statPerformanceStability: "performance stability",
    statLast3Months: "last 3 months",
    statEloRating: "ELO rating",
  }
