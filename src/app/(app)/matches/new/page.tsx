import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { getPlayersByUser } from "@/lib/actions/players"
import { CreateMatchForm } from "./_components/create-match-form"

export default async function NewMatchPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const players = await getPlayersByUser()

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Match</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new tennis match with custom format and player selection.
        </p>
      </div>
      
      <CreateMatchForm players={players} />
    </div>
  )
} 