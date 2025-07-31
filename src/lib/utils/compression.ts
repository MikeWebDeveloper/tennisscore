// Compression utilities for tennis match data and API responses

interface CompressionOptions {
  level?: 'fast' | 'balanced' | 'maximum'
  threshold?: number // Only compress data larger than this (bytes)
}

// LZ-string based compression for client-side data
export class TennisDataCompressor {
  private static instance: TennisDataCompressor
  
  static getInstance(): TennisDataCompressor {
    if (!TennisDataCompressor.instance) {
      TennisDataCompressor.instance = new TennisDataCompressor()
    }
    return TennisDataCompressor.instance
  }

  // Simple LZ77-style compression for point logs
  compressPointLog(pointLog: string[]): string {
    if (pointLog.length === 0) return ''
    
    const dictionary: Record<string, number> = {}
    const result: (string | number)[] = []
    let dictIndex = 0
    
    for (const point of pointLog) {
      if (dictionary[point] !== undefined) {
        result.push(dictionary[point])
      } else {
        dictionary[point] = dictIndex++
        result.push(point)
      }
    }
    
    return JSON.stringify({ dict: dictionary, data: result })
  }
  
  decompressPointLog(compressed: string): string[] {
    if (!compressed) return []
    
    try {
      const { dict, data } = JSON.parse(compressed)
      const reversedDict: Record<number, string> = {}
      
      // Reverse dictionary
      Object.entries(dict).forEach(([key, value]) => {
        reversedDict[value as number] = key
      })
      
      return data.map((item: string | number) => 
        typeof item === 'number' ? reversedDict[item] : item
      )
    } catch {
      return []
    }
  }

  // Compress match data by removing redundant information
  compressMatchData(matchData: any): any {
    const compressed = { ...matchData }
    
    // Compress point log if present
    if (compressed.pointLog && Array.isArray(compressed.pointLog)) {
      compressed.pointLog = this.compressPointLog(compressed.pointLog)
      compressed._compressed = true
    }
    
    // Remove calculated fields that can be regenerated
    delete compressed.statistics
    delete compressed.momentum
    delete compressed.pressure
    
    // Compress player data (keep only essential fields)
    if (compressed.players) {
      compressed.players = compressed.players.map((player: any) => ({
        id: player.id,
        name: player.name,
        profilePicture: player.profilePicture
      }))
    }
    
    return compressed
  }
  
  decompressMatchData(compressed: any): any {
    const decompressed = { ...compressed }
    
    // Decompress point log if compressed
    if (decompressed._compressed && decompressed.pointLog) {
      decompressed.pointLog = this.decompressPointLog(decompressed.pointLog)
      delete decompressed._compressed
    }
    
    return decompressed
  }

  // Estimate compression ratio
  getCompressionRatio(original: any, compressed: any): number {
    const originalSize = JSON.stringify(original).length
    const compressedSize = JSON.stringify(compressed).length
    return compressedSize / originalSize
  }
}

// Deduplicate requests to prevent multiple API calls
export class RequestDeduplicator {
  private static pendingRequests = new Map<string, Promise<any>>()
  
  static async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }
    
    // Create new request
    const promise = requestFn()
      .finally(() => {
        // Clean up when done
        this.pendingRequests.delete(key)
      })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
  
  static clearCache(pattern?: string) {
    if (pattern) {
      // Clear specific pattern
      for (const key of this.pendingRequests.keys()) {
        if (key.includes(pattern)) {
          this.pendingRequests.delete(key)
        }
      }
    } else {
      // Clear all
      this.pendingRequests.clear()
    }
  }
}

// Response caching with automatic invalidation
export class ResponseCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private static instance: ResponseCache
  
  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache()
    }
    return ResponseCache.instance
  }

  set(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }
  
  get(key: string): any | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  // Get cache statistics
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    let totalSize = 0
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        expiredEntries++
      } else {
        validEntries++
      }
      totalSize += JSON.stringify(value.data).length
    }
    
    return {
      validEntries,
      expiredEntries,
      totalEntries: this.cache.size,
      approximateSize: totalSize,
      hitRatio: validEntries / (validEntries + expiredEntries) || 0
    }
  }
}

// Batch API requests to reduce network overhead
export class RequestBatcher {
  private batches = new Map<string, {
    requests: Array<{ id: string; resolver: (data: any) => void; rejector: (error: any) => void }>
    timeout: NodeJS.Timeout
  }>()
  
  private static instance: RequestBatcher
  
  static getInstance(): RequestBatcher {
    if (!RequestBatcher.instance) {
      RequestBatcher.instance = new RequestBatcher()
    }
    return RequestBatcher.instance
  }

  batch<T>(
    batchKey: string,
    itemId: string,
    batchFn: (ids: string[]) => Promise<Record<string, T>>,
    delayMs: number = 50
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let batch = this.batches.get(batchKey)
      
      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(() => this.executeBatch(batchKey, batchFn), delayMs)
        }
        this.batches.set(batchKey, batch)
      }
      
      batch.requests.push({
        id: itemId,
        resolver: resolve,
        rejector: reject
      })
    })
  }
  
  private async executeBatch<T>(
    batchKey: string,
    batchFn: (ids: string[]) => Promise<Record<string, T>>
  ) {
    const batch = this.batches.get(batchKey)
    if (!batch) return
    
    this.batches.delete(batchKey)
    clearTimeout(batch.timeout)
    
    try {
      const ids = batch.requests.map(req => req.id)
      const results = await batchFn(ids)
      
      batch.requests.forEach(req => {
        const result = results[req.id]
        if (result !== undefined) {
          req.resolver(result)
        } else {
          req.rejector(new Error(`No result for id: ${req.id}`))
        }
      })
    } catch (error) {
      batch.requests.forEach(req => req.rejector(error))
    }
  }
}