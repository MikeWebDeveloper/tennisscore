import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { CompactMatchWizard } from "./_components/compact-match-wizard"

export default async function NewMatchPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const players = await getPlayersByUser()

  return (
    <div className="w-full h-full grid place-items-center p-4">
      <CompactMatchWizard players={players} />
    </div>
  )
} 