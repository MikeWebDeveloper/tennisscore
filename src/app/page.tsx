import { redirect } from "next/navigation"

export default async function RootPage() {
  // Temporary fix: Always redirect to login to break the loop
  // The middleware will handle redirecting authenticated users to dashboard
  redirect("/login")
} 