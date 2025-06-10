import { redirect } from "next/navigation"
import { createSessionClient } from "./appwrite-server"

export async function getCurrentUser() {
  try {
    const account = await createSessionClient()
    return await account.get()
  } catch {
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
} 