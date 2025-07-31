"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ServeStats } from "@/lib/schemas/match"
import { Zap } from "lucide-react"
import { Target } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { useTranslations } from "@/i18n"

interface AdvancedServeCollectorProps {
  onServeStats: (stats: ServeStats) => void
  isVisible: boolean
  initialData?: Partial<ServeStats>
}

export function AdvancedServeCollector({ 
  onServeStats, 
  isVisible, 
  initialData 
}: AdvancedServeCollectorProps) {
  const t = useTranslations('common')
  const [speed, setSpeed] = useState(initialData?.speed || 100)
  const [placement, setPlacement] = useState<NonNullable<ServeStats>['placement']>(
    initialData?.placement || 'long'
  )
  const [spin, setSpin] = useState<NonNullable<ServeStats>['spin']>(
    initialData?.spin || 'flat'
  )
  const [quality, setQuality] = useState(initialData?.quality || 5)

  // Update parent component whenever values change
  useEffect(() => {
    if (isVisible) {
      const stats: ServeStats = {
        speed,
        placement,
        spin,
        quality
      }
      onServeStats(stats)
    }
  }, [speed, placement, spin, quality, isVisible, onServeStats])

  if (!isVisible) return null

  const getSpeedLabel = (speed: number) => {
    if (speed < 80) return "Slow"
    if (speed < 100) return "Medium"  
    if (speed < 120) return "Fast"
    return "Very Fast"
  }

  const getQualityLabel = (quality: number) => {
    if (quality <= 3) return t('poor')
    if (quality <= 5) return t('average')
    if (quality <= 7) return t('good')
    if (quality <= 9) return t('excellent')
    return t('perfect')
  }

  const placementOptions = [
    { value: 'long', label: 'Long', description: 'Deep serve' },
    { value: 'wide', label: 'Wide', description: 'Wide serve' },
    { value: 'net', label: 'Net', description: 'Net serve' }
  ] as const

  const spinOptions = [
    { value: 'flat', label: 'Flat', icon: '→', description: 'Straight, fast serve' },
    { value: 'slice', label: 'Slice', icon: '↘', description: 'Side spin, curves out' },
    { value: 'kick', label: 'Kick', icon: '↗', description: 'Top spin, high bounce' },
    { value: 'twist', label: 'Twist', icon: '↻', description: 'Mixed spin' }
  ] as const

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Advanced Serve Analytics
          <Badge variant="secondary" className="ml-2">Level 2</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speed Estimation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Serve Speed
            </Label>
            <Badge variant="outline" className="text-xs">
              {speed} mph - {getSpeedLabel(speed)}
            </Badge>
          </div>
          <Slider
            value={[speed]}
            onValueChange={([value]) => setSpeed(value)}
            max={140}
            min={60}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slow (60)</span>
            <span>Medium (100)</span>
            <span>Fast (140)</span>
          </div>
        </div>

        <Separator />

        {/* Serve Placement */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-3 w-3" />
            Serve Placement
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {placementOptions.map(option => (
              <Button
                key={option.value}
                variant={placement === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPlacement(option.value)}
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

        {/* Spin Type */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('spinType')}</Label>
          <div className="grid grid-cols-2 gap-3">
            {spinOptions.map(option => (
              <Button
                key={option.value}
                variant={spin === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSpin(option.value)}
                className="h-auto p-3 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quality Assessment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Serve Quality</Label>
            <Badge variant="outline" className="text-xs">
              {quality}/10 - {getQualityLabel(quality)}
            </Badge>
          </div>
          <Slider
            value={[quality]}
            onValueChange={([value]) => setQuality(value)}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('poor')} (1)</span>
            <span>{t('average')} (5)</span>
            <span>{t('perfect')} (10)</span>
          </div>
          
          {/* Quality indicators */}
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
              <div
                key={value}
                className={`h-2 rounded transition-all cursor-pointer ${
                  value <= quality 
                    ? quality <= 3 ? 'bg-red-500' 
                      : quality <= 6 ? 'bg-yellow-500'
                      : quality <= 8 ? 'bg-blue-500'
                      : 'bg-green-500'
                    : 'bg-muted'
                }`}
                onClick={() => setQuality(value)}
              />
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Summary</div>
          <div className="text-sm">
            <span className="font-medium">{speed} mph</span> {spin} serve{' '}
            <span className="font-medium">
              {placementOptions.find(p => p.value === placement)?.label}
            </span>
            {' '}({getQualityLabel(quality)} quality)
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 