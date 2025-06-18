"use client"

import { motion } from "framer-motion"
import { Player, MatchStats as MatchStatsType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { BarChart, Target, Zap, TrendingUp, Activity } from "lucide-react"

interface MatchStatsProps {
  stats: MatchStatsType
  playerOne: Player
  playerTwo: Player
}

const StatRow = ({
  label,
  p1Value,
  p2Value,
  p1Total,
  p2Total,
  isPercentage = false,
  delay = 0,
}: {
  label: string
  p1Value: number
  p2Value: number
  p1Total?: number
  p2Total?: number
  isPercentage?: boolean
  delay?: number
}) => {
  const total = p1Value + p2Value
  const p1Percentage = total > 0 ? (p1Value / total) * 100 : 0
  const p2Percentage = total > 0 ? (p2Value / total) * 100 : 0

  const p1Display = isPercentage ? `${p1Value.toFixed(0)}%` : p1Value
  const p2Display = isPercentage ? `${p2Value.toFixed(0)}%` : p2Value
  
  const p1Subtext = isPercentage && p1Total ? `(${p1Value.toFixed(0)}/${p1Total})` : null
  const p2Subtext = isPercentage && p2Total ? `(${p2Value.toFixed(0)}/${p2Total})` : null

  return (
    <motion.div
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-3"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
    >
      {/* Player 1 Stat */}
      <div className="text-right">
        <div className="font-bold text-lg font-mono">{p1Display}</div>
        {p1Subtext && <div className="text-xs text-muted-foreground">{p1Subtext}</div>}
      </div>

      {/* Center Bar */}
      <div className="w-24 sm:w-48 text-center">
        <div className="text-xs sm:text-sm text-muted-foreground mb-1.5 truncate">{label}</div>
        <div className="flex items-center bg-muted h-2 rounded-full">
          <motion.div
            className="bg-primary h-full rounded-l-full"
            initial={{ width: 0 }}
            animate={{ width: `${p1Percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: delay * 0.08 + 0.2 }}
          />
          <motion.div
            className="bg-red-500 h-full rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${p2Percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: delay * 0.08 + 0.2 }}
          />
        </div>
      </div>

      {/* Player 2 Stat */}
      <div className="text-left">
        <div className="font-bold text-lg font-mono">{p2Display}</div>
        {p2Subtext && <div className="text-xs text-muted-foreground">{p2Subtext}</div>}
      </div>
    </motion.div>
  )
}

const StatCategory = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
  <div className="bg-muted/30 rounded-lg">
    <div className="p-4 border-b">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h3>
    </div>
    <div className="p-2 sm:p-4 divide-y">{children}</div>
  </div>
)

export function MatchStatsComponent({ stats, playerOne, playerTwo }: MatchStatsProps) {
  const p1 = stats.player1
  const p2 = stats.player2

  return (
    <div className="p-2 sm:p-4 font-sans space-y-6">
      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <BarChart className="w-6 h-6" />
          Match Statistics
        </h2>
        <div className="flex justify-center items-baseline gap-4 mt-2">
          <span className={cn("font-semibold", p1.totalPointsWon > p2.totalPointsWon && "text-primary")}>
            {playerOne.firstName}
          </span>
          <span className="text-sm text-muted-foreground">vs</span>
          <span className={cn("font-semibold", p2.totalPointsWon > p1.totalPointsWon && "text-red-500")}>
            {playerTwo.firstName}
          </span>
        </div>
      </div>

      <StatCategory icon={TrendingUp} title="Points">
        <StatRow label="Total Points Won" p1Value={p1.totalPointsWon} p2Value={p2.totalPointsWon} delay={0} />
        <StatRow label="Winners" p1Value={p1.winners} p2Value={p2.winners} delay={1} />
        <StatRow label="Unforced Errors" p1Value={p1.unforcedErrors} p2Value={p2.unforcedErrors} delay={2} />
      </StatCategory>
      
      <StatCategory icon={Target} title="Service">
        <StatRow label="Aces" p1Value={p1.aces} p2Value={p2.aces} delay={3} />
        <StatRow label="Double Faults" p1Value={p1.doubleFaults} p2Value={p2.doubleFaults} delay={4} />
        <StatRow label="1st Serve %" p1Value={p1.firstServePercentage} p2Value={p2.firstServePercentage} p1Total={p1.firstServesAttempted} p2Total={p2.firstServesAttempted} isPercentage delay={5} />
        <StatRow label="1st Serve Won %" p1Value={p1.firstServeWinPercentage} p2Value={p2.firstServeWinPercentage} p1Total={p1.firstServePointsPlayed} p2Total={p2.firstServePointsPlayed} isPercentage delay={6} />
        <StatRow label="2nd Serve Won %" p1Value={p1.secondServeWinPercentage} p2Value={p2.secondServeWinPercentage} p1Total={p1.secondServePointsPlayed} p2Total={p2.secondServePointsPlayed} isPercentage delay={7} />
      </StatCategory>

      <StatCategory icon={Zap} title="Return">
        <StatRow label="Total Return Pts Won %" p1Value={p1.totalReturnWinPercentage} p2Value={p2.totalReturnWinPercentage} p1Total={p1.totalReturnPointsPlayed} p2Total={p2.totalReturnPointsPlayed} isPercentage delay={8} />
        <StatRow label="1st Srv Return Won %" p1Value={p1.firstReturnWinPercentage} p2Value={p2.firstReturnWinPercentage} p1Total={p1.firstReturnPointsPlayed} p2Total={p2.firstReturnPointsPlayed} isPercentage delay={9} />
        <StatRow label="2nd Srv Return Won %" p1Value={p1.secondReturnWinPercentage} p2Value={p2.secondReturnWinPercentage} p1Total={p1.secondReturnPointsPlayed} p2Total={p2.secondReturnPointsPlayed} isPercentage delay={10} />
      </StatCategory>
      
      <StatCategory icon={Activity} title="Breaks">
        <StatRow label="Break Pts Converted" p1Value={p1.breakPointConversionPercentage} p2Value={p2.breakPointConversionPercentage} p1Total={p1.breakPointsPlayed} p2Total={p2.breakPointsPlayed} isPercentage delay={11} />
        <StatRow label="Break Pts Saved" p1Value={p1.breakPointSavePercentage} p2Value={p2.breakPointSavePercentage} p1Total={p1.breakPointsFaced} p2Total={p2.breakPointsFaced} isPercentage delay={12} />
      </StatCategory>
    </div>
  )
} 