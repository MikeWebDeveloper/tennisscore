import { redirect } from "next/navigation"

export default async function RootPage() {
  // TEMPORARY BYPASS: Always redirect to login to isolate redirect loop
  console.log("[Root Page] Redirecting to /login")
  redirect("/login")
} 