import { redirect } from "next/navigation"
import { createSessionClient } from "./appwrite-server"
import { getSession } from "./session"

export async function getCurrentUser() {
  try {
    // First check if we have a valid session
    const sessionData = await getSession()
    if (!sessionData) {
      return null
    }
    
    // Use the admin client with Users service to get user info
    const { users } = await createSessionClient()
    const user = await users.get(sessionData.userId)
    
    return user
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