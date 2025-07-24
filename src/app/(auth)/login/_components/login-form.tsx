"use client"

import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInAction } from "@/lib/actions/auth"
import { toast } from "sonner"
import { useEffect } from "react"
import { useTranslations } from "@/hooks/use-translations"

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations()
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? t('signingIn') : t('signIn')}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, undefined)
  const t = useTranslations()

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" suppressHydrationWarning>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-bold text-foreground mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {t('tennisScore')}
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {t('yourDigitalTennisCompanion')}
          </motion.p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('welcomeBackAuth')}</CardTitle>
            <CardDescription>
              {t('signInToYourAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('enterYourEmail')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('enterYourPassword')}
                  required
                />
              </div>

              <SubmitButton />
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('dontHaveAccount')}{" "}
                <Link
                  href="/signup"
                  className="font-medium text-primary hover:underline"
                >
                  {t('signUp')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 