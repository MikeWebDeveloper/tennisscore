"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Zap, 
  Bug, 
  ArrowRight,
  Calendar,
  GitCommit
} from "lucide-react"
import Link from "next/link"

interface ChangelogItem {
  version: string
  date: string
  type: "feature" | "improvement" | "bugfix"
  title: string
  description: string
}

const recentChanges: ChangelogItem[] = [
  {
    version: "2.1.0",
    date: "2025-01-22",
    type: "feature",
    title: "Performance Optimizations",
    description: "Significantly improved dashboard load times with smart caching and data pagination"
  },
  {
    version: "2.0.5",
    date: "2025-01-20", 
    type: "improvement",
    title: "Enhanced Statistics",
    description: "New detailed analytics page with comprehensive match insights and opponent analysis"
  },
  {
    version: "2.0.4",
    date: "2025-01-18",
    type: "feature", 
    title: "PWA Install Prompts",
    description: "Added native app installation prompts for better mobile experience"
  },
  {
    version: "2.0.3",
    date: "2025-01-15",
    type: "bugfix",
    title: "Match Scoring Fixes",
    description: "Resolved issues with tiebreak scoring and match completion detection"
  },
  {
    version: "2.0.2",
    date: "2025-01-12",
    type: "improvement",
    title: "Czech Translation Updates",
    description: "Improved Czech translations and fixed duplicate property issues"
  }
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "feature": return <Sparkles className="h-4 w-4 text-green-500" />
    case "improvement": return <Zap className="h-4 w-4 text-blue-500" />
    case "bugfix": return <Bug className="h-4 w-4 text-orange-500" />
    default: return <GitCommit className="h-4 w-4 text-gray-500" />
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "feature": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">New</Badge>
    case "improvement": return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Improved</Badge>
    case "bugfix": return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Fixed</Badge>
    default: return <Badge variant="outline">Update</Badge>
  }
}

export function Changelog() {
  // Show only the latest 3 changes on dashboard
  const displayChanges = recentChanges.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">What&apos;s New</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              v{recentChanges[0]?.version}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayChanges.map((change, index) => (
            <motion.div
              key={change.version}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0 dark:border-gray-700"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(change.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{change.title}</h4>
                  {getTypeBadge(change.type)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {change.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(change.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{change.version}</span>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* View Full Changelog Button */}
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="w-full text-sm" asChild>
              <Link href="/changelog" className="flex items-center gap-2">
                View Full Changelog
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}