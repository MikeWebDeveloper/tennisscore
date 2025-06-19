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
  onSimplePoint: () => void
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
  onSimplePoint,
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

  const handleSave = () => {
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

  const handleSimplePoint = () => {
    onSimplePoint()
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

  // Get available point outcomes based on serve type and context
  const getAvailableOutcomes = () => {
    const outcomes = [
      { value: "winner", label: "Winner", disabled: false },
      { value: "unforced_error", label: "Unforced Error", disabled: false },
      { value: "forced_error", label: "Forced Error", disabled: false },
    ] as Array<{ value: PointOutcome; label: string; disabled: boolean }>

    // Ace option (disabled if winner is not server)
    outcomes.push({
      value: "ace",
      label: "Ace",
      disabled: pointContext.winner !== pointContext.server,
    })

    // Double fault option (only when second serve and winner is returner)
    outcomes.push({
      value: "double_fault",
      label: "Double Fault",
      disabled: pointContext.serveType !== "second" || pointContext.winner === pointContext.server,
    })

    return outcomes
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

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center gap-2 p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Serve Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Serve Details
                <span className="text-sm font-normal text-muted-foreground">
                  ({pointContext.playerNames[pointContext.server]} serving)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Point Outcome */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Point Outcome
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">How did the point end?</Label>
                <RadioGroup 
                  value={pointOutcome} 
                  onValueChange={(value) => setPointOutcome(value as PointOutcome)}
                  className="mt-2 grid grid-cols-2 gap-2"
                >
                  {getAvailableOutcomes().map((outcome) => (
                    <div key={outcome.value} className="flex items-center space-x-2 opacity-100">
                      <RadioGroupItem value={outcome.value} id={outcome.value} disabled={outcome.disabled} />
                      <Label htmlFor={outcome.value} className={outcome.disabled ? "text-muted-foreground" : ""}>{outcome.label}</Label>
                    </div>
                  ))}
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
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={!!validationError}
          >
            Save Detailed Point
          </Button>
          <Button variant="outline" onClick={handleSimplePoint} className="flex-1">
            Save Simple Point
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 