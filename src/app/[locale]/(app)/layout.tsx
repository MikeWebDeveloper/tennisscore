import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"

// Every child uses the current user's session or operates on their data.
// Never generate a shared, sessionless HTML/RSC response at build time.
export const dynamic = "force-dynamic"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/login")
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  )
}
