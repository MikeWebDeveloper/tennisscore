import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function RootPage() {
  try {
    console.log("[Root Page] Starting authentication check")
    
    // Add timeout protection to prevent hanging
    const authCheckPromise = getCurrentUser()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )
    
    const user = await Promise.race([authCheckPromise, timeoutPromise])
    
    if (user) {
      console.log("[Root Page] User authenticated, redirecting to dashboard")
      redirect("/dashboard")
    } else {
      console.log("[Root Page] No user found, redirecting to login")
      redirect("/login")
    }
  } catch (error) {
    console.error("[Root Page] Auth check failed:", error)
    // Always fallback to login on any error to prevent redirect loops
    redirect("/login")
  }
} 