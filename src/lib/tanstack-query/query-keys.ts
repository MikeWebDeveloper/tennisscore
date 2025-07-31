/**
 * Tennis app query key factory
 * Provides type-safe, hierarchical query keys for consistent caching
 */

export const queryKeys = {
  // User-related queries
  users: {
    all: ['users'] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
    profile: (userId: string) => [...queryKeys.users.all, 'profile', userId] as const,
  },
  
  // Player-related queries
  players: {
    all: ['players'] as const,
    lists: () => [...queryKeys.players.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.players.lists(), userId] as const,
    detail: (playerId: string) => [...queryKeys.players.all, 'detail', playerId] as const,
    search: (query: string) => [...queryKeys.players.all, 'search', query] as const,
    czechSearch: (query: string) => [...queryKeys.players.all, 'czech-search', query] as const,
    main: (userId: string) => [...queryKeys.players.all, 'main', userId] as const,
  },
  
  // Match-related queries
  matches: {
    all: ['matches'] as const,
    lists: () => [...queryKeys.matches.all, 'list'] as const,
    list: (userId: string, filters?: { status?: string; playerId?: string }) => 
      [...queryKeys.matches.lists(), userId, filters] as const,
    detail: (matchId: string) => [...queryKeys.matches.all, 'detail', matchId] as const,
    live: (matchId: string) => [...queryKeys.matches.all, 'live', matchId] as const,
    recent: (userId: string, limit?: number) => 
      [...queryKeys.matches.all, 'recent', userId, limit] as const,
  },
  
  // Statistics-related queries
  statistics: {
    all: ['statistics'] as const,
    player: (playerId: string) => [...queryKeys.statistics.all, 'player', playerId] as const,
    playerDetailed: (playerId: string, timeframe?: string) => 
      [...queryKeys.statistics.all, 'player-detailed', playerId, timeframe] as const,
    match: (matchId: string) => [...queryKeys.statistics.all, 'match', matchId] as const,
    dashboard: (userId: string) => [...queryKeys.statistics.all, 'dashboard', userId] as const,
  },
  
  // File upload queries
  uploads: {
    all: ['uploads'] as const,
    profilePicture: (playerId: string) => [...queryKeys.uploads.all, 'profile-picture', playerId] as const,
  },
} as const

export type QueryKeys = typeof queryKeys