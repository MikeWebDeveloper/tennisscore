"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function MainPlayerSetupPrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Star className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl text-slate-200">
            Welcome to TennisScore! 🎾
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-slate-300">
              To get started with your personalized dashboard, you'll need to select your main player.
            </p>
            <p className="text-sm text-slate-400">
              This helps us show you relevant statistics and match data.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="min-w-[140px]">
              <Link href="/players">
                <Users className="h-4 w-4 mr-2" />
                Manage Players
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          
          <div className="text-xs text-slate-500 space-y-1">
            <p>💡 You can create players for yourself, opponents, or students</p>
            <p>⭐ Set one as your "main player" to see personalized stats</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 