import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    
    return NextResponse.json({ success: true, message: "Session cleared" })
  } catch (error) {
    console.error("Error clearing session:", error)
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 })
  }
} 