import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function RootPage() {
  // Server-side redirect to dashboard
  redirect("/dashboard")
} 