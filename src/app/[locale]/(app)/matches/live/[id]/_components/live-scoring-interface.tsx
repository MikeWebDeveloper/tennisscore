"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from '@/lib/framer-motion-config'
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { Undo } from "lucide-react"
import { Trophy } from "lucide-react"
import { Share2 } from "lucide-react"
import { MessageCircle } from "lucide-react"
import { MessageSquare } from "lucide-react"
import { Copy } from "lucide-react"
import { Mail } from "lucide-react"
import { Settings } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { syncMatchScore, buildScorePayload } from "@/lib/utils/sync-match-score"
import { matchEndTime, type EndReason } from "@/lib/utils/end-reasons"
import { parseDbScore, serveIndicator } from "@/lib/utils/db-score"
import { setCurrentServe } from "@/lib/actions/match-serve"
import { setMatchPaused } from "@/lib/actions/match-pause"
import { PAUSE_REASONS, isPauseReason, type PauseReason } from '@/lib/utils/pause-reasons'
import { normalizeMatchFormat } from "@/lib/utils/match-format"
import { useStoreHydrated } from "@/hooks/use-store-hydrated"
import { useSyncStatus } from "@/hooks/use-sync-status"
import { SyncStatusBadge } from "@/components/shared/sync-status-badge"
import { Player, PointDetail as LibPointDetail } from "@/lib/types"
import { formatPlayerRating } from "@/components/shared/player-rating-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PointByPointView } from "../../../[id]/_components/point-by-point-view"
import { UltraSimplePointLogger } from "./ultra-simple-point-logger"
import { DynamicPointLogger } from "./dynamic-point-logger"
import { SimpleStatsPopup, SimplePointOutcome } from "./simple-stats-popup"
import { LiveScoreboard as SharedLiveScoreboard } from "@/components/shared/live-scoreboard"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLocale, useTranslations } from "@/i18n"
import { cn, formatPlayerFromObject } from "@/lib/utils"

import { MatchStatsComponentSimpleFixed } from "@/app/[locale]/(app)/matches/[id]/_components/match-stats"
import { calculateMatchStatsByLevel } from "@/lib/utils/match-stats"
import { useMatchStore, PointDetail as StorePointDetail, Score } from "@/stores/matchStore"
import { useShallow } from "zustand/react/shallow"
import { useWakeLock } from "@/hooks/use-wake-lock"
import { useDoublesServingPlayer } from "@/hooks/use-doubles-serving-player"
import { startsNewServeTurn, TEAM_PARTNERS, type DoublesPlayer } from "@/lib/utils/doubles-serving"
import { isBreakPoint } from "@/lib/utils/tennis-scoring"
import { PlayerAvatar } from "@/components/shared/player-avatar"
import { MatchTimerDisplay } from "./MatchTimerDisplay"
import { FlameIcon } from "@/components/ui/flame-icon"
import { MomentumBar } from "@/components/ui/momentum-bar"
import { playSound } from "@/lib/sounds"
import { MatchSettingsDialog } from "./match-settings-dialog"
import { CustomModeDialog } from "@/components/features/custom-mode-dialog"
import { LiveInsights } from "@/components/features/match-insights/live-insights"
import { PdfExportButton } from "@/components/features/match-insights/pdf-export-button"
import { focusSide, shortSideNames } from "@/components/features/match-insights/labels"
import { buildMatchInsights } from "@/lib/utils/match-insights"

// Confetti celebration function — canvas-confetti is loaded on demand so it
// stays out of the initial live-scoring bundle (only fires on a match win).
const triggerMatchWinConfetti = async () => {
  const { default: confetti } = await import("canvas-confetti")

  // Main burst from the center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  })

  // Side bursts for more dramatic effect
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    })
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    })
  }, 250)

  // Final burst with gold colors
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#39FF14']
    })
  }, 500)
}

interface LiveScoringInterfaceProps {
  match: {
    $id: string
    playerOne: Player
    playerTwo: Player
    playerThree?: Player
    playerFour?: Player
    matchFormat: string
    detailLevel?: "points" | "simple" | "shot-type" | "complex" | "detailed" | "custom"
    score: string
    pointLog?: string[]
    status: string
    isPaused?: boolean
    pauseReason?: string
    startTime?: string
    endTime?: string
    setDurations?: number[]
    tournamentName?: string
  }
}

// Share Dialog Component
function ShareDialog({ open, onOpenChange, matchId, playerNames }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
  playerNames: { p1: string; p2: string }
}) {
  const t = useTranslations('match')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${matchId}` : ''
  const shareText = `🎾 ${t('liveTennisMatch')}: ${playerNames.p1} ${t('vs')} ${playerNames.p2}`
  const fullMessage = `${shareText}\n${shareUrl}`

  const shareOptions = [
    {
      name: t('copyLink'),
      icon: Copy,
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl)
          toast.success(t('linkCopiedToClipboard'))
          onOpenChange(false)
        } catch {
          toast.error(t('failedToCopyLink'))
        }
      },
      color: "bg-gray-900 dark:bg-gray-700"
    },
    {
      name: t('whatsApp'),
      icon: MessageSquare,
      action: () => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)
        const whatsappUrl = isMobile
          ? `whatsapp://send?text=${encodeURIComponent(fullMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(fullMessage)}`
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        onOpenChange(false)
      },
      color: "bg-green-500"
    },
    {
      name: t('sms'),
      icon: Mail,
      action: () => {
        // SMS works differently on iOS vs Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        const smsUrl = isIOS
          ? `sms:&body=${encodeURIComponent(fullMessage)}`
          : `sms:?body=${encodeURIComponent(fullMessage)}`
        window.location.href = smsUrl
        onOpenChange(false)
      },
      color: "bg-blue-500"
    },
    {
      name: t('facebook'),
      icon: MessageCircle,
      action: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        window.open(fbUrl, '_blank', 'noopener,noreferrer')
        onOpenChange(false)
      },
      color: "bg-blue-600"
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('shareLiveMatch')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-foreground bg-muted dark:bg-gray-800 dark:text-gray-300 text-center p-3 rounded-lg break-all">
            {shareUrl}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={`h-16 flex flex-col gap-1 text-white border-0 hover:opacity-90 ${option.color}`}
                onClick={option.action}
              >
                <option.icon className="h-5 w-5" />
                <span className="text-xs">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Use shared scoreboard component
const LiveScoreboard = SharedLiveScoreboard

// Point Entry Component
function PointEntry({
  onPointWin,
  score,
  isTiebreak,
  pointSituation,
  playerNames,
  players,
  p1Streak,
  p2Streak,
}: {
  onPointWin: (winner: "p1" | "p2") => void,
  score: Score,
  isTiebreak: boolean,
  pointSituation: { type: 'matchPoint' | 'setPoint' | 'breakPoint'; player: 'p1' | 'p2' | null; badge: string; color: string; textColor: string; borderColor: string; bgColor: string } | null,
  playerNames: { p1: string, p2: string },
  players: { p1: Player; p2: Player },
  p1Streak: number,
  p2Streak: number,
}) {
  const t = useTranslations('match')
  const getPointDisplay = (playerIndex: number) => {
    if (isTiebreak) {
      return score.tiebreakPoints?.[playerIndex] || 0
    }

    const p1 = score.points[0]
    const p2 = score.points[1]

    if (p1 >= 3 && p2 >= 3) {
      if (p1 === p2) return "40"
      if (p1 > p2 && playerIndex === 0) return "AD"
      if (p2 > p1 && playerIndex === 1) return "AD"
    }

    const pointMap = ["0", "15", "30", "40"]
    return pointMap[score.points[playerIndex]] || "40"
  }

  const getPlayerDisplayName = (playerKey: 'p1' | 'p2') => {
    const fullName = playerNames[playerKey]
    return fullName.split(' ')[0] // First name only for buttons
  }

  const getSituationText = () => {
    if (!pointSituation) return null

    const playerName = getPlayerDisplayName(pointSituation.player as 'p1' | 'p2')

    switch (pointSituation.type) {
      case 'matchPoint':
        return t('hasMatchPoint', { player: playerName })
      case 'setPoint':
        return t('hasSetPoint', { player: playerName })
      case 'breakPoint':
        return t('hasBreakPoint', { player: playerName })
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Player buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          data-testid="score-point"
          onClick={() => onPointWin("p1")}
          className={cn(
            "h-32 sm:h-40 bg-card border rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            pointSituation && pointSituation.player === 'p1' && pointSituation.borderColor,
            pointSituation && pointSituation.player === 'p1' && pointSituation.bgColor
          )}
          whileTap={{ scale: 0.98 }}
        >
          {/* Critical point indicator */}
          {pointSituation && pointSituation.player === 'p1' && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className={cn("text-xs text-white", pointSituation.color)}>
                {pointSituation.badge}
              </Badge>
            </div>
          )}

          {/* Player info */}
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar player={players.p1} className="h-12 w-12" />
            <div className="text-xs font-medium text-muted-foreground text-center px-2 flex items-center gap-1">
              {getPlayerDisplayName('p1')}
              {p1Streak >= 5 && (
                <FlameIcon size={14} streak={p1Streak} className="ml-1" />
              )}
            </div>
          </div>

          {/* Score display */}
          <span className={cn(
            "text-4xl sm:text-6xl font-black font-mono text-center",
            pointSituation && pointSituation.player === 'p1'
              ? pointSituation.textColor
              : "text-card-foreground"
          )}>
            {getPointDisplay(0)}
          </span>
        </motion.button>

        <motion.button
          type="button"
          data-testid="score-point"
          onClick={() => onPointWin("p2")}
          className={cn(
            "h-32 sm:h-40 bg-card border rounded-lg flex flex-col items-center justify-center cursor-pointer shadow-sm hover:bg-muted transition-colors relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            pointSituation && pointSituation.player === 'p2' && pointSituation.borderColor,
            pointSituation && pointSituation.player === 'p2' && pointSituation.bgColor
          )}
          whileTap={{ scale: 0.98 }}
        >
          {/* Critical point indicator */}
          {pointSituation && pointSituation.player === 'p2' && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className={cn("text-xs text-white", pointSituation.color)}>
                {pointSituation.badge}
              </Badge>
            </div>
          )}

          {/* Player info */}
          <div className="flex flex-col items-center gap-2">
            <PlayerAvatar player={players.p2} className="h-12 w-12" />
            <div className="text-xs font-medium text-muted-foreground text-center px-2 flex items-center gap-1">
              {getPlayerDisplayName('p2')}
              {p2Streak >= 5 && (
                <FlameIcon size={14} streak={p2Streak} className="ml-1" />
              )}
            </div>
          </div>

          {/* Score display */}
          <span className={cn(
            "text-4xl sm:text-6xl font-black font-mono text-center",
            pointSituation && pointSituation.player === 'p2'
              ? pointSituation.textColor
              : "text-card-foreground"
          )}>
            {getPointDisplay(1)}
          </span>
        </motion.button>
      </div>
      {/* Reserve space so point and undo controls do not jump on a critical point. */}
      <div className="flex min-h-12 items-center justify-center">
      {pointSituation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg border",
            pointSituation.bgColor,
            pointSituation.borderColor
          )}>
            <Badge variant="destructive" className={cn("text-white hover:opacity-90", pointSituation.color)}>
              {pointSituation.badge}
            </Badge>
            <span className={cn("text-sm font-medium", pointSituation.textColor)}>
              {getSituationText()}
            </span>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  )
}

export function LiveScoringInterface({ match }: LiveScoringInterfaceProps) {
  const router = useRouter()
  const t = useTranslations('match')
  const tCommon = useTranslations('common')
  const [isPaused, setIsPaused] = useState(Boolean(match.isPaused))
  const [pausePending, setPausePending] = useState(false)
  const [pauseReason, setPauseReason] = useState<PauseReason | undefined>(isPauseReason(match.pauseReason) ? match.pauseReason : undefined)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  
  // Use match store with a shallow selector so this component only re-renders
  // when the fields it actually uses change (not on every unrelated store write).
  const {
    score,
    pointLog,
    currentServer,
    p1Streak,
    p2Streak,
    initializeMatch,
    awardPoint,
    undoLastPoint,
    setServer
  } = useMatchStore(useShallow((state) => ({
    score: state.score,
    pointLog: state.pointLog,
    currentServer: state.currentServer,
    p1Streak: state.p1Streak,
    p2Streak: state.p2Streak,
    initializeMatch: state.initializeMatch,
    awardPoint: state.awardPoint,
    undoLastPoint: state.undoLastPoint,
    setServer: state.setServer,
  })))
  useWakeLock(match.status === "In Progress" && !isPaused)
  const isDoublesMatch = !!(match.playerThree && match.playerFour)
  // The persisted match loads asynchronously; initializing before it would overwrite unsent local points
  const storeHydrated = useStoreHydrated(useMatchStore.persist)
  const doublesOrder = useMemo(() => normalizeMatchFormat(match.matchFormat).doublesServeOrder, [match.matchFormat])
  const suggestedServer = useDoublesServingPlayer(isDoublesMatch, pointLog, score, currentServer, doublesOrder)
  // The scorer may pick which partner serves at the start of a service turn (first game, new set, corrections)
  const [serverOverride, setServerOverride] = useState<DoublesPlayer | null>(null)
  const canPickServer = isDoublesMatch && !!currentServer && startsNewServeTurn(score)
  const servingPlayer =
    canPickServer && serverOverride && TEAM_PARTNERS[currentServer!].includes(serverOverride)
      ? serverOverride
      : suggestedServer

  // Saved / saving / unsent indicator; unsent points are retried automatically when back online
  const { state: syncState, run: runSync } = useSyncStatus(() =>
    syncMatchScore(match.$id, buildScorePayload(useMatchStore.getState()))
  )

  // Local state for UI
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showPointDetail, setShowPointDetail] = useState(false)
  const [showSimpleStats, setShowSimpleStats] = useState(false)
  const [showRetireDialog, setShowRetireDialog] = useState(false)
  const [retireReason, setRetireReason] = useState<'completed' | EndReason | ''>('')
  const [selectedWinner, setSelectedWinner] = useState<'p1' | 'p2' | ''>('')
  const [pendingPointWinner, setPendingPointWinner] = useState<'p1' | 'p2' | null>(null)
  // Which serve the server is on; starts from what spectators were last shown (e.g. after a reload)
  const [serveType, setServeType] = useState<'first' | 'second'>(() => match.status === 'In Progress' ? serveIndicator(match.score) : 'first')
  const serveSync = useRef<ReturnType<typeof setTimeout> | null>(null)
  // A pending serve save must not fire after leaving the page
  useEffect(() => () => { if (serveSync.current) clearTimeout(serveSync.current) }, [])
  const [isInGame, setIsInGame] = useState(false)
  const [isMatchInitialized, setIsMatchInitialized] = useState(false)
  const [startTime, setStartTime] = useState<string | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showCustomModeDialog, setShowCustomModeDialog] = useState(false)

  const playerNames = {
    p1: formatPlayerFromObject(match.playerOne),
    p2: formatPlayerFromObject(match.playerTwo),
    p3: match.playerThree ? formatPlayerFromObject(match.playerThree) : undefined,
    p4: match.playerFour ? formatPlayerFromObject(match.playerFour) : undefined,
  }

  const players = {
    p1: match.playerOne,
    p2: match.playerTwo,
  }

  // Convert store point details to lib point details for stats calculation
  const convertedPointLog: LibPointDetail[] = pointLog.map(point => ({
    ...point,
    lastShotType: point.lastShotType === 'other' ? 'serve' : (point.lastShotType as LibPointDetail['lastShotType']),
    serveType: point.serveType || 'first',
    rallyLength: point.rallyLength || 1,
    serveOutcome: point.serveOutcome || point.pointOutcome,
    // Preserve the original pointOutcome
    pointOutcome: point.pointOutcome || 'winner'
  }))

  // Parse match format (keeps set length / tiebreak point so Fast4 and pro set score correctly)
  const parsedMatchFormat = useMemo(() => normalizeMatchFormat(match.matchFormat), [match.matchFormat])

  // Get detailLevel directly from match object (not from parsed format)
  const detailLevel = match.detailLevel || "simple"

  // Live insights (run, key moment, set games, set chart) follow the point log, so an undo corrects them too
  const liveInsights = useMemo(
    () => buildMatchInsights(pointLog, { format: parsedMatchFormat, detailLevel }),
    [pointLog, parsedMatchFormat, detailLevel]
  )
  const sidePlayers = { p1: match.playerOne, p2: match.playerTwo, p3: match.playerThree, p4: match.playerFour }
  const sideFullNames = {
    p1: playerNames.p3 ? `${playerNames.p1} / ${playerNames.p3}` : playerNames.p1,
    p2: playerNames.p4 ? `${playerNames.p2} / ${playerNames.p4}` : playerNames.p2,
  }
  const liveShortNames = shortSideNames(sidePlayers, sideFullNames)
  const locale = useLocale()
  const liveReport = () => {
    const meta = (people: (Player | undefined)[]) => people
      .filter((person): person is Player => Boolean(person))
      .map(person => [person.yearOfBirth, formatPlayerRating(person), person.club].filter(Boolean).join(" · "))
      .filter(Boolean)
      .join(" / ")
    return {
      insights: liveInsights,
      fullNames: sideFullNames,
      shortNames: liveShortNames,
      metaLines: { p1: meta([match.playerOne, match.playerThree]), p2: meta([match.playerTwo, match.playerFour]) },
      focus: focusSide(sidePlayers, liveInsights.leader),
      scoreboard: {
        sets: score.sets,
        current: match.status !== "Completed" ? score.games : undefined,
      },
      completed: match.status === "Completed",
      dateLabel: new Date(match.startTime || Date.now()).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Prague" }),
      tournamentName: match.tournamentName,
    }
  }
  const isTiebreak = score.isTiebreak || false

  // Calculate current breakpoint status
  const getBreakPointStatus = () => {
    if (!currentServer || isTiebreak) return { isBreakPoint: false, facingBreakPoint: null }
    const serverPoints = currentServer === 'p1' ? score.points[0] : score.points[1]
    const returnerPoints = currentServer === 'p1' ? score.points[1] : score.points[0]
    // Block BP at 40:40 in standard scoring
    if (!parsedMatchFormat.noAd && serverPoints === 3 && returnerPoints === 3) {
      return { isBreakPoint: false, facingBreakPoint: null }
    }
    const isCurrentlyBreakPoint = isBreakPoint(serverPoints, returnerPoints, parsedMatchFormat.noAd)
    const returner: 'p1' | 'p2' = currentServer === 'p1' ? 'p2' : 'p1'
    return {
      isBreakPoint: isCurrentlyBreakPoint,
      facingBreakPoint: isCurrentlyBreakPoint ? returner : null
    }
  }
  // Calculate current set point and match point status
  const getSetAndMatchPointStatus = () => {
    let isSetPoint = false
    let facingSetPoint: 'p1' | 'p2' | null = null
    // Restore missing variables
    const setsNeededToWin = Math.ceil(parsedMatchFormat.sets / 2)
    const currentP1SetsWon = score.sets.filter((s: [number, number]) => s[0] > s[1]).length
    const currentP2SetsWon = score.sets.filter((s: [number, number]) => s[1] > s[0]).length
    const currentGames = score.games as [number, number]
    const p1CouldWinSetNextGame = currentGames[0] + 1 >= 6 && (currentGames[0] + 1 - currentGames[1] >= 2 || (currentGames[0] + 1 === 7 && currentGames[1] === 6))
    const p2CouldWinSetNextGame = currentGames[1] + 1 >= 6 && (currentGames[1] + 1 - currentGames[0] >= 2 || (currentGames[1] + 1 === 7 && currentGames[0] === 6))

    if (isTiebreak) {
      // In tiebreak, check if either player is close to winning
      const p1TbPoints = score.tiebreakPoints?.[0] || 0
      const p2TbPoints = score.tiebreakPoints?.[1] || 0
      // Determine tiebreak target based on whether it's a deciding set and format
      const isDecidingSet = currentP1SetsWon === setsNeededToWin - 1 && currentP2SetsWon === setsNeededToWin - 1
      const tiebreakTarget = (isDecidingSet && parsedMatchFormat.finalSetTiebreak === "super") ?
        (parsedMatchFormat.finalSetTiebreakAt || 10) : 7

      if ((p1TbPoints >= tiebreakTarget - 1 && p1TbPoints >= p2TbPoints) && p1CouldWinSetNextGame) {
        isSetPoint = true
        facingSetPoint = 'p1'
      } else if ((p2TbPoints >= tiebreakTarget - 1 && p2TbPoints >= p1TbPoints) && p2CouldWinSetNextGame) {
        isSetPoint = true
        facingSetPoint = 'p2'
      }
    } else {
      const [p1Score, p2Score] = score.points as [number, number]
      // Block SP/MP at 40:40 in standard scoring
      if (!parsedMatchFormat.noAd && p1Score === 3 && p2Score === 3) {
        return {
          isSetPoint: false,
          isMatchPoint: false,
          facingSetPoint: null,
          facingMatchPoint: null
        }
      }
      // Check if either player is at game point AND could win the set
      const p1AtGamePoint = (p1Score >= 3 && (p1Score > p2Score || (p1Score === 3 && p2Score < 3)))
      const p2AtGamePoint = (p2Score >= 3 && (p2Score > p1Score || (p2Score === 3 && p1Score < 3)))

      // Deuce set point: At deuce, if either player could win the set
      const isDeuceSetPoint = (p1Score === 3 && p2Score === 3)

      if ((p1AtGamePoint && p1CouldWinSetNextGame) || (isDeuceSetPoint && p1CouldWinSetNextGame)) {
        isSetPoint = true
        facingSetPoint = 'p1'
      } else if ((p2AtGamePoint && p2CouldWinSetNextGame) || (isDeuceSetPoint && p2CouldWinSetNextGame)) {
        isSetPoint = true
        facingSetPoint = 'p2'
      }
    }

    // Check for match point
    let isMatchPoint = false
    let facingMatchPoint: 'p1' | 'p2' | null = null

    if (isSetPoint && facingSetPoint) {
      // If this is a set point, check if winning this set would win the match
      const newP1Sets = currentP1SetsWon + (facingSetPoint === 'p1' ? 1 : 0)
      const newP2Sets = currentP2SetsWon + (facingSetPoint === 'p2' ? 1 : 0)

      if (newP1Sets >= setsNeededToWin || newP2Sets >= setsNeededToWin) {
        isMatchPoint = true
        facingMatchPoint = facingSetPoint
      }
    }

    return {
      isSetPoint,
      isMatchPoint,
      facingSetPoint,
      facingMatchPoint
    }
  }

  const breakPointStatus = getBreakPointStatus()
  const setMatchPointStatus = getSetAndMatchPointStatus()

  // Determine the highest priority situation for display
  const getPointSituation = () => {
    if (setMatchPointStatus.isMatchPoint) {
      return {
        type: 'matchPoint' as const,
        player: setMatchPointStatus.facingMatchPoint,
        badge: 'MP',
        color: 'bg-red-600',
        textColor: 'text-red-600 dark:text-red-400',
        borderColor: 'border-red-300 dark:border-red-700',
        bgColor: 'bg-red-50/50 dark:bg-red-950/10'
      }
    } else if (setMatchPointStatus.isSetPoint) {
      return {
        type: 'setPoint' as const,
        player: setMatchPointStatus.facingSetPoint,
        badge: 'SP',
        color: 'bg-blue-500',
        textColor: 'text-blue-600 dark:text-blue-400',
        borderColor: 'border-blue-300 dark:border-blue-700',
        bgColor: 'bg-blue-50/50 dark:bg-blue-950/10'
      }
    } else if (breakPointStatus.isBreakPoint) {
      return {
        type: 'breakPoint' as const,
        player: breakPointStatus.facingBreakPoint,
        badge: 'BP',
        color: 'bg-orange-500',
        textColor: 'text-orange-600 dark:text-orange-400',
        borderColor: 'border-orange-300 dark:border-orange-700',
        bgColor: 'bg-orange-50/50 dark:bg-orange-950/10'
      }
    }
    return null
  }

  const pointSituation = getPointSituation()



  // Initialize match data
  useEffect(() => {
    if (!match || !match.$id) {
      return
    }

    // Wait for the persisted (possibly unsynced) match to load so it is not overwritten by the server copy
    if (!storeHydrated) return

    const existingPointLog: StorePointDetail[] = match.pointLog
      ? match.pointLog.map(pointStr => {
        try {
          return JSON.parse(pointStr)
        } catch (error) {
          console.error("Failed to parse point:", error)
          return null
        }
      }).filter(Boolean)
      : []

    // Saved scores come in the current array format and an older {player1, player2} one; reading only
    // the old one turned array scores into NaN games ("Hra NaN") when no point had been logged
    const storeScore: Score = parseDbScore(match.score)
    // Older scores also stored who serves first
    const savedServer: 'p1' | 'p2' = (() => {
      try { return JSON.parse(match.score)?.server === 'p2' ? 'p2' : 'p1' } catch { return 'p1' }
    })()

    const matchData = {
      $id: match.$id,
      playerOneId: match.playerOne.$id,
      playerTwoId: match.playerTwo.$id,
      matchDate: new Date().toISOString(),
      matchFormat: parsedMatchFormat,
      status: match.status as 'In Progress' | 'Completed',
      winnerId: match.status === 'Completed' ? undefined : undefined,
      score: storeScore,
      pointLog: existingPointLog,
      events: [],
      userId: match.playerOne.userId || ''
    }

    try {
      initializeMatch(matchData)
      if (detailLevel === 'custom') {
        try {
          const config = JSON.parse(match.matchFormat).customModeConfig
          if (config && Array.isArray(config.categories)) useMatchStore.getState().setCustomMode({ enabled: true, level: Number(config.level) === 3 ? 3 : Number(config.level) === 2 ? 2 : 1, selectedCategories: config.categories })
        } catch { /* Older matches may not have custom settings. */ }
      }

      // Offline recovery: if the persisted store kept local points that never
      // reached the server (reload/disconnect mid-match), push them once now.
      const restored = useMatchStore.getState()
      if (restored.needsResync) {
        runSync(() => syncMatchScore(match.$id, buildScorePayload(restored)))
          .then(() => useMatchStore.getState().clearResync())
          .catch(() => {
            // Leave the flag set; the next synced point will carry these too.
          })
      }

      if (existingPointLog.length === 0) {
        setServer(savedServer)
      }
      setIsInGame(existingPointLog.length > 0)
      setIsMatchInitialized(true)
      setStartTime(match.startTime || null)
    } catch (error) {
      console.error("Failed to initialize match:", error)
    }
  }, [match, parsedMatchFormat, initializeMatch, setServer, storeHydrated, detailLevel, runSync])

  // Show loading state until match is initialized
  if (!isMatchInitialized || !currentServer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('initializingMatch')}</p>
        </div>
      </div>
    )
  }

  const getGameScore = () => {
    if (isTiebreak) {
      const p1 = score.tiebreakPoints?.[0] || 0
      const p2 = score.tiebreakPoints?.[1] || 0
      return `${p1} - ${p2}`
    }

    const p1Points = score.points[0]
    const p2Points = score.points[1]

    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) return t('deuce')
      if (p1Points > p2Points) return t('advantage', { player: playerNames.p1.split(' ')[0].toUpperCase() })
      return t('advantage', { player: playerNames.p2.split(' ')[0].toUpperCase() })
    }

    const pointMap = ["0", "15", "30", "40"]
    const p1Display = pointMap[Math.min(p1Points, 3)]
    const p2Display = pointMap[Math.min(p2Points, 3)]

    return `${p1Display} - ${p2Display}`
  }

  const handlePointWin = async (winner: "p1" | "p2") => {
    if (isPaused || pausePending) return
    if (!currentServer || !score) {
      console.error("Match not properly initialized - missing server or score")
      toast.error(t('matchNotReady'))
      return
    }

    if (match.status === 'Completed') {
      toast.error(t('matchAlreadyComplete'))
      return
    }


    // For "Points Only", create a minimal point object and save it immediately
    if (detailLevel === 'points') {
      console.log('Points only mode - awarding point directly')
      const minimalPointDetail: Partial<StorePointDetail> = {
        serveType: serveType,
        pointOutcome: 'winner',
        rallyLength: 1,
        lastShotType: 'serve',
      }
      await handleAwardPoint(winner, minimalPointDetail)
      return
    }

    // For 'simple' mode, open the simple stats popup
    if (detailLevel === 'simple') {
      console.log('Simple mode - opening stats popup')
      setPendingPointWinner(winner)
      setShowSimpleStats(true)
      return
    }

    // 'detailed' and 'shot-type' both use the step-by-step logger; shot-type stops after the shot
    if (detailLevel === 'detailed' || detailLevel === 'shot-type') {
      setPendingPointWinner(winner)
      setShowPointDetail(true)
      return
    }

    // For custom/complex mode, use the dynamic logger (currently pointing to UltraSimplePointLogger as placeholder)
    if (detailLevel === 'custom' || detailLevel === 'complex') {
      console.log('Custom/Complex mode - opening dynamic logger')
      setPendingPointWinner(winner)
      setShowPointDetail(true)
      return
    }
  }

  const handleAwardPoint = async (
    winner: "p1" | "p2",
    pointDetails?: Partial<StorePointDetail>
  ) => {
    if (isPaused || pausePending) return
    try {
      const result = awardPoint(winner, {
        ...(pointDetails || {}),
        ...(servingPlayer ? { serverPlayer: servingPlayer } : {}),
      })
      setServerOverride(null)
      setIsInGame(true)

      // Play appropriate sound effects
      if (pointDetails?.pointOutcome === 'ace') {
        playSound('ace')
      } else if (pointDetails?.pointOutcome === 'double_fault') {
        playSound('double-fault')
      } else if (result.isMatchComplete) {
        playSound('match-won')
      } else if (result.newScore.sets.length > score.sets.length) {
        playSound('set-won')
      } else if ((result.newScore.games[0] + result.newScore.games[1]) > (score.games[0] + score.games[1])) {
        playSound('game-won')
      } else {
        // Check for critical point situations before playing point sound
        if (pointSituation?.type === 'matchPoint') {
          playSound('match-point')
        } else if (pointSituation?.type === 'setPoint') {
          playSound('set-point')
        } else if (pointSituation?.type === 'breakPoint') {
          playSound('break-point')
        } else {
          playSound('point-won')
        }
      }

      // Reset serve type back to first serve for next point; the point's own sync clears it for spectators
      if (serveSync.current) clearTimeout(serveSync.current)
      setServeType('first')

      // Include timing data in the update payload
      const updatePayload: {
        score: Score;
        pointLog: object[];
        status?: 'Completed';
        winnerId?: string;
        startTime?: string;
        endTime?: string;
        setDurations?: number[];
      } = {
        score: result.newScore,
        pointLog: [...pointLog, result.pointDetail],
      }

      // Include timing data from the store result
      if (result.startTime) {
        updatePayload.startTime = result.startTime
      }
      if (result.endTime) {
        updatePayload.endTime = result.endTime
      }
      if (result.setDurations) {
        updatePayload.setDurations = result.setDurations
      }

      if (result.isMatchComplete) {
        updatePayload.status = 'Completed'
        if (result.winnerId) {
          updatePayload.winnerId = result.winnerId
        }
      }

      await runSync(() => syncMatchScore(match.$id, updatePayload))

      if (result.isMatchComplete && result.winnerId) {
        const winnerName = result.winnerId === match.playerOne.$id ? playerNames.p1 : playerNames.p2

        // Trigger celebratory confetti
        triggerMatchWinConfetti()

        toast.success(t('matchCompletedWinner', { winner: winnerName }))

        // Navigate to match details after a short delay
        setTimeout(() => {
          router.push(`/matches/${match.$id}`)
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to award point:", error)
      toast.error(t('failedToSavePoint'))
    }
  }

  const handleSimpleStatsOutcome = (outcome: SimplePointOutcome, extra?: { servePlacement: StorePointDetail['servePlacement'] }) => {
    if (pendingPointWinner) {
      let lastShotPlayer: "p1" | "p2";

      if (outcome === 'ace') {
        lastShotPlayer = currentServer;
      } else if (outcome === 'winner') {
        lastShotPlayer = pendingPointWinner;
      } else if (outcome === 'forced_error') {
        lastShotPlayer = (pendingPointWinner === 'p1' ? 'p2' : 'p1');
      } else if (outcome === 'unforced_error') {
        lastShotPlayer = (pendingPointWinner === 'p1' ? 'p2' : 'p1');
      } else { // double fault
        lastShotPlayer = currentServer;
      }

      // Debug logging available for troubleshooting
      // console.log('Point logged:', outcome, 'winner:', pendingPointWinner, 'lastShotPlayer:', lastShotPlayer);

      const storePointDetail: Partial<StorePointDetail> = {
        serveType: serveType,
        pointOutcome: outcome,
        rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : 2,
        lastShotType: 'serve',
        lastShotPlayer: lastShotPlayer,
        // Where an ace landed, asked at this level too
        ...(extra?.servePlacement && { servePlacement: extra.servePlacement }),
      }

      handleAwardPoint(pendingPointWinner, storePointDetail)
      setPendingPointWinner(null)
      setShowSimpleStats(false)
    }
  }

  const handlePointDetailSave = (pointDetail: Partial<LibPointDetail>) => {
    if (pendingPointWinner) {
      const storePointDetail: Partial<StorePointDetail> = {
        ...pointDetail,
        serveType: serveType,
        lastShotType: pointDetail.lastShotType === 'drop_shot' ? 'other' : (pointDetail.lastShotType as StorePointDetail['lastShotType'])
      }
      handleAwardPoint(pendingPointWinner, storePointDetail)
      setPendingPointWinner(null)
      setShowPointDetail(false)
    }
  }

  // Tapping 1./2. also shows spectators which serve it is (a light save, after a short pause so
  // a quick correction sends one update)
  const chooseServe = (type: 'first' | 'second') => {
    setServeType(type)
    if (match.status !== 'In Progress') return
    if (serveSync.current) clearTimeout(serveSync.current)
    const pointCount = pointLog.length
    serveSync.current = setTimeout(() => {
      setCurrentServe(match.$id, type, pointCount).catch(() => undefined)
    }, 350)
  }
  const handleUndo = async () => {
    if (pointLog.length === 0 || isPaused || pausePending) return

    try {
      if (serveSync.current) clearTimeout(serveSync.current)
      setServeType('first')
      const result = undoLastPoint()
      
      await runSync(() => syncMatchScore(match.$id, {
        score: result.newScore,
        pointLog: result.newPointLog
      }))

      // Play undo sound effect
      playSound('undo')

      setIsInGame(result.newPointLog.length > 0)
      toast.success(t('pointUndone'))
    } catch (error) {
      console.error("Failed to undo point:", error)
      playSound('error')
      toast.error(t('failedToUndoPoint'))
    }
  }

  const togglePause = async (reason: PauseReason = pauseReason ?? 'other') => {
    if (pausePending || syncState !== 'synced' || !storeHydrated || !isMatchInitialized) return
    setPausePending(true)
    try {
      const next = !isPaused
      const result = await setMatchPaused(match.$id, next, reason)
      if (!result.success) throw new Error(result.error)
      setIsPaused(next)
      setShowPauseDialog(false)
    } catch {
      toast.error(t('pauseUpdateFailed'))
    } finally {
      setPausePending(false)
    }
  }

  const handleRetireMatch = async (reason: EndReason) => {
    try {
      if (!selectedWinner) {
        toast.error(t('pleaseSelectWinner'))
        return
      }

      // Determine winner ID based on selection
      const winnerId = selectedWinner === 'p1' ? match.playerOne.$id : match.playerTwo.$id

      // Keep the score reached on court (finished sets plus the game score of the set in play);
      // the saved reason says why it ended, e.g. "6:3 2:1 retired"
      const retiredScore: Score = score
      // The match ended with its last point, even when the scorer only closes it later
      const endTime = matchEndTime(pointLog)

      const updateData: {
        status: "Completed"
        winnerId: string
        retirementReason: string
        endTime: string
        duration?: number
      } = {
        status: "Completed",
        winnerId,
        retirementReason: reason,
        endTime
      }

      // Calculate duration if we have a start time
      if (startTime) {
        updateData.duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
      }

      await runSync(() => syncMatchScore(match.$id, {
        score: retiredScore,
        pointLog,
        ...updateData
      }))

      const reasonText = reason === 'retired' ? t('retirement') : t('injury')
      const winnerName = selectedWinner === 'p1' ? playerNames.p1 : playerNames.p2

      // Trigger celebratory confetti for match completion
      triggerMatchWinConfetti()

      toast.success(t('matchEndedDueToReason', { reason: reasonText, winner: winnerName }))
      setShowRetireDialog(false)
      setRetireReason('')
      setSelectedWinner('')

      // Navigate to match details after a short delay
      setTimeout(() => {
        router.push(`/matches/${match.$id}`)
      }, 2000)
    } catch (error) {
      console.error("Failed to retire match:", error)
      toast.error(t('failedToEndMatch'))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/live/${match.$id}` : ''
    const shareTitle = `${playerNames.p1} vs ${playerNames.p2} - Live Tennis Match`
    const shareText = `Watch this live tennis match between ${playerNames.p1} and ${playerNames.p2}!`

    // Try native share first (works best on mobile)
    if (typeof navigator !== 'undefined' && navigator.share && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        })
        toast.success(t('matchSharedSuccessfully'))
        return
      } catch (err) {
        // User canceled or share failed
        console.log("Native share failed:", err)
        // Fall through to show dialog
      }
    }

    // Show custom share dialog as fallback
    setShowShareDialog(true)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Enhanced Header with More Space */}
      <header className="relative z-30 w-full border-b border-border bg-background/95 md:sticky md:top-0">
        {/* z-40: Always below sidebar (z-50), always at top of page */}
        <div className="container mx-auto px-4">
          {/* Top row: Back button, title, and action buttons */}
          <div className="flex items-center h-12 border-b border-border/50 w-full gap-2 justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="md:hidden"
              aria-label={tCommon('back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Responsive Title: 'Live' on mobile, 'Live Match' on sm+ */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {match.tournamentName && (
                <span className="text-xs font-semibold text-muted-foreground mr-2 truncate max-w-[5rem] sm:max-w-xs min-w-0">
                  {match.tournamentName}
                </span>
              )}
              <h1 className="text-lg font-bold truncate min-w-0">
                <span className="sm:hidden">{t('liveDisplay')}</span>
                <span className="hidden sm:inline">{t('liveScoring')}</span>
              </h1>
            </div>

            {/* Action Buttons: icon + text on desktop/tablet, icon only on mobile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Breakpoint indicator in header */}
              {pointSituation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Badge variant="destructive" className="text-xs font-bold bg-orange-500 hover:bg-orange-600">
                    {pointSituation.badge}
                  </Badge>
                </motion.div>
              )}
              {/* Advanced Stats button: icon + text (truncate text if needed) */}
              {detailLevel !== 'custom' && <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomModeDialog(true)}
                className="flex items-center gap-2 min-w-0"
                title={t('configureStats')}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate min-w-0 hidden xs:block">{t('advancedStats')}</span>
              </Button>}
              {/* PDF report of the match so far */}
              {pointLog.length > 0 && (
                <PdfExportButton
                  report={liveReport}
                  filenameParts={[liveShortNames.p1, liveShortNames.p2]}
                  size="sm"
                  variant="outline"
                  className="hidden sm:flex"
                />
              )}
              {/* Settings button: icon + text (truncate text if needed) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
                className="flex items-center gap-2 min-w-0"
                aria-label={tCommon('settings')}
              >
                <Settings className="h-4 w-4 flex-shrink-0" />
                <span className="truncate min-w-0 hidden xs:block">{tCommon('settings')}</span>
              </Button>
              {/* Share button: icon + text (truncate text if needed) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDialog(true)}
                className="flex items-center gap-2 min-w-0"
                aria-label={tCommon('share')}
              >
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate min-w-0 hidden xs:block">{tCommon('share')}</span>
              </Button>
            </div>
          </div>


        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-3 space-y-4">
        <div className="flex justify-end">
          <SyncStatusBadge state={syncState} />
        </div>

        {isPaused && <p role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm font-semibold">{t('matchPaused')}{isPauseReason(pauseReason) && ` — ${t(`pauseReason_${pauseReason}`)}`}</p>}

        {/* Live Scoreboard */}
        <LiveScoreboard
          playerOneName={playerNames.p1}
          playerTwoName={playerNames.p2}
          playerThreeName={playerNames.p3}
          playerFourName={playerNames.p4}
          playerOneAvatar={<PlayerAvatar player={match.playerOne} className="h-5 w-5" />}
          playerTwoAvatar={<PlayerAvatar player={match.playerTwo} className="h-5 w-5" />}
          playerOneYearOfBirth={match.playerOne.yearOfBirth}
          playerTwoYearOfBirth={match.playerTwo.yearOfBirth}
          playerThreeYearOfBirth={match.playerThree?.yearOfBirth}
          playerFourYearOfBirth={match.playerFour?.yearOfBirth}
          playerOneRating={formatPlayerRating(match.playerOne)}
          playerTwoRating={formatPlayerRating(match.playerTwo)}
          playerThreeRating={match.playerThree ? formatPlayerRating(match.playerThree) : ''}
          playerFourRating={match.playerFour ? formatPlayerRating(match.playerFour) : ''}
          playerOneClub={match.playerOne.club}
          playerTwoClub={match.playerTwo.club}
          playerThreeClub={match.playerThree?.club}
          playerFourClub={match.playerFour?.club}
          score={score}
          currentServer={currentServer}
          serve={serveType}
          servingPlayer={servingPlayer}
          onSelectServingPlayer={canPickServer ? setServerOverride : undefined}
          status={match.status}
          playerOneId={match.playerOne.$id}
          playerTwoId={match.playerTwo.$id}
          isInGame={isInGame}
          onSetServer={setServer}
          matchFormat={parsedMatchFormat}
        />

        {/* Point Entry Interface */}
        <fieldset disabled={isPaused || pausePending}>
        <PointEntry
          onPointWin={handlePointWin}
          score={score}
          isTiebreak={isTiebreak}
          pointSituation={pointSituation}
          playerNames={playerNames}
          players={players}
          p1Streak={p1Streak}
          p2Streak={p2Streak}
        />
        </fieldset>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={pointLog.length === 0 || isPaused || pausePending}
            className="min-h-11 flex items-center gap-2"
          >
            <Undo className="h-4 w-4" />
            {tCommon('undo')}
          </Button>

          {/* Match Timer */}
          <MatchTimerDisplay
            startTime={match.startTime}
            endTime={match.endTime}
            setDurations={match.setDurations}
            isMatchComplete={match.status === "Completed"}
            isPaused={isPaused}
            pausedAt={pointLog[pointLog.length - 1]?.timestamp ?? null}
          />

          {/* Serve selection, labelled "Podání": large touch targets, a named pressed state, amber on a second serve */}
          <div className="flex flex-col items-center gap-1">
            <span id="serve-type-label" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('serveLabel')}</span>
            <div role="group" aria-labelledby="serve-type-label" className="flex items-center rounded-lg bg-muted/50 p-1" data-serve-switch>
              {(['first', 'second'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-label={tCommon(type === 'first' ? 'firstServeShort' : 'secondServeShort')}
                  aria-pressed={serveType === type}
                  onClick={() => chooseServe(type)}
                  className={cn(
                    "min-h-11 min-w-11 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    serveType === type
                      ? type === 'second' ? "bg-amber-400 text-amber-950 shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(type === 'first' ? 'firstServe' : 'secondServe')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match Momentum Bar */}
        {pointLog.length > 0 && (
          <MomentumBar
            pointLog={pointLog}
            playerNames={playerNames}
            className="mx-auto max-w-md"
            compact={true}
            maxPoints={10}
          />
        )}

        {/* Run, latest key moment, key numbers, this set's games and how the set has gone */}
        <LiveInsights insights={liveInsights} names={liveShortNames} matchOver={match.status === "Completed"} />

        {/* Tabs */}
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stats">{t('statsTab')}</TabsTrigger>
            <TabsTrigger value="points">{t('pointsTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4">
            <MatchStatsComponentSimpleFixed
              stats={calculateMatchStatsByLevel(convertedPointLog, detailLevel)}
              playerNames={{
                p1: playerNames.p1,
                p2: playerNames.p2
              }}
              detailLevel={detailLevel}
              pointLog={convertedPointLog}
            />
          </TabsContent>

          <TabsContent value="points" className="mt-4">
            <PointByPointView
              pointLog={convertedPointLog}
              playerObjects={{
                p1: match.playerOne,
                p2: match.playerTwo,
                ...(match.playerThree ? { p3: match.playerThree } : {}),
                ...(match.playerFour ? { p4: match.playerFour } : {})
              }}
              detailLevel={
                detailLevel === "points" || detailLevel === "simple" || detailLevel === "shot-type" || detailLevel === "complex" || detailLevel === "detailed"
                  ? detailLevel
                  : "simple"
              }
            />
          </TabsContent>
        </Tabs>

        {/* End Match Button */}
        <div className="mt-8 pb-20">
          <Button variant="outline" className="mb-3 h-12 w-full" onClick={() => isPaused ? void togglePause() : setShowPauseDialog(true)} disabled={pausePending || syncState !== 'synced' || !storeHydrated || !isMatchInitialized || match.status === 'Completed'}>
            {t(isPaused ? 'resumeInterruptedMatch' : 'pauseMatch')}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => setShowRetireDialog(true)}
          >
            <Trophy className="h-4 w-4 mr-2" />
            {t('endMatch')}
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('pauseReasonTitle')}</DialogTitle></DialogHeader>
          <div role="radiogroup" aria-label={t('pauseReasonTitle')} className="grid gap-2">
            {PAUSE_REASONS.map(reason => <label key={reason} className="flex min-h-11 items-center gap-3 rounded-lg border p-3">
              <input type="radio" name="pauseReason" value={reason} checked={pauseReason === reason} onChange={() => setPauseReason(reason)} />
              {t(`pauseReason_${reason}`)}
            </label>)}
          </div>
          <Button disabled={pausePending || !pauseReason} onClick={() => void togglePause(pauseReason)}>{t('pauseMatch')}</Button>
        </DialogContent>
      </Dialog>
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        matchId={match.$id}
        playerNames={playerNames}
      />

      <SimpleStatsPopup
        open={showSimpleStats}
        onOpenChange={setShowSimpleStats}
        onSave={handleSimpleStatsOutcome}
        pointContext={{
          pointNumber: pointLog.length + 1,
          setNumber: score.sets.length + 1,
          gameNumber: score.games[0] + score.games[1] + 1,
          gameScore: getGameScore(),
          winner: pendingPointWinner || 'p1',
          server: currentServer || 'p1',
          serveType: serveType,
          playerNames
        }}
      />

      {(detailLevel === 'custom' || detailLevel === 'complex') ? (
        <DynamicPointLogger
          open={showPointDetail}
          onOpenChange={setShowPointDetail}
          onSave={handlePointDetailSave}
          pointContext={{
            pointNumber: pointLog.length + 1,
            setNumber: score.sets.length + 1,
            gameNumber: score.games[0] + score.games[1] + 1,
            gameScore: getGameScore(),
            winner: pendingPointWinner || 'p1',
            server: currentServer || 'p1',
            serveType: serveType,
            isBreakPoint: Boolean(pointSituation && pointSituation.type === 'breakPoint'),
            isSetPoint: Boolean(pointSituation && pointSituation.type === 'setPoint'),
            isMatchPoint: Boolean(pointSituation && pointSituation.type === 'matchPoint'),
            playerNames
          }}
        />
      ) : (
        <UltraSimplePointLogger
          open={showPointDetail}
          onOpenChange={setShowPointDetail}
          onSave={handlePointDetailSave}
          mode={detailLevel === 'shot-type' ? 'shot-type' : 'detailed'}
          pointContext={{
            pointNumber: pointLog.length + 1,
            setNumber: score.sets.length + 1,
            gameNumber: score.games[0] + score.games[1] + 1,
            gameScore: getGameScore(),
            winner: pendingPointWinner || 'p1',
            server: currentServer || 'p1',
            serveType: serveType,
            isBreakPoint: Boolean(pointSituation && pointSituation.type === 'breakPoint'),
            isSetPoint: Boolean(pointSituation && pointSituation.type === 'setPoint'),
            isMatchPoint: Boolean(pointSituation && pointSituation.type === 'matchPoint'),
            playerNames
          }}
        />
      )}

      <Dialog open={showRetireDialog} onOpenChange={setShowRetireDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('endMatch')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">
                {t('whyEndingMatch')}
              </p>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="completed"
                    checked={retireReason === 'completed'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | EndReason)}
                    className="text-primary"
                  />
                  <span>{t('matchCompletedNormally')}</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="retired"
                    checked={retireReason === 'retired'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | EndReason)}
                    className="text-primary"
                  />
                  <span>{t('playerRetired')}</span>
                </label>


                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="retireReason"
                    value="injury"
                    checked={retireReason === 'injury'}
                    onChange={(e) => setRetireReason(e.target.value as 'completed' | EndReason)}
                    className="text-primary"
                  />
                  <span>{t('injury')}</span>
                </label>
              </div>
            </div>

            {/* Winner Selection - only show for early endings */}
            {retireReason && retireReason !== 'completed' && (
              <div>
                <p className="text-muted-foreground mb-4">
                  {t('whichPlayerWon')}
                </p>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="selectedWinner"
                      value="p1"
                      checked={selectedWinner === 'p1'}
                      onChange={(e) => setSelectedWinner(e.target.value as 'p1' | 'p2')}
                      className="text-primary"
                    />
                    <PlayerAvatar player={match.playerOne} className="h-6 w-6" />
                    <span className="font-medium">{playerNames.p1}</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <input
                      type="radio"
                      name="selectedWinner"
                      value="p2"
                      checked={selectedWinner === 'p2'}
                      onChange={(e) => setSelectedWinner(e.target.value as 'p1' | 'p2')}
                      className="text-primary"
                    />
                    <PlayerAvatar player={match.playerTwo} className="h-6 w-6" />
                    <span className="font-medium">{playerNames.p2}</span>
                  </label>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {t('finalScoreKeptOnCourt')}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => {
              setShowRetireDialog(false)
              setRetireReason('')
              setSelectedWinner('')
            }}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={() => {
                if (retireReason === 'completed') {
                  router.push(`/matches/${match.$id}`)
                } else if (retireReason && selectedWinner) {
                  handleRetireMatch(retireReason)
                } else if (retireReason && !selectedWinner) {
                  toast.error(t('pleaseSelectWinner'))
                }

                if (retireReason === 'completed') {
                  setShowRetireDialog(false)
                  setRetireReason('')
                  setSelectedWinner('')
                }
              }}
              disabled={!retireReason || (retireReason !== 'completed' && !selectedWinner)}
            >
              {t('endMatch')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Match Settings Dialog */}
      <MatchSettingsDialog
        isOpen={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        match={match}
      />

      {/* Custom Mode Dialog */}
      <CustomModeDialog
        open={showCustomModeDialog}
        onOpenChange={setShowCustomModeDialog}
      />
    </div>
  )
}
