import { Inter, JetBrains_Mono } from "next/font/google"
import { notFound } from "next/navigation"
import { getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { routing } from "@/i18n/routing"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { MotionProvider } from "@/components/providers/motion-provider"
import { Toaster } from "@/components/ui/sonner"
import "@/app/globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Get messages for the locale
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <ServiceWorkerProvider>
              <MotionProvider>
                <NextIntlClientProvider messages={messages} locale={locale}>
                  {children}
                </NextIntlClientProvider>
                <Toaster 
                  position="top-center"
                  richColors
                  closeButton
                />
              </MotionProvider>
            </ServiceWorkerProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}