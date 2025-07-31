import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite-server"

export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json()
    
    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
    }

    const { databases } = await createAdminClient()
    
    // Get current match data
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    // Parse current score
    let score = {}
    try {
      score = JSON.parse(match.score)
    } catch (e) {
      score = {
        sets: [],
        games: [0, 0],
        points: [0, 0],
        isTiebreak: false,
        tiebreakPoints: [0, 0]
      }
    }
    
    // Make a small update to trigger real-time event
    const testUpdate = {
      score: JSON.stringify({
        ...score,
        points: [
          Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 4)
        ],
        testTimestamp: new Date().toISOString()
      }),
      // Add a test point to pointLog
      pointLog: [
        ...(match.pointLog || []),
        JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          message: "Test real-time update"
        })
      ]
    }
    
    console.log("🔄 Updating match with test data:", {
      matchId,
      updateKeys: Object.keys(testUpdate)
    })
    
    // Update the document
    const updatedMatch = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId,
      testUpdate
    )
    
    return NextResponse.json({
      success: true,
      message: "Test update sent",
      matchId: updatedMatch.$id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Test real-time error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test real-time" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("matchId")
  
  if (!matchId) {
    return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
  }

  try {
    const { databases } = await createAdminClient()
    
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_MATCHES_COLLECTION_ID!,
      matchId
    )
    
    return NextResponse.json({
      matchId: match.$id,
      status: match.status,
      score: match.score,
      pointLogLength: match.pointLog?.length || 0,
      lastUpdated: match.$updatedAt
    })
  } catch (error) {
    console.error("Get match error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get match" },
      { status: 500 }
    )
  }
}