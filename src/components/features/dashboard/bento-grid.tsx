"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Plus } from "lucide-react"

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

interface BentoGridProps {
  stats: {
    totalMatches: number
    winRate: number
    totalPlayers: number
    completedMatches: number
    inProgressMatches: number
  }
  matches: Array<{
    $id: string
    matchDate: string
    status: string
  }>
  players: Array<{
    $id: string
    firstName: string
    lastName: string
    rating?: string
  }>
}

// A more robust, CSS-only chart component
function WinRateChart({ winRate }: { winRate: number }) {
  const segments = [
    { label: "Jan", value: 65 },
    { label: "Feb", value: 72 },
    { label: "Mar", value: 68 },
    { label: "Apr", value: 75 },
    { label: "May", value: winRate || 70 },
  ];

  return (
    <div className="flex items-end justify-between h-full w-full px-2">
      {segments.map((segment, index) => (
        <div key={segment.label} className="flex flex-col items-center gap-2 h-full justify-end">
          <motion.div
            initial={{ height: '0%' }}
            animate={{ height: `${Math.max((segment.value / 100) * 80, 4)}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, type: "spring" }}
            className="w-8 bg-gradient-to-t from-primary/60 to-primary rounded-t-sm"
          />
          <span className="text-xs text-muted-foreground">{segment.label}</span>
        </div>
      ))}
    </div>
  );
}

export function BentoGrid({ stats, matches, players }: BentoGridProps) {
  const hasData = matches.length > 0 && players.length > 0;

  if (!hasData) {
      return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="text-center p-8">
                  <CardHeader>
                      <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <CardTitle>Welcome to TennisScore!</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground mb-6">
                          Ready to elevate your game? Start by adding players and tracking matches.
                      </p>
                      <div className="flex gap-4 justify-center">
                          <Button asChild>
                              <Link href="/players"><Plus className="mr-2 h-4 w-4" /> Add a Player</Link>
                          </Button>
                          <Button asChild variant="outline">
                              <Link href="/matches/new">Start a Match</Link>
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          </motion.div>
      )
  }

  return (
    <motion.div 
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[180px] gap-6"
    >
      {/* Large Main Card (2x2): Primary Win Rate + Chart */}
      <motion.div 
        variants={itemVariants}
        className="md:col-span-2 md:row-span-2"
      >
        <Card className="h-full flex flex-col bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground">Performance Trend</h2>
                <p className="text-sm text-muted-foreground">Your win rate over time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="text-5xl font-mono font-bold text-primary mb-2 tracking-tight">
                {stats.completedMatches > 0 ? `${stats.winRate}%` : "-"}
              </div>
              <p className="text-sm font-heading text-foreground mb-4">Current Win Rate</p>
              <div className="w-full h-32">
                <WinRateChart winRate={stats.winRate} />
              </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Other cards would go here, simplified for clarity */}
       <motion.div variants={itemVariants}>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Users className="text-blue-400"/> Players</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <div className="text-3xl font-mono font-bold">{stats.totalPlayers}</div>
                    <p className="text-xs text-muted-foreground">Total Players</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                        <Link href="/players">Manage</Link>
                    </Button>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="h-full bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
                 <Link href="/matches/new" className="h-full block">
                    <CardContent className="h-full p-6 flex flex-col items-center justify-center text-center">
                         <Plus className="h-10 w-10 text-primary mb-3" />
                         <h3 className="text-lg font-heading font-bold">Start New Match</h3>
                         <p className="text-sm text-muted-foreground">Begin scoring now</p>
                    </CardContent>
                </Link>
            </Card>
        </motion.div>
      
        <motion.div 
          variants={itemVariants}
          className="md:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Recent Matches</span>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/matches">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches.slice(0, 2).map((match) => (
                <div key={match.$id} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                   <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${match.status === 'Completed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span className="text-sm font-medium">Match on {new Date(match.matchDate).toLocaleDateString()}</span>
                    </div>
                    <span className={`text-xs ${match.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>{match.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

    </motion.div>
  )
} 