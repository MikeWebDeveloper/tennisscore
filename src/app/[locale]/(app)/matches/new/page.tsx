import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { CompactMatchWizard } from "./_components/compact-match-wizard"

export default async function NewMatchPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  // Every player can be picked, not only the newest 100
  const players = await getPlayersByUser({ all: true })

  return (
    <div className="w-full h-full grid place-items-center p-4">
      <CompactMatchWizard players={players} />
    </div>
  )
} 