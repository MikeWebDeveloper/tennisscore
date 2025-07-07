import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useMatchStore, CustomModeConfig } from '@/stores/matchStore'
import { BarChart3, Clock, Target, Zap } from 'lucide-react'

interface CustomModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRESETS = {
  basic: { 
    level: 1 as const, 
    categories: ['serve-placement', 'rally-type'],
    name: 'Basic',
    description: 'Quick serve placement and rally type tracking',
    estimatedTime: '+ 3-5 seconds per point'
  },
  intermediate: { 
    level: 2 as const, 
    categories: ['serve-placement', 'serve-speed', 'return-quality', 'rally-type'],
    name: 'Intermediate',
    description: 'Detailed serve and return analysis',
    estimatedTime: '+ 8-12 seconds per point'
  },
  professional: { 
    level: 3 as const, 
    categories: ['serve-placement', 'serve-speed', 'return-quality', 'rally-type', 'shot-tracking', 'tactical-context'],
    name: 'Professional',
    description: 'Complete shot-by-shot analysis',
    estimatedTime: '+ 15-25 seconds per point'
  }
}

const CATEGORIES = {
  'serve-placement': {
    name: 'Serve Placement',
    description: 'Track where serves land (wide, body, T)',
    level: 1,
    icon: Target
  },
  'rally-type': {
    name: 'Rally Type',
    description: 'Baseline, net play, approach shots',
    level: 1,
    icon: BarChart3
  },
  'serve-speed': {
    name: 'Serve Speed',
    description: 'Estimate serve velocity',
    level: 2,
    icon: Zap
  },
  'return-quality': {
    name: 'Return Quality',
    description: 'Defensive, neutral, or offensive returns',
    level: 2,
    icon: Target
  },
  'shot-tracking': {
    name: 'Shot-by-Shot',
    description: 'Track every shot in each rally',
    level: 3,
    icon: BarChart3
  },
  'tactical-context': {
    name: 'Tactical Context',
    description: 'Pressure situations, court position',
    level: 3,
    icon: Target
  }
}

export function CustomModeDialog({ open, onOpenChange }: CustomModeDialogProps) {
  const { customMode, setCustomMode } = useMatchStore()
  const [localConfig, setLocalConfig] = useState<CustomModeConfig>(customMode)

  const handlePresetSelect = (preset: typeof PRESETS[keyof typeof PRESETS]) => {
    setLocalConfig({
      enabled: true,
      level: preset.level,
      selectedCategories: preset.categories
    })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const category = CATEGORIES[categoryId as keyof typeof CATEGORIES]
    if (!category) return

    setLocalConfig(prev => {
      const isSelected = prev.selectedCategories.includes(categoryId)
      const newCategories = isSelected
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]

      // Automatically adjust level based on selected categories
      const maxLevelRequired = Math.max(
        ...newCategories.map(id => CATEGORIES[id as keyof typeof CATEGORIES]?.level || 1)
      )

      return {
        ...prev,
        selectedCategories: newCategories,
        level: Math.max(prev.level, maxLevelRequired) as 1 | 2 | 3
      }
    })
  }

  const handleLevelChange = (level: 1 | 2 | 3) => {
    setLocalConfig(prev => ({
      ...prev,
      level,
      // Remove categories that require higher level
      selectedCategories: prev.selectedCategories.filter(id => 
        CATEGORIES[id as keyof typeof CATEGORIES]?.level <= level
      )
    }))
  }

  const handleSave = () => {
    setCustomMode(localConfig)
    onOpenChange(false)
  }

  const getEstimatedTime = () => {
    if (!localConfig.enabled) return 'No additional time'
    if (localConfig.level === 1) return '+ 3-5 seconds per point'
    if (localConfig.level === 2) return '+ 8-12 seconds per point'
    return '+ 15-25 seconds per point'
  }

  const categoriesForLevel = Object.entries(CATEGORIES).filter(
    ([, category]) => category.level <= localConfig.level
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Statistics Mode
          </DialogTitle>
          <DialogDescription>
            Enable enhanced tennis analytics to gain deeper insights into your game.
            Choose a preset or customize your tracking preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-custom-mode" className="text-base font-medium">
                Enable Advanced Statistics
              </Label>
              <p className="text-sm text-muted-foreground">
                Track additional data during live scoring
              </p>
            </div>
            <Switch
              id="enable-custom-mode"
              checked={localConfig.enabled}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {localConfig.enabled && (
            <>
              <Separator />

              {/* Presets */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Quick Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <Card 
                      key={key}
                      className={`cursor-pointer transition-colors ${
                        localConfig.level === preset.level && 
                        localConfig.selectedCategories.length === preset.categories.length &&
                        preset.categories.every(cat => localConfig.selectedCategories.includes(cat))
                          ? 'ring-2 ring-primary' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          {preset.name}
                          <Badge variant="outline">Level {preset.level}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground mb-2">
                          {preset.description}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {preset.estimatedTime}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Level Selector */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detail Level</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((level) => (
                    <Button
                      key={level}
                      variant={localConfig.level === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleLevelChange(level as 1 | 2 | 3)}
                    >
                      Level {level}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Higher levels provide more detailed analytics but take longer to input
                </p>
              </div>

              {/* Category Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Statistics Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoriesForLevel.map(([categoryId, category]) => {
                    const Icon = category.icon
                    const isSelected = localConfig.selectedCategories.includes(categoryId)
                    
                    return (
                      <Card
                        key={categoryId}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleCategoryToggle(categoryId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 mt-0.5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{category.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  L{category.level}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {category.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Time Estimate */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Estimated additional time per point:</span>
                  <Badge variant="outline">{getEstimatedTime()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Time estimates include data entry during point breaks
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {localConfig.enabled ? 'Enable Advanced Stats' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 