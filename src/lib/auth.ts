import { redirect } from "next/navigation"
import { getSession } from "./session"

export async function getCurrentUser() {
  try {
    // Get session data - this contains the user info we need
    const sessionData = await getSession()
    if (!sessionData) {
      return null
    }
    
    // Return user-like object from session data
    // This avoids the problematic Appwrite API call
    return {
      $id: sessionData.userId,
      email: sessionData.email,
      // Add other needed fields from session if available
    }
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