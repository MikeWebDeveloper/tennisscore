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

// Admin user emails
const ADMIN_EMAILS = [
  "michal.latal@yahoo.co.uk",
  "mareklatal@seznam.cz"
]

export function isAdmin(userEmail?: string | null): boolean {
  if (!userEmail) return false
  return ADMIN_EMAILS.includes(userEmail)
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || !isAdmin(user.email)) {
    redirect("/")
  }
  return user
} 