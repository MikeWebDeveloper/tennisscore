import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-server"
import { Query } from "appwrite"
import { ID } from "node-appwrite"
import { logger } from "@/lib/utils/logger"

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!
const COLLECTION_ID = process.env.APPWRITE_LIVE_VIEWERS_COLLECTION_ID!
const ACTIVE_WINDOW_SECONDS = 30

// Check if required environment variables are set
if (!DATABASE_ID || !COLLECTION_ID) {
  logger.error('❌ Missing required environment variables:', {
    DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
    COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING'
  })
}

export async function POST(request: Request) {
  logger.info('[API] /api/live-viewers POST', { url: request.url });
  
  // Temporary: Return success without doing anything if collection doesn't exist
  if (!DATABASE_ID || !COLLECTION_ID) {
    logger.debug('[DEBUG] Live viewers collection not configured, returning success without action')
    return NextResponse.json({ success: true })
  }
  
  try {
    const headers = Object.fromEntries(request.headers.entries())
    const body = await request.text()
    logger.debug("[DEBUG] Incoming /api/live-viewers POST", { headers, body })
    const { matchId, userId, isPublic } = JSON.parse(body)
    if (!matchId || !userId) {
      return NextResponse.json({ success: false, error: "Missing matchId or userId" }, { status: 400 })
    }
    
    // Enhanced logging
    logger.debug('[DEBUG] Environment check:', {
      DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
      COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING',
      actualDatabaseId: DATABASE_ID,
      actualCollectionId: COLLECTION_ID
    })
    
    const now = Date.now() // UNIX timestamp in ms
    const { databases } = await createAdminClient()
    
    // Upsert logic: find existing document by matchId and userId
    logger.debug('[DEBUG] Searching for existing document:', { matchId, userId })
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.equal("userId", userId)
      ]
    )
    logger.debug('[DEBUG] Existing documents found:', existing.total)
    
    if (existing.total > 0) {
      // Update the existing document
      logger.debug('[DEBUG] Updating existing document:', existing.documents[0].$id)
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.documents[0].$id,
        { lastActive: now, isPublic: !!isPublic }
      )
    } else {
      // Create a new document with a unique ID
      logger.debug('[DEBUG] Creating new document')
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        { matchId, userId, lastActive: now, isPublic: !!isPublic }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Error in live viewers heartbeat:", error)
    logger.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ success: false, error: "Failed to update viewer presence" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  logger.info('[API] /api/live-viewers GET', { url: request.url });
  
  // Temporary: Return 0 count if collection doesn't exist
  if (!DATABASE_ID || !COLLECTION_ID) {
    logger.debug('[DEBUG] Live viewers collection not configured, returning 0 count')
    return NextResponse.json({ success: true, count: 0 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 })
    }
    
    // Enhanced logging
    logger.debug('[DEBUG] Environment check:', {
      DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
      COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING',
      actualDatabaseId: DATABASE_ID,
      actualCollectionId: COLLECTION_ID
    })
    
    const since = Date.now() - ACTIVE_WINDOW_SECONDS * 1000
    logger.debug('[DEBUG] Fetching viewers since:', new Date(since).toISOString())
    
    const { databases } = await createAdminClient()
    // Query for all active viewers (both public and private)
    logger.debug('[DEBUG] Querying for active viewers:', { matchId, since })
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.greaterThan("lastActive", since)
      ]
    )
    logger.debug('[DEBUG] Found active viewers:', response.total)
    return NextResponse.json({ success: true, count: response.total })
  } catch (error) {
    logger.error("Error in live viewers count:", error)
    logger.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ success: false, error: "Failed to fetch viewer count" }, { status: 500 })
  }
} 