import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "TennisScore - Tennis Scoring & Statistics",
  description: "Professional tennis scoring and statistics tracking for players and coaches",
  keywords: ["tennis", "scoring", "analytics", "statistics", "match tracking", "tennis app"],
  authors: [{ name: "TennisScore Team" }],
  creator: "TennisScore",
  publisher: "TennisScore",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://tenscr.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TennisScore",
    startupImage: [
      "/icons/icon-512x512.png"
    ]
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tenscr.app",
    title: "TennisScore - Professional Tennis Scoring & Analytics",
    description: "The ultimate digital companion for tennis players. Track scores, analyze performance, and share matches in real-time.",
    siteName: "TennisScore",
  },
  twitter: {
    card: "summary_large_image",
    title: "TennisScore - Professional Tennis Scoring & Analytics",
    description: "The ultimate digital companion for tennis players. Track scores, analyze performance, and share matches in real-time.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-center"
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
