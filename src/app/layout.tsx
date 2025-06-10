import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TennisScore - Professional Tennis Scoring & Analytics",
  description: "The ultimate digital companion for tennis players. Track scores, analyze performance, and share matches in real-time with professional-grade statistical analysis.",
  keywords: ["tennis", "scoring", "analytics", "statistics", "match tracking", "tennis app"],
  authors: [{ name: "TennisScore Team" }],
  creator: "TennisScore",
  publisher: "TennisScore",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL("https://tenscr.app"),
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
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-center"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
