import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-server"
import { Query } from "appwrite"
import { ID } from "node-appwrite"

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!
const COLLECTION_ID = process.env.APPWRITE_LIVE_VIEWERS_COLLECTION_ID!
const ACTIVE_WINDOW_SECONDS = 30

export async function POST(request: Request) {
  console.log('[API] /api/live-viewers POST', { url: request.url });
  try {
    const headers = Object.fromEntries(request.headers.entries())
    const body = await request.text()
    console.log("[DEBUG] Incoming /api/live-viewers POST", { headers, body })
    const { matchId, userId, isPublic } = JSON.parse(body)
    if (!matchId || !userId) {
      return NextResponse.json({ success: false, error: "Missing matchId or userId" }, { status: 400 })
    }
    const now = Date.now() // UNIX timestamp in ms
    const { databases } = await createAdminClient()
    // Upsert logic: find existing document by matchId and userId
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.equal("userId", userId)
      ]
    )
    if (existing.total > 0) {
      // Update the existing document
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        existing.documents[0].$id,
        { lastActive: now, isPublic: !!isPublic }
      )
    } else {
      // Create a new document with a unique ID
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
    return NextResponse.json({ success: false, error: "Failed to update viewer presence" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  console.log('[API] /api/live-viewers GET', { url: request.url });
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 })
    }
    const since = Date.now() - ACTIVE_WINDOW_SECONDS * 1000
    const { databases } = await createAdminClient()
    // Query for active public viewers
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.equal("matchId", matchId),
        Query.greaterThan("lastActive", since),
        Query.equal("isPublic", true)
      ]
    )
    return NextResponse.json({ success: true, count: response.total })
  } catch (error) {
    console.error("Error in live viewers count:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch viewer count" }, { status: 500 })
  }
} 