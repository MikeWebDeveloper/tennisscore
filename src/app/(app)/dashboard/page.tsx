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

    // Fetch user's data
    const [players, matches] = await Promise.all([
      getPlayersByUser().catch((err) => {
        console.log("Dashboard - Players fetch error:", err.message)
        return []
      }),
      getMatchesByUser().catch((err) => {
        console.log("Dashboard - Matches fetch error:", err.message)
        return []
      })
    ])

    return (
      <DashboardClient 
        user={user}
        players={players}
        matches={matches}
      />
    )
  } catch (error) {
    console.log("Dashboard - Error:", error)
    redirect("/login")
  }
} 