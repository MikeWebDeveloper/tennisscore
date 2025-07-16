import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-server"
import { Query } from "appwrite"
import { ID } from "node-appwrite"

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!
const COLLECTION_ID = process.env.APPWRITE_LIVE_VIEWERS_COLLECTION_ID!
const ACTIVE_WINDOW_SECONDS = 30

// Check if required environment variables are set
if (!DATABASE_ID || !COLLECTION_ID) {
  console.error('❌ Missing required environment variables:', {
    DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
    COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING'
  })
}

export async function POST(request: Request) {
  console.log('[API] /api/live-viewers POST', { url: request.url });
  
  // Temporary: Return success without doing anything if collection doesn't exist
  if (!DATABASE_ID || !COLLECTION_ID) {
    console.log('[DEBUG] Live viewers collection not configured, returning success without action')
    return NextResponse.json({ success: true })
  }
  
  try {
    const headers = Object.fromEntries(request.headers.entries())
    const body = await request.text()
    console.log("[DEBUG] Incoming /api/live-viewers POST", { headers, body })
    const { matchId, userId, isPublic } = JSON.parse(body)
    if (!matchId || !userId) {
      return NextResponse.json({ success: false, error: "Missing matchId or userId" }, { status: 400 })
    }
    
    // Enhanced logging
    console.log('[DEBUG] Environment check:', {
      DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
      COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING',
      actualDatabaseId: DATABASE_ID,
      actualCollectionId: COLLECTION_ID
    })
    
    const now = Date.now() // UNIX timestamp in ms
    const { databases } = await createAdminClient()
    
    // Upsert logic: find existing document by matchId and userId
    console.log('[DEBUG] Searching for existing document:', { matchId, userId })
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.equal("userId", userId)
      ]
    )
    console.log('[DEBUG] Existing documents found:', existing.total)
    
    if (existing.total > 0) {
      // Update the existing document
      console.log('[DEBUG] Updating existing document:', existing.documents[0].$id)
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.documents[0].$id,
        { lastActive: now, isPublic: !!isPublic }
      )
    } else {
      // Create a new document with a unique ID
      console.log('[DEBUG] Creating new document')
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        { matchId, userId, lastActive: now, isPublic: !!isPublic }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in live viewers heartbeat:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ success: false, error: "Failed to update viewer presence" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  console.log('[API] /api/live-viewers GET', { url: request.url });
  
  // Temporary: Return 0 count if collection doesn't exist
  if (!DATABASE_ID || !COLLECTION_ID) {
    console.log('[DEBUG] Live viewers collection not configured, returning 0 count')
    return NextResponse.json({ success: true, count: 0 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 })
    }
    
    // Enhanced logging
    console.log('[DEBUG] Environment check:', {
      DATABASE_ID: DATABASE_ID ? 'SET' : 'MISSING',
      COLLECTION_ID: COLLECTION_ID ? 'SET' : 'MISSING',
      actualDatabaseId: DATABASE_ID,
      actualCollectionId: COLLECTION_ID
    })
    
    const since = Date.now() - ACTIVE_WINDOW_SECONDS * 1000
    console.log('[DEBUG] Fetching viewers since:', new Date(since).toISOString())
    
    const { databases } = await createAdminClient()
    // Query for all active viewers (both public and private)
    console.log('[DEBUG] Querying for active viewers:', { matchId, since })
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.greaterThan("lastActive", since)
      ]
    )
    console.log('[DEBUG] Found active viewers:', response.total)
    return NextResponse.json({ success: true, count: response.total })
  } catch (error) {
    console.error("Error in live viewers count:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json({ success: false, error: "Failed to fetch viewer count" }, { status: 500 })
  }
} 