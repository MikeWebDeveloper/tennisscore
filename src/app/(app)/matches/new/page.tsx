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
    <CreateMatchForm players={players} />
  )
} 