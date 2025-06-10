import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { PlayersClient } from "./players-client"

export default async function PlayersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  const players = await getPlayersByUser().catch(() => [])

  return <PlayersClient user={user} players={players} />
} 