"use server"

import { ID, Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { Match, MatchFormat, Player } from "@/lib/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { RequestDeduper } from "@/lib/utils/dedupe-requests"
import { TennisDataCompressor, ResponseCache } from "@/lib/utils/compression"

// Optimized match operations with caching and request deduplication
const cache = ResponseCache.getInstance()
const deduper = RequestDeduper.getInstance()
const compressor = TennisDataCompressor.getInstance()

export async function getOptimizedMatchById(matchId: string): Promise<Match | null> {
  const cacheKey = `match:${matchId}`
  
  // Try cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return compressor.decompressMatchData(cached)
  }
  
  // Deduplicate identical requests
  return deduper.dedupe(
    cacheKey,
    async () => {
      const { databases } = await createAdminClient()
      
      try {
        const match = await withRetry(() =>
          databases.getDocument<Match>(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_MATCHES_COLLECTION_ID!,
            matchId
          )
        )
        
        if (match) {
          // Compress and cache for 5 minutes
          const compressed = compressor.compressMatchData(match)
          cache.set(cacheKey, compressed, 300000)
          
          return match
        }
        
        return null
      } catch (error) {
        console.error("Error fetching match:", error)
        return null
      }
    }
  )
}

// Batch fetch matches for better performance
export async function getMatchesBatch(matchIds: string[]): Promise<Record<string, Match>> {
  const result: Record<string, Match> = {}
  const uncachedIds: string[] = []
  
  // Check cache for each match
  for (const id of matchIds) {
    const cached = cache.get(`match:${id}`)
    if (cached) {
      result[id] = compressor.decompressMatchData(cached)
    } else {
      uncachedIds.push(id)
    }
  }
  
  // Fetch uncached matches in batches
  if (uncachedIds.length > 0) {
    const { databases } = await createAdminClient()
    
    try {
      // Fetch in batches of 10 to avoid query limits
      const batchSize = 10
      for (let i = 0; i < uncachedIds.length; i += batchSize) {
        const batch = uncachedIds.slice(i, i + batchSize)
        
        const matches = await withRetry(() =>
          databases.listDocuments<Match>(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_MATCHES_COLLECTION_ID!,
            [Query.select([
              "$id", "player1Id", "player2Id", "score", "status", 
              "format", "surface", "location", "startedAt", "completedAt", "winnerId"
            ]), Query.equal("$id", batch)]
          )
        )
        
        // Cache and add to result
        matches.documents.forEach((match) => {
          const compressed = compressor.compressMatchData(match)
          cache.set(`match:${match.$id}`, compressed, 300000)
          result[match.$id] = match
        })
      }
    } catch (error) {
      console.error("Error batch fetching matches:", error)
    }
  }
  
  return result
}

// Optimized match listing with pagination and filtering
export async function getOptimizedMatchesByUser(options: {
  page?: number
  limit?: number
  status?: string
  playerId?: string
  useCache?: boolean
} = {}): Promise<{ matches: Match[]; total: number; hasMore: boolean }> {
  const { page = 0, limit = 20, status, playerId, useCache = true } = options
  const offset = page * limit
  
  const cacheKey = `matches:user:${JSON.stringify({ page, limit, status, playerId })}`
  
  // Try cache first if enabled
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        matches: cached.matches.map((m: any) => compressor.decompressMatchData(m))
      }
    }
  }
  
  return deduper.dedupe(
    cacheKey,
    async () => {
      const { databases } = await createAdminClient()
      
      try {
        const queries = [
          Query.orderDesc("$createdAt"),
          Query.limit(limit + 1), // Get one extra to check if there are more
          Query.offset(offset),
          Query.select([
            "$id", "$createdAt", "player1Id", "player2Id", "score", 
            "status", "format", "surface", "location", "completedAt", "winnerId"
          ])
        ]
        
        // Add filters
        if (status) {
          queries.push(Query.equal("status", status))
        }
        
        if (playerId) {
          queries.push(Query.or([
            Query.equal("player1Id", playerId),
            Query.equal("player2Id", playerId)
          ]))
        }
        
        const response = await withRetry(() =>
          databases.listDocuments<Match>(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_MATCHES_COLLECTION_ID!,
            queries
          )
        )
        
        const hasMore = response.documents.length > limit
        const matches = hasMore ? response.documents.slice(0, -1) : response.documents
        
        // Cache compressed version
        const result = {
          matches: matches,
          total: response.total,
          hasMore
        }
        
        if (useCache) {
          const compressed = {
            ...result,
            matches: matches.map(m => compressor.compressMatchData(m))
          }
          cache.set(cacheKey, compressed, 180000) // 3 minutes
        }
        
        return result
      } catch (error) {
        console.error("Error fetching matches:", error)
        return { matches: [], total: 0, hasMore: false }
      }
    }
  )
}

// Optimized score update with minimal data transfer
export async function updateMatchScoreOptimized(
  matchId: string, 
  scoreUpdate: {
    score: string
    pointLog?: string[]
    events?: string[]
    status?: "In Progress" | "Completed"
    winnerId?: string
  }
): Promise<{ success: boolean; error?: string; match?: Match }> {
  try {
    // Invalidate cache immediately for real-time consistency
    cache.invalidate(`match:${matchId}`)
    cache.invalidate('matches:user:')
    
    const { databases } = await createAdminClient()
    
    // Prepare optimized update data
    const updateData: any = {
      score: scoreUpdate.score,
      updatedAt: new Date().toISOString()
    }
    
    // Only include fields that have changed
    if (scoreUpdate.pointLog) {
      updateData.pointLog = compressor.compressPointLog(scoreUpdate.pointLog)
    }
    
    if (scoreUpdate.events) {
      updateData.events = scoreUpdate.events
    }
    
    if (scoreUpdate.status) {
      updateData.status = scoreUpdate.status
      
      if (scoreUpdate.status === "Completed") {
        updateData.completedAt = new Date().toISOString()
        if (scoreUpdate.winnerId) {
          updateData.winnerId = scoreUpdate.winnerId
        }
      }
    }
    
    const updatedMatch = await withRetry(() =>
      databases.updateDocument<Match>(
        process.env.APPWRITE_DATABASE_ID!,
        process.env.APPWRITE_MATCHES_COLLECTION_ID!,
        matchId,
        updateData
      )
    )
    
    // Update cache with new data
    const compressed = compressor.compressMatchData(updatedMatch)
    cache.set(`match:${matchId}`, compressed, 300000)
    
    // Revalidate relevant paths
    revalidatePath(`/matches/${matchId}`)
    revalidatePath('/matches')
    revalidatePath('/dashboard')
    
    return { success: true, match: updatedMatch }
  } catch (error) {
    console.error("Error updating match score:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update match"
    }
  }
}

// Optimized player stats fetching
export async function getPlayerMatchStats(
  playerId: string,
  timeframe: 'all' | 'recent' | 'month' = 'all'
): Promise<{
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  recentForm: string[]
}> {
  const cacheKey = `player:stats:${playerId}:${timeframe}`
  
  // Try cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  return deduper.dedupe(
    cacheKey,
    async () => {
      const { databases } = await createAdminClient()
      
      try {
        const queries = [
          Query.or([
            Query.equal("player1Id", playerId),
            Query.equal("player2Id", playerId)
          ]),
          Query.equal("status", "Completed"),
          Query.orderDesc("completedAt"),
          Query.select(["$id", "player1Id", "player2Id", "winnerId", "completedAt"])
        ]
        
        // Add timeframe filter
        if (timeframe === 'recent') {
          queries.push(Query.limit(10))
        } else if (timeframe === 'month') {
          const oneMonthAgo = new Date()
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
          queries.push(Query.greaterThan("completedAt", oneMonthAgo.toISOString()))
        }
        
        const response = await withRetry(() =>
          databases.listDocuments<Match>(
            process.env.APPWRITE_DATABASE_ID!,
            process.env.APPWRITE_MATCHES_COLLECTION_ID!,
            queries
          )
        )
        
        const matches = response.documents
        const totalMatches = matches.length
        const wins = matches.filter(m => m.winnerId === playerId).length
        const losses = totalMatches - wins
        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0
        
        // Calculate recent form (W/L for last 5 matches)
        const recentMatches = matches.slice(0, 5)
        const recentForm = recentMatches.map(m => m.winnerId === playerId ? 'W' : 'L')
        
        const stats = {
          totalMatches,
          wins,
          losses,
          winRate,
          recentForm
        }
        
        // Cache for 10 minutes
        cache.set(cacheKey, stats, 600000)
        
        return stats
      } catch (error) {
        console.error("Error fetching player stats:", error)
        return {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          recentForm: []
        }
      }
    }
  )
}

// Clear performance caches (useful for development)
export async function clearMatchCaches(): Promise<{ success: boolean }> {
  try {
    cache.clear()
    deduper.cancelAll()
    
    return { success: true }
  } catch (error) {
    console.error("Error clearing caches:", error)
    return { success: false }
  }
}

// Get cache performance statistics
export async function getCacheStats() {
  return {
    cache: cache.getStats(),
    deduplication: deduper.getStats()
  }
}