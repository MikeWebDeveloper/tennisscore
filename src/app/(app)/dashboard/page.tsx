import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { getMatchesByUser } from "@/lib/actions/matches"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      redirect("/login")
    }

    // Fetch user's data with more explicit error logging
    const players = await getPlayersByUser().catch((err) => {
      console.error("Dashboard Page - Failed to fetch players:", err.message)
      return [] // Return empty array on failure
    })

    const matches = await getMatchesByUser().catch((err) => {
      console.error("Dashboard Page - Failed to fetch matches:", err.message)
      return [] // Return empty array on failure
    })

    // Pass the potentially empty arrays to the client
    return (
      <DashboardClient 
        user={user}
        players={players}
        matches={matches}
      />
    )
  } catch (error) {
    // This top-level catch will handle errors from getCurrentUser or redirection
    console.error("Dashboard Page - Unrecoverable error:", error)
    redirect("/login")
  }
} 