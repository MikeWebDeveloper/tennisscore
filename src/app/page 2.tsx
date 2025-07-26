import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function RootPage() {
  // Always redirect to dashboard - let middleware handle auth
  redirect("/dashboard")
} 