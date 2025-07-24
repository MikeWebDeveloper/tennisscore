import { LoginForm } from "./_components/login-form"

export default async function LoginPage() {
  // TEMPORARY: Disable auth check to prevent redirect loop
  // const user = await getCurrentUser()
  // if (user) {
  //   redirect("/dashboard")
  // }

  return <LoginForm />
} 