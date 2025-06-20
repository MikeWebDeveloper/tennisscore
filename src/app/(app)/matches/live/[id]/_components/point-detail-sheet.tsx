"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { 
  PointDetail, 
  ServeType, 
  PointOutcome, 
  ShotType, 
  CourtPosition 
} from "@/lib/types"
import { Target, Zap, Trophy, AlertTriangle } from "lucide-react"

interface PointDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pointDetail: Partial<PointDetail>) => void
  pointContext: {
    pointNumber: number
    setNumber: number
    gameNumber: number
    gameScore: string
    winner: "p1" | "p2"
    server: "p1" | "p2"
    serveType: "first" | "second"
    isBreakPoint: boolean
    isSetPoint: boolean
    isMatchPoint: boolean
    playerNames: { p1: string; p2: string }
  }
}

export function PointDetailSheet({ 
  open, 
  onOpenChange, 
  onSave, 
  pointContext 
}: PointDetailSheetProps) {
  const [serveType, setServeType] = useState<ServeType>("first")
  const [serveOutcome, setServeOutcome] = useState<PointOutcome>("winner")
  const [servePlacement, setServePlacement] = useState<"wide" | "body" | "t">("wide")
  const [serveSpeed, setServeSpeed] = useState<string>("")
  const [rallyLength, setRallyLength] = useState<string>("1")
  const [pointOutcome, setPointOutcome] = useState<PointOutcome>("winner")
  const [lastShotType, setLastShotType] = useState<ShotType>("serve")
  const [lastShotPlayer, setLastShotPlayer] = useState<"p1" | "p2">(pointContext.winner)
  const [courtPosition, setCourtPosition] = useState<CourtPosition>("deuce")
  const [notes, setNotes] = useState("")

  // Validation state
  const [validationError, setValidationError] = useState<string>("")

  // Tennis rule validation
  useEffect(() => {
    let error = ""

    // Double fault validation
    if (pointOutcome === "double_fault") {
      if (pointContext.serveType !== "second") {
        error = "Double faults can only occur on second serves"
      } else if (pointContext.winner === pointContext.server) {
        error = "Double faults must be won by the receiving player"
      }
    }

    // Ace validation
    if (pointOutcome === "ace") {
      if (pointContext.winner !== pointContext.server) {
        error = "Aces must be won by the serving player"
      }
    }

    // Serve winner validation (for non-ace serves)
    if (pointOutcome === "winner" && lastShotType === "serve") {
      if (pointContext.winner !== pointContext.server) {
        error = "Service winners must be won by the serving player"
      }
    }

    setValidationError(error)
  }, [pointOutcome, pointContext.serveType, pointContext.winner, pointContext.server, lastShotType])

  // Auto-correct winner for certain outcomes
  useEffect(() => {
    if (pointOutcome === "double_fault") {
      // Auto-set winner to receiving player for double faults
      const receiver = pointContext.server === "p1" ? "p2" : "p1"
      setLastShotPlayer(receiver)
    } else if (pointOutcome === "ace") {
      // Auto-set winner to serving player for aces
      setLastShotPlayer(pointContext.server)
    }
  }, [pointOutcome, pointContext.server])

  const handleDirectSave = (outcome: PointOutcome) => {
    const pointDetail: Partial<PointDetail> = {
      serveType,
      serveOutcome: outcome === 'ace' ? 'ace' : outcome === 'double_fault' ? 'double_fault' : 'winner',
      servePlacement,
      serveSpeed: serveSpeed ? parseInt(serveSpeed) : undefined,
      rallyLength: outcome === 'ace' || outcome === 'double_fault' ? 1 : parseInt(rallyLength) || 1,
      pointOutcome: outcome,
      lastShotType: outcome === 'ace' || outcome === 'double_fault' ? 'serve' : lastShotType,
      lastShotPlayer: pointContext.winner,
      courtPosition,
      notes: notes || undefined,
    }

    onSave(pointDetail)
    resetForm()
  }

  const handleDetailedSave = () => {
    if (validationError) {
      return // Don't save if there's a validation error
    }

    const pointDetail: Partial<PointDetail> = {
      serveType,
      serveOutcome,
      servePlacement,
      serveSpeed: serveSpeed ? parseInt(serveSpeed) : undefined,
      rallyLength: parseInt(rallyLength) || 1,
      pointOutcome,
      lastShotType,
      lastShotPlayer,
      courtPosition,
      notes: notes || undefined,
    }

    onSave(pointDetail)
    resetForm()
  }

  const resetForm = () => {
    setServeType("first")
    setServeOutcome("winner")
    setServePlacement("wide")
    setServeSpeed("")
    setRallyLength("1")
    setPointOutcome("winner")
    setLastShotType("serve")
    setLastShotPlayer(pointContext.winner)
    setCourtPosition("deuce")
    setNotes("")
    setValidationError("")
  }

  const getContextBadges = () => {
    const badges = []
    if (pointContext.isBreakPoint) badges.push({ label: "Break Point", icon: Target, color: "destructive" })
    if (pointContext.isSetPoint) badges.push({ label: "Set Point", icon: Zap, color: "secondary" })
    if (pointContext.isMatchPoint) badges.push({ label: "Match Point", icon: Trophy, color: "default" })
    return badges
  }

  // Check if outcome is disabled based on context
  const isOutcomeDisabled = (outcome: PointOutcome) => {
    switch (outcome) {
      case 'ace':
        return pointContext.winner !== pointContext.server
      case 'double_fault':
        return pointContext.serveType !== "second" || pointContext.winner === pointContext.server
      default:
        return false
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            Point #{pointContext.pointNumber} Details
            <div className="flex gap-1">
              {getContextBadges().map((badge, index) => {
                const Icon = badge.icon
                return (
                  <Badge key={index} variant={badge.color as "default" | "destructive" | "secondary"} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {badge.label}
                  </Badge>
                )
              })}
            </div>
          </SheetTitle>
          <div className="text-sm text-muted-foreground">
            Set {pointContext.setNumber}, Game {pointContext.gameNumber} • {pointContext.gameScore} • 
            <span className="font-medium"> {pointContext.playerNames[pointContext.winner]} wins point</span>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Actions - One-Click Simple Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleDirectSave('ace')}
                  disabled={isOutcomeDisabled('ace')}
                  className="h-16 flex flex-col gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20"
                  variant="outline"
                >
                  <span className="font-semibold">Ace</span>
                  <span className="text-xs opacity-70">Unreturnable serve</span>
                </Button>
                
                <Button
                  onClick={() => handleDirectSave('winner')}
                  className="h-16 flex flex-col gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                  variant="outline"
                >
                  <span className="font-semibold">Winner</span>
                  <span className="text-xs opacity-70">Clean winner</span>
                </Button>
                
                <Button
                  onClick={() => handleDirectSave('unforced_error')}
                  className="h-16 flex flex-col gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20"
                  variant="outline"
                >
                  <span className="font-semibold">Unforced Error</span>
                  <span className="text-xs opacity-70">Unforced mistake</span>
                </Button>
                
                <Button
                  onClick={() => handleDirectSave('forced_error')}
                  className="h-16 flex flex-col gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
                  variant="outline"
                >
                  <span className="font-semibold">Forced Error</span>
                  <span className="text-xs opacity-70">Opponent forced error</span>
                </Button>
                
                <Button
                  onClick={() => handleDirectSave('double_fault')}
                  disabled={isOutcomeDisabled('double_fault')}
                  className="h-16 flex flex-col gap-1 bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 col-span-2"
                  variant="outline"
                >
                  <span className="font-semibold">Double Fault</span>
                  <span className="text-xs opacity-70">Two consecutive faults</span>
                </Button>
              </div>
              
              {(isOutcomeDisabled('ace') || isOutcomeDisabled('double_fault')) && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <p>
                    {isOutcomeDisabled('ace') && "• Ace requires server to win the point"}
                  </p>
                  <p>
                    {isOutcomeDisabled('double_fault') && "• Double fault only on 2nd serve when receiver wins"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Detailed Stats Section (Collapsed by default) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Detailed Statistics
                <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Validation Error Alert */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Serve Type</Label>
                <RadioGroup 
                  value={serveType} 
                  onValueChange={(value) => setServeType(value as ServeType)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first" id="first-serve" />
                    <Label htmlFor="first-serve">First Serve</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="second" id="second-serve" />
                    <Label htmlFor="second-serve">Second Serve</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Serve Placement</Label>
                  <RadioGroup 
                    value={servePlacement} 
                    onValueChange={(value) => setServePlacement(value as "wide" | "body" | "t")}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wide" id="wide" />
                      <Label htmlFor="wide">Wide</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="body" id="body" />
                      <Label htmlFor="body">Body</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="t" id="t" />
                      <Label htmlFor="t">T (Down the Middle)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="serve-speed" className="text-sm font-medium">
                    Serve Speed (mph) <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="serve-speed"
                    type="number"
                    placeholder="120"
                    value={serveSpeed}
                    onChange={(e) => setServeSpeed(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Point Outcome</Label>
                <RadioGroup 
                  value={pointOutcome} 
                  onValueChange={(value) => setPointOutcome(value as PointOutcome)}
                  className="mt-2 grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="winner" id="winner" />
                    <Label htmlFor="winner">Winner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unforced_error" id="unforced_error" />
                    <Label htmlFor="unforced_error">Unforced Error</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="forced_error" id="forced_error" />
                    <Label htmlFor="forced_error">Forced Error</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ace" id="ace" disabled={isOutcomeDisabled('ace')} />
                    <Label htmlFor="ace" className={isOutcomeDisabled('ace') ? "text-muted-foreground" : ""}>Ace</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="double_fault" id="double_fault" disabled={isOutcomeDisabled('double_fault')} />
                    <Label htmlFor="double_fault" className={isOutcomeDisabled('double_fault') ? "text-muted-foreground" : ""}>Double Fault</Label>
                  </div>
                </RadioGroup>
              </div>

              {pointOutcome !== "ace" && pointOutcome !== "double_fault" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Last Shot Type</Label>
                    <RadioGroup 
                      value={lastShotType} 
                      onValueChange={(value) => setLastShotType(value as ShotType)}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="serve" id="serve-shot" />
                        <Label htmlFor="serve-shot">Serve</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="forehand" id="forehand" />
                        <Label htmlFor="forehand">Forehand</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="backhand" id="backhand" />
                        <Label htmlFor="backhand">Backhand</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="volley" id="volley" />
                        <Label htmlFor="volley">Volley</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="overhead" id="overhead" />
                        <Label htmlFor="overhead">Overhead</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Rally Length</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="3"
                      value={rallyLength}
                      onChange={(e) => setRallyLength(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of shots including serve
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Court Position</Label>
                <RadioGroup 
                  value={courtPosition} 
                  onValueChange={(value) => setCourtPosition(value as CourtPosition)}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="deuce" id="deuce-side" />
                    <Label htmlFor="deuce-side">Deuce Side</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ad" id="ad-side" />
                    <Label htmlFor="ad-side">Ad Side</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Great passing shot down the line..."
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleDetailedSave} 
                className="w-full"
                disabled={!!validationError}
              >
                Save Detailed Point
              </Button>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
} 