"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, ArrowRight, Star } from "lucide-react"
import Link from "next/link"

export function StatisticsSetupPrompt() {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-slate-200">
            Statistics Need a Main Player
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-800 dark:text-slate-300">
              To view personalized statistics and track your performance, you need to set yourself as the main player.
            </p>
            <p className="text-sm text-gray-700 dark:text-slate-400">
              Please go to the Players page to select your main player.
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
          
          <div className="text-xs text-gray-600 dark:text-slate-500 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Star className="h-3 w-3 text-amber-500" />
              <span>Your main player will show personalized statistics</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}