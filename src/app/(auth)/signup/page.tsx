import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignupForm } from "./_components/signup-form"

export default async function SignupPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  return <SignupForm />
} 