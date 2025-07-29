import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./_components/login-form"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  return <LoginForm />
} 