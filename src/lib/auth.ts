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
      // Add required fields for User type compatibility
      $createdAt: new Date().toISOString(), // Placeholder since we don't have this from session
      $updatedAt: new Date().toISOString(), // Placeholder since we don't have this from session
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