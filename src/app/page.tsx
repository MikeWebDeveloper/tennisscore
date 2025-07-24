import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function RootPage() {
  try {
    // Check authentication with error handling
    const user = await getCurrentUser()
    
    if (user) {
      redirect("/dashboard")
    } else {
      redirect("/login")
    }
  } catch (error) {
    // If there's any error with auth check, redirect to login
    console.error("Root page auth check failed:", error)
    redirect("/login")
  }
} 