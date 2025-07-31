"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReturnStats } from "@/lib/schemas/match"
import { CornerDownLeft } from "lucide-react"
import { Crosshair } from "lucide-react"
import { Shield } from "lucide-react"
import { useTranslations } from "@/i18n"

interface ReturnAnalyticsCollectorProps {
  onReturnStats: (stats: ReturnStats) => void
  isVisible: boolean
  initialData?: Partial<ReturnStats>
}

export function ReturnAnalyticsCollector({ 
  onReturnStats, 
  isVisible, 
  initialData 
}: ReturnAnalyticsCollectorProps) {
  const t = useTranslations('common')
  const [placement, setPlacement] = useState<NonNullable<ReturnStats>['placement']>(
    initialData?.placement || 'center-deep'
  )
  const [depth, setDepth] = useState<NonNullable<ReturnStats>['depth']>(
    initialData?.depth || 'deep'
  )
  const [direction, setDirection] = useState<NonNullable<ReturnStats>['direction']>(
    initialData?.direction || 'long'
  )
  const [quality, setQuality] = useState<NonNullable<ReturnStats>['quality']>(
    initialData?.quality || 'neutral'
  )
  const [type, setType] = useState<NonNullable<ReturnStats>['type']>(
    initialData?.type || 'swing'
  )

  // Update parent component whenever values change
  useEffect(() => {
    if (isVisible) {
      const stats: ReturnStats = {
        placement,
        depth,
        direction,
        quality,
        type
      }
      onReturnStats(stats)
    }
  }, [placement, depth, direction, quality, type, isVisible, onReturnStats])

  if (!isVisible) return null

  // 9-zone court grid
  const courtZones = [
    { value: 'deuce-deep', label: 'Deep', position: 'Deuce', row: 0, col: 0 },
    { value: 'center-deep', label: 'Deep', position: 'Center', row: 0, col: 1 },
    { value: 'ad-deep', label: 'Deep', position: 'Ad', row: 0, col: 2 },
    { value: 'deuce-mid', label: 'Mid', position: 'Deuce', row: 1, col: 0 },
    { value: 'center-mid', label: 'Mid', position: 'Center', row: 1, col: 1 },
    { value: 'ad-mid', label: 'Mid', position: 'Ad', row: 1, col: 2 },
    { value: 'deuce-short', label: 'Short', position: 'Deuce', row: 2, col: 0 },
    { value: 'center-short', label: 'Short', position: 'Center', row: 2, col: 1 },
    { value: 'ad-short', label: 'Short', position: 'Ad', row: 2, col: 2 }
  ] as const

  const depthOptions = [
    { value: 'short', label: 'Short', description: 'Close to net' },
    { value: 'medium', label: 'Medium', description: 'Mid-court' },
    { value: 'deep', label: 'Deep', description: 'Near baseline' }
  ] as const

  const directionOptions = [
    { value: 'long', label: 'Long', icon: '↑', description: 'Deep return' },
    { value: 'wide', label: 'Wide', icon: '↗', description: 'Wide return' },
    { value: 'net', label: 'Net', icon: '→', description: 'Net return' }
  ] as const

  const qualityOptions = [
    { value: 'defensive', label: 'Defensive', color: 'bg-red-500', description: 'Passive, safe return' },
    { value: 'neutral', label: 'Neutral', color: 'bg-yellow-500', description: 'Balanced return' },
    { value: 'offensive', label: 'Offensive', color: 'bg-green-500', description: 'Aggressive, attacking' }
  ] as const

  const typeOptions = [
    { value: 'block', label: 'Block', description: 'Simple block return' },
    { value: 'swing', label: 'Swing', description: 'Full swing return' },
    { value: 'slice', label: 'Slice', description: 'Slice return' },
    { value: 'defensive', label: 'Defensive', description: 'Defensive lob/chip' }
  ] as const

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CornerDownLeft className="h-4 w-4" />
          Return Analytics
          <Badge variant="secondary" className="ml-2">Level 2</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 9-Zone Court Placement */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Crosshair className="h-3 w-3" />
            Return Placement (9-Zone Court)
          </Label>
          <div className="relative">
            {/* Court visualization */}
            <div className="grid grid-cols-3 gap-1 aspect-[3/2] max-w-[300px] mx-auto p-3 border-2 border-dashed border-muted-foreground/50 rounded-lg bg-green-50 dark:bg-green-950/10">
              {courtZones.map(zone => (
                <Button
                  key={zone.value}
                  variant={placement === zone.value ? 'default' : 'outline'}
                  className={`aspect-square text-xs p-1 ${
                    placement === zone.value ? 'shadow-lg scale-105' : ''
                  }`}
                  onClick={() => setPlacement(zone.value)}
                >
                  <div className="text-center">
                    <div className="font-medium">{zone.position.slice(0, 1)}</div>
                    <div className="text-xs">{zone.label.slice(0, 1)}</div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="text-xs text-center text-muted-foreground mt-2">
              Tap a zone to select return placement
            </div>
          </div>
        </div>

        <Separator />

        {/* Return Depth */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Return Depth</Label>
          <div className="grid grid-cols-3 gap-2">
            {depthOptions.map(option => (
              <Button
                key={option.value}
                variant={depth === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDepth(option.value)}
                className="h-auto p-3 flex flex-col gap-1"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Return Direction */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Return Direction</Label>
          <div className="grid grid-cols-3 gap-2">
            {directionOptions.map(option => (
              <Button
                key={option.value}
                variant={direction === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection(option.value)}
                className="h-auto p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium text-xs">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Return Quality */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-3 w-3" />
            Return Quality
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {qualityOptions.map(option => (
              <Button
                key={option.value}
                variant={quality === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuality(option.value)}
                className="h-auto p-3 flex flex-col gap-2"
              >
                <div className={`w-6 h-6 rounded-full ${option.color} mx-auto`} />
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Return Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('returnType')}</Label>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map(option => (
              <Button
                key={option.value}
                variant={type === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType(option.value)}
                className="h-auto p-3 flex flex-col gap-1"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Summary</div>
          <div className="text-sm">
            <span className="font-medium capitalize">{quality}</span> {type} return{' '}
            <span className="font-medium">{direction}</span> to{' '}
            <span className="font-medium">
              {courtZones.find(z => z.value === placement)?.position} {courtZones.find(z => z.value === placement)?.label}
            </span>
            {' '}({depth} depth)
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 