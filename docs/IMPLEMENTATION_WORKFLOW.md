# Advanced Tennis Statistics - Implementation Workflow

## Overview

This document provides a detailed, step-by-step implementation workflow for adding advanced tennis statistics and custom mode functionality to the tennis scoring application. Each task is designed to be executed by an AI agent with minimal context switching and maximum code safety.

## Prerequisites

- Read and understand `ADVANCED_TENNIS_STATISTICS_GUIDE.md`
- Ensure current test suite passes: `npm run lint && npm run build`
- Backup current database collections
- Create feature branch: `git checkout -b feature/advanced-tennis-stats`

---

## Phase 1: Foundation (Week 1-2)

### Task 1.1: Extend Core Data Types
**Priority**: Critical
**Estimated Time**: 2-4 hours
**Dependencies**: None

#### Subtask 1.1.1: Enhance PointDetail Interface
**File**: `src/lib/schemas/match.ts`

1. **Add new optional fields to existing pointDetailSchema**:
   ```typescript
   // Add to existing pointDetailSchema
   serveStats: z.object({
     speed: z.number().optional(),
     placement: z.enum(['deuce-wide', 'deuce-body', 'deuce-t', 'ad-wide', 'ad-body', 'ad-t', 'center-wide', 'center-body', 'center-t']).optional(),
     spin: z.enum(['flat', 'slice', 'kick', 'twist']).optional(),
     netClearance: z.number().optional(),
     quality: z.number().min(1).max(10).optional()
   }).optional(),
   
   returnStats: z.object({
     placement: z.enum(['deuce-deep', 'center-deep', 'ad-deep', 'deuce-mid', 'center-mid', 'ad-mid', 'deuce-short', 'center-short', 'ad-short']).optional(),
     depth: z.enum(['short', 'medium', 'deep']).optional(),
     direction: z.enum(['cross', 'line', 'body']).optional(),
     quality: z.enum(['defensive', 'neutral', 'offensive']).optional(),
     type: z.enum(['block', 'swing', 'slice', 'defensive']).optional()
   }).optional(),
   
   tacticalContext: z.object({
     rallyType: z.enum(['baseline', 'approach', 'net', 'defensive']).optional(),
     approachShot: z.boolean().optional(),
     netPosition: z.boolean().optional(),
     pressureSituation: z.boolean().optional()
   }).optional(),
   
   loggingLevel: z.enum(['1', '2', '3']).default('1'),
   customFields: z.record(z.any()).optional()
   ```

2. **Update TypeScript types**:
   ```typescript
   export type EnhancedPointDetail = z.infer<typeof pointDetailSchema>
   ```

3. **Test the schema changes**:
   - Verify existing matches still validate
   - Test new fields are optional
   - Ensure backward compatibility

#### Subtask 1.1.2: Extend MatchStore Interface
**File**: `src/stores/matchStore.ts`

1. **Add custom mode state to MatchState interface**:
   ```typescript
   // Add to existing MatchState interface
   customMode: {
     enabled: boolean
     level: 1 | 2 | 3
     selectedCategories: string[]
   }
   setCustomMode: (config: { enabled: boolean; level: 1 | 2 | 3; selectedCategories: string[] }) => void
   toggleCustomMode: () => void
   ```

2. **Initialize custom mode state in store**:
   ```typescript
   // Add to initial state
   customMode: {
     enabled: false,
     level: 1,
     selectedCategories: ['serve-placement', 'rally-type']
   }
   ```

3. **Implement custom mode actions**:
   ```typescript
   setCustomMode: (config) => set({ customMode: config }),
   toggleCustomMode: () => set((state) => ({ 
     customMode: { ...state.customMode, enabled: !state.customMode.enabled }
   }))
   ```

**Validation Steps**:
- Import and test in a React component
- Verify state persistence
- Test toggle functionality

### Task 1.2: Create Custom Mode Configuration UI
**Priority**: High
**Estimated Time**: 3-5 hours
**Dependencies**: Task 1.1

#### Subtask 1.2.1: Create CustomModeDialog Component
**File**: `src/components/features/custom-mode-dialog.tsx`

1. **Create new component file**:
   ```typescript
   import { useState } from 'react'
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
   import { Button } from '@/components/ui/button'
   import { Switch } from '@/components/ui/switch'
   import { useMatchStore } from '@/stores/matchStore'
   
   interface CustomModeDialogProps {
     open: boolean
     onOpenChange: (open: boolean) => void
   }
   
   export function CustomModeDialog({ open, onOpenChange }: CustomModeDialogProps) {
     // Implementation here
   }
   ```

2. **Implement configuration interface**:
   - Toggle switches for each stat category
   - Level selector (1, 2, 3)
   - Time estimation display
   - Preset buttons

3. **Add preset configurations**:
   ```typescript
   const PRESETS = {
     basic: { level: 1, categories: ['serve-placement', 'rally-type'] },
     intermediate: { level: 2, categories: ['serve-placement', 'serve-speed', 'return-quality', 'rally-type'] },
     professional: { level: 3, categories: ['all'] }
   }
   ```

#### Subtask 1.2.2: Integrate Dialog into Live Scoring
**File**: `src/app/(app)/matches/live/[id]/_components/live-scoring-interface.tsx`

1. **Add custom mode button to header**:
   ```typescript
   // Add to header section
   <Button variant="outline" size="sm" onClick={() => setCustomModeOpen(true)}>
     <BarChart3 className="h-4 w-4 mr-1" />
     Custom Stats
   </Button>
   ```

2. **Add dialog state and integration**:
   ```typescript
   const [customModeOpen, setCustomModeOpen] = useState(false)
   ```

3. **Test integration**:
   - Verify dialog opens/closes correctly
   - Confirm settings persist in store
   - Test responsive design on mobile

### Task 1.3: Enhance Point Detail Sheet
**Priority**: High
**Estimated Time**: 4-6 hours
**Dependencies**: Task 1.1, 1.2

#### Subtask 1.3.1: Add Quick Context Bar
**File**: `src/app/(app)/matches/live/[id]/_components/point-detail-sheet.tsx`

1. **Create conditional sections based on custom mode**:
   ```typescript
   const { customMode } = useMatchStore()
   
   // Add after basic point outcome selection
   {customMode.enabled && (
     <div className="space-y-3">
       {/* Quick context section */}
       <div className="border-t pt-3">
         <h4 className="text-sm font-medium mb-2">Quick Context</h4>
         {/* Conditional content based on context */}
       </div>
     </div>
   )}
   ```

2. **Implement serve placement selector** (when player is serving):
   ```typescript
   {isServing && customMode.selectedCategories.includes('serve-placement') && (
     <div>
       <label className="text-xs text-muted-foreground">Serve Placement</label>
       <div className="grid grid-cols-3 gap-2 mt-1">
         <Button variant="outline" size="sm">Wide</Button>
         <Button variant="outline" size="sm">Body</Button>
         <Button variant="outline" size="sm">T</Button>
       </div>
     </div>
   )}
   ```

3. **Implement rally type selector**:
   ```typescript
   {!isServing && customMode.selectedCategories.includes('rally-type') && (
     <div>
       <label className="text-xs text-muted-foreground">Rally Type</label>
       <div className="grid grid-cols-2 gap-2 mt-1">
         <Button variant="outline" size="sm">Baseline</Button>
         <Button variant="outline" size="sm">Net Play</Button>
       </div>
     </div>
   )}
   ```

#### Subtask 1.3.2: Progressive Disclosure Implementation
**File**: Same as above

1. **Add "More Details" expandable section**:
   ```typescript
   const [showAdvanced, setShowAdvanced] = useState(false)
   
   {customMode.enabled && customMode.level >= 2 && (
     <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
       <CollapsibleTrigger asChild>
         <Button variant="ghost" size="sm" className="w-full">
           <ChevronDown className="h-4 w-4 mr-1" />
           More Details
         </Button>
       </CollapsibleTrigger>
       <CollapsibleContent>
         {/* Advanced statistics collection */}
       </CollapsibleContent>
     </Collapsible>
   )}
   ```

2. **Implement data collection and storage**:
   ```typescript
   const handleEnhancedPoint = (enhancements: Partial<EnhancedPointDetail>) => {
     // Store enhanced data with the point
     const enhancedPoint = {
       ...pointData,
       ...enhancements,
       loggingLevel: customMode.level
     }
     awardPoint(winner, enhancedPoint)
   }
   ```

**Testing Checklist**:
- [ ] Custom mode toggle works
- [ ] Quick context appears based on situation
- [ ] Progressive disclosure functions correctly
- [ ] Data saves properly to point log
- [ ] Mobile touch targets are adequate (44px minimum)

### Task 1.4: Update Match Statistics Calculation
**Priority**: Medium
**Estimated Time**: 2-3 hours
**Dependencies**: Task 1.1

#### Subtask 1.4.1: Extend Match Stats Functions
**File**: `src/lib/utils/match-stats.ts`

1. **Add enhanced statistics interface**:
   ```typescript
   export interface EnhancedMatchStats extends EnhancedMatchStats {
     serveAnalytics: {
       placementStats: Record<string, number>
       speedStats: { average: number; max: number; min: number }
       qualityStats: { average: number; distribution: number[] }
     }
     rallyAnalytics: {
       typeDistribution: Record<string, number>
       averageLength: number
       typeSuccess: Record<string, number>
     }
     customStats: Record<string, any>
   }
   ```

2. **Create enhanced calculation function**:
   ```typescript
   export function calculateEnhancedMatchStats(pointLog: EnhancedPointDetail[]): EnhancedMatchStats {
     const baseStats = calculateMatchStats(pointLog)
     
     // Calculate serve analytics
     const serveAnalytics = calculateServeAnalytics(pointLog)
     
     // Calculate rally analytics  
     const rallyAnalytics = calculateRallyAnalytics(pointLog)
     
     return {
       ...baseStats,
       serveAnalytics,
       rallyAnalytics,
       customStats: {}
     }
   }
   ```

3. **Implement individual analytics functions**:
   ```typescript
   function calculateServeAnalytics(points: EnhancedPointDetail[]) {
     // Implementation for serve placement, speed, quality analysis
   }
   
   function calculateRallyAnalytics(points: EnhancedPointDetail[]) {
     // Implementation for rally type analysis
   }
   ```

#### Subtask 1.4.2: Update Statistics Display Components
**File**: `src/app/(app)/matches/[id]/_components/match-stats.tsx`

1. **Add enhanced stats sections conditionally**:
   ```typescript
   const enhancedStats = calculateEnhancedMatchStats(pointLog)
   const hasEnhancedData = pointLog.some(p => p.loggingLevel && p.loggingLevel > '1')
   
   {hasEnhancedData && (
     <div className="space-y-4">
       <h3 className="text-lg font-semibold">Enhanced Statistics</h3>
       <EnhancedStatsDisplay stats={enhancedStats} />
     </div>
   )}
   ```

2. **Create EnhancedStatsDisplay component**:
   ```typescript
   function EnhancedStatsDisplay({ stats }: { stats: EnhancedMatchStats }) {
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <ServePlacementChart data={stats.serveAnalytics.placementStats} />
         <RallyTypeChart data={stats.rallyAnalytics.typeDistribution} />
       </div>
     )
   }
   ```

**Testing Requirements**:
- [ ] Enhanced stats calculate correctly
- [ ] Backward compatibility maintained
- [ ] Display only shows when enhanced data exists
- [ ] Charts render properly on mobile

---

## Phase 2: Core Features (Week 3-4)

### Task 2.1: Implement Level 2 Enhanced Logging
**Priority**: High
**Estimated Time**: 5-7 hours
**Dependencies**: Phase 1 complete

#### Subtask 2.1.1: Advanced Serve Statistics Collection
**File**: `src/components/features/advanced-serve-collector.tsx`

1. **Create dedicated serve statistics component**:
   ```typescript
   interface AdvancedServeCollectorProps {
     onServeStats: (stats: ServeStats) => void
     isVisible: boolean
   }
   
   export function AdvancedServeCollector({ onServeStats, isVisible }: AdvancedServeCollectorProps) {
     // Speed slider, spin selector, quality assessment
   }
   ```

2. **Implement speed estimation interface**:
   ```typescript
   // Speed slider with visual feedback
   <div className="space-y-2">
     <Label>Serve Speed</Label>
     <Slider
       value={[speed]}
       onValueChange={([value]) => setSpeed(value)}
       max={140}
       min={60}
       step={5}
       className="w-full"
     />
     <div className="flex justify-between text-xs text-muted-foreground">
       <span>Slow (60mph)</span>
       <span>Fast (140mph)</span>
     </div>
   </div>
   ```

3. **Add spin type selector**:
   ```typescript
   <div className="grid grid-cols-2 gap-2">
     {['Flat', 'Slice', 'Kick', 'Twist'].map(spin => (
       <Button
         key={spin}
         variant={selectedSpin === spin ? 'default' : 'outline'}
         size="sm"
         onClick={() => setSelectedSpin(spin)}
       >
         {spin}
       </Button>
     ))}
   </div>
   ```

#### Subtask 2.1.2: Return Analytics Collection
**File**: `src/components/features/return-analytics-collector.tsx`

1. **Create return statistics component**:
   ```typescript
   export function ReturnAnalyticsCollector({ onReturnStats, isVisible }: ReturnAnalyticsCollectorProps) {
     // Return placement, quality, type selectors
   }
   ```

2. **Implement 9-zone court selector**:
   ```typescript
   <div className="court-grid grid grid-cols-3 gap-1 aspect-[2/3] max-w-[200px] mx-auto">
     {COURT_ZONES.map(zone => (
       <Button
         key={zone.id}
         variant={selectedZone === zone.id ? 'default' : 'outline'}
         className="aspect-square text-xs"
         onClick={() => setSelectedZone(zone.id)}
       >
         {zone.label}
       </Button>
     ))}
   </div>
   ```

3. **Add return quality assessment**:
   ```typescript
   <div className="grid grid-cols-3 gap-2">
     {['Defensive', 'Neutral', 'Offensive'].map(quality => (
       <Button
         key={quality}
         variant={selectedQuality === quality ? 'default' : 'outline'}
         size="sm"
         onClick={() => setSelectedQuality(quality)}
       >
         {quality}
       </Button>
     ))}
   </div>
   ```

#### Subtask 2.1.3: Integrate Advanced Collectors
**File**: `src/app/(app)/matches/live/[id]/_components/point-detail-sheet.tsx`

1. **Add conditional rendering based on logging level**:
   ```typescript
   {customMode.level >= 2 && showAdvanced && (
     <div className="space-y-4">
       {isServing && (
         <AdvancedServeCollector 
           onServeStats={setServeStats}
           isVisible={showAdvanced}
         />
       )}
       {!isServing && (
         <ReturnAnalyticsCollector
           onReturnStats={setReturnStats}
           isVisible={showAdvanced}
         />
       )}
     </div>
   )}
   ```

2. **Combine all collected data before saving**:
   ```typescript
   const handleSavePoint = () => {
     const enhancedData = {
       ...basicPointData,
       serveStats: isServing ? serveStats : undefined,
       returnStats: !isServing ? returnStats : undefined,
       tacticalContext,
       loggingLevel: customMode.level
     }
     onSavePoint(enhancedData)
   }
   ```

### Task 2.2: Court Visualization Components
**Priority**: Medium
**Estimated Time**: 4-6 hours
**Dependencies**: Task 2.1

#### Subtask 2.2.1: Create Interactive Court Component
**File**: `src/components/features/interactive-court.tsx`

1. **Create SVG-based court component**:
   ```typescript
   interface InteractiveCourtProps {
     mode: 'serve' | 'return' | 'rally'
     onZoneSelect: (zone: string) => void
     selectedZone?: string
   }
   
   export function InteractiveCourt({ mode, onZoneSelect, selectedZone }: InteractiveCourtProps) {
     return (
       <svg viewBox="0 0 400 600" className="w-full max-w-[300px] border rounded">
         {/* Court lines and zones */}
       </svg>
     )
   }
   ```

2. **Define court zones and coordinates**:
   ```typescript
   const COURT_ZONES = {
     serve: [
       { id: 'deuce-wide', x: 50, y: 150, width: 50, height: 100, label: 'Wide' },
       { id: 'deuce-body', x: 100, y: 150, width: 50, height: 100, label: 'Body' },
       { id: 'deuce-t', x: 150, y: 150, width: 50, height: 100, label: 'T' },
       // ... more zones
     ],
     return: [
       // 9-zone return grid
     ]
   }
   ```

3. **Implement touch/click interactions**:
   ```typescript
   const handleZoneClick = (zoneId: string) => {
     onZoneSelect(zoneId)
   }
   
   // Add click handlers to zone rectangles
   <rect
     x={zone.x}
     y={zone.y}
     width={zone.width}
     height={zone.height}
     fill={selectedZone === zone.id ? '#22c55e' : 'transparent'}
     stroke="#374151"
     strokeWidth="2"
     className="cursor-pointer hover:fill-gray-100"
     onClick={() => handleZoneClick(zone.id)}
   />
   ```

#### Subtask 2.2.2: Integrate Court Visualization
**File**: Update advanced collectors to use interactive court

1. **Replace grid selectors with court visualization**:
   ```typescript
   // In AdvancedServeCollector
   <div>
     <Label>Serve Placement</Label>
     <InteractiveCourt
       mode="serve"
       onZoneSelect={setServePlacement}
       selectedZone={servePlacement}
     />
   </div>
   ```

2. **Add toggle between grid and court views**:
   ```typescript
   const [viewMode, setViewMode] = useState<'grid' | 'court'>('grid')
   
   <div className="flex justify-center mb-2">
     <Button
       variant={viewMode === 'grid' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setViewMode('grid')}
     >
       Grid
     </Button>
     <Button
       variant={viewMode === 'court' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setViewMode('court')}
     >
       Court
     </Button>
   </div>
   ```

### Task 2.3: Enhanced Analytics Engine
**Priority**: Medium
**Estimated Time**: 3-4 hours
**Dependencies**: Task 2.1

#### Subtask 2.3.1: Advanced Serve Analytics
**File**: `src/lib/utils/serve-analytics.ts`

1. **Create comprehensive serve analysis functions**:
   ```typescript
   export interface ServeAnalytics {
     placement: {
       distribution: Record<string, number>
       successRate: Record<string, number>
       averageSpeed: Record<string, number>
     }
     speed: {
       average: number
       max: number
       min: number
       distribution: { range: string; count: number }[]
     }
     spin: {
       distribution: Record<string, number>
       effectiveness: Record<string, number>
     }
     situational: {
       breakPointPerformance: ServePerformance
       setPointPerformance: ServePerformance
       matchPointPerformance: ServePerformance
     }
   }
   
   export function calculateServeAnalytics(points: EnhancedPointDetail[]): ServeAnalytics {
     // Implementation
   }
   ```

2. **Implement placement analysis**:
   ```typescript
   function analyzePlacement(servePoints: EnhancedPointDetail[]) {
     const placementStats = {}
     const successRates = {}
     
     servePoints.forEach(point => {
       if (point.serveStats?.placement) {
         const placement = point.serveStats.placement
         placementStats[placement] = (placementStats[placement] || 0) + 1
         
         // Calculate success rate (ace or serve winner)
         if (point.serveOutcome === 'ace' || point.pointOutcome === 'winner') {
           successRates[placement] = (successRates[placement] || 0) + 1
         }
       }
     })
     
     return { distribution: placementStats, successRate: successRates }
   }
   ```

3. **Add speed and spin analysis**:
   ```typescript
   function analyzeSpeed(servePoints: EnhancedPointDetail[]) {
     const speeds = servePoints
       .filter(p => p.serveStats?.speed)
       .map(p => p.serveStats!.speed!)
     
     return {
       average: speeds.reduce((a, b) => a + b, 0) / speeds.length,
       max: Math.max(...speeds),
       min: Math.min(...speeds),
       distribution: createSpeedDistribution(speeds)
     }
   }
   ```

#### Subtask 2.3.2: Return Analytics Engine
**File**: `src/lib/utils/return-analytics.ts`

1. **Create return analysis functions**:
   ```typescript
   export interface ReturnAnalytics {
     placement: {
       zones: Record<string, number>
       successRate: Record<string, number>
     }
     quality: {
       distribution: Record<string, number>
       effectiveness: Record<string, number>
     }
     contextual: {
       firstServeReturns: ReturnPerformance
       secondServeReturns: ReturnPerformance
       pressureReturns: ReturnPerformance
     }
   }
   ```

2. **Implement return placement analysis**:
   ```typescript
   function analyzeReturnPlacement(returnPoints: EnhancedPointDetail[]) {
     // Similar to serve placement but for returns
   }
   ```

3. **Add quality assessment analytics**:
   ```typescript
   function analyzeReturnQuality(returnPoints: EnhancedPointDetail[]) {
     // Analyze defensive vs neutral vs offensive returns
   }
   ```

**Testing Requirements**:
- [ ] Analytics calculate correctly with sample data
- [ ] Performance acceptable with large datasets (>1000 points)
- [ ] Edge cases handled (missing data, invalid values)
- [ ] Results match expected tennis logic

---

## Phase 3: Advanced Analytics (Week 5-6)

### Task 3.1: Level 3 Professional Analysis
**Priority**: Medium
**Estimated Time**: 6-8 hours
**Dependencies**: Phase 2 complete

#### Subtask 3.1.1: Shot-by-Shot Rally Tracking
**File**: `src/components/features/rally-shot-tracker.tsx`

1. **Create rally progression interface**:
   ```typescript
   interface RallyShotTrackerProps {
     onRallyComplete: (shots: RallyShot[]) => void
     rallyLength: number
   }
   
   export function RallyShotTracker({ onRallyComplete, rallyLength }: RallyShotTrackerProps) {
     const [shots, setShots] = useState<RallyShot[]>([])
     const [currentShot, setCurrentShot] = useState(1)
     
     // Implementation for shot-by-shot tracking
   }
   ```

2. **Implement shot type selector with court positioning**:
   ```typescript
   <div className="space-y-4">
     <div>
       <Label>Shot {currentShot} - {currentPlayer}</Label>
       <div className="grid grid-cols-3 gap-2">
         {SHOT_TYPES.map(type => (
           <Button
             key={type}
             variant={selectedShotType === type ? 'default' : 'outline'}
             size="sm"
             onClick={() => setSelectedShotType(type)}
           >
             {type}
           </Button>
         ))}
       </div>
     </div>
     
     <InteractiveCourt
       mode="rally"
       onZoneSelect={setShotPlacement}
       selectedZone={shotPlacement}
     />
   </div>
   ```

3. **Add shot quality and context selectors**:
   ```typescript
   <div className="grid grid-cols-3 gap-2">
     <Button
       variant={shotQuality === 'defensive' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setShotQuality('defensive')}
     >
       Defensive
     </Button>
     <Button
       variant={shotQuality === 'neutral' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setShotQuality('neutral')}
     >
       Neutral
     </Button>
     <Button
       variant={shotQuality === 'offensive' ? 'default' : 'outline'}
       size="sm"
       onClick={() => setShotQuality('offensive')}
     >
       Offensive
     </Button>
   </div>
   ```

#### Subtask 3.1.2: Pattern Recognition System
**File**: `src/lib/utils/pattern-recognition.ts`

1. **Create pattern detection algorithms**:
   ```typescript
   export interface TacticalPattern {
     id: string
     name: string
     description: string
     frequency: number
     successRate: number
     context: string[]
   }
   
   export function detectTacticalPatterns(matches: Match[]): TacticalPattern[] {
     const patterns = []
     
     // Detect serve patterns
     patterns.push(...detectServePatterns(matches))
     
     // Detect return patterns
     patterns.push(...detectReturnPatterns(matches))
     
     // Detect rally patterns
     patterns.push(...detectRallyPatterns(matches))
     
     return patterns
   }
   ```

2. **Implement serve pattern detection**:
   ```typescript
   function detectServePatterns(matches: Match[]): TacticalPattern[] {
     const patterns = []
     
     // Wide serve on deuce court pattern
     const wideDeuce = analyzeServeSequence(matches, ['deuce-wide'])
     if (wideDeuce.frequency > 0.3) {
       patterns.push({
         id: 'wide-deuce-tendency',
         name: 'Wide Deuce Tendency',
         description: 'Frequently serves wide on deuce court',
         frequency: wideDeuce.frequency,
         successRate: wideDeuce.successRate,
         context: ['serve', 'deuce-court']
       })
     }
     
     return patterns
   }
   ```

3. **Add opponent analysis functions**:
   ```typescript
   export function analyzeOpponentTendencies(playerMatches: Match[], opponentId: string) {
     const opponentMatches = playerMatches.filter(m => 
       m.playerOneId === opponentId || m.playerTwoId === opponentId
     )
     
     return {
       servePatterns: detectServePatterns(opponentMatches),
       returnPatterns: detectReturnPatterns(opponentMatches),
       weaknesses: identifyWeaknesses(opponentMatches),
       strengths: identifyStrengths(opponentMatches)
     }
   }
   ```

### Task 3.2: Advanced Analytics Dashboard
**Priority**: Medium
**Estimated Time**: 5-7 hours
**Dependencies**: Task 3.1

#### Subtask 3.2.1: Create Analytics Dashboard Component
**File**: `src/components/features/advanced-analytics-dashboard.tsx`

1. **Create comprehensive dashboard layout**:
   ```typescript
   export function AdvancedAnalyticsDashboard({ matchId }: { matchId: string }) {
     const [activeTab, setActiveTab] = useState('overview')
     
     return (
       <div className="space-y-6">
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="overview">Overview</TabsTrigger>
             <TabsTrigger value="serve">Serve</TabsTrigger>
             <TabsTrigger value="return">Return</TabsTrigger>
             <TabsTrigger value="patterns">Patterns</TabsTrigger>
           </TabsList>
           
           <TabsContent value="overview">
             <AnalyticsOverview matchId={matchId} />
           </TabsContent>
           
           <TabsContent value="serve">
             <ServeAnalyticsView matchId={matchId} />
           </TabsContent>
           
           <TabsContent value="return">
             <ReturnAnalyticsView matchId={matchId} />
           </TabsContent>
           
           <TabsContent value="patterns">
             <PatternAnalysisView matchId={matchId} />
           </TabsContent>
         </Tabs>
       </div>
     )
   }
   ```

2. **Implement individual analytics views**:
   ```typescript
   function ServeAnalyticsView({ matchId }: { matchId: string }) {
     const analytics = useServeAnalytics(matchId)
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card>
           <CardHeader>
             <CardTitle>Serve Placement</CardTitle>
           </CardHeader>
           <CardContent>
             <ServePlacementHeatmap data={analytics.placement} />
           </CardContent>
         </Card>
         
         <Card>
           <CardHeader>
             <CardTitle>Speed Distribution</CardTitle>
           </CardHeader>
           <CardContent>
             <SpeedDistributionChart data={analytics.speed} />
           </CardContent>
         </Card>
       </div>
     )
   }
   ```

#### Subtask 3.2.2: Create Data Visualization Components
**File**: `src/components/features/tennis-charts.tsx`

1. **Create serve placement heatmap**:
   ```typescript
   export function ServePlacementHeatmap({ data }: { data: Record<string, number> }) {
     return (
       <div className="relative">
         <svg viewBox="0 0 400 600" className="w-full">
           {/* Court outline */}
           <rect x="50" y="50" width="300" height="500" fill="none" stroke="#374151" strokeWidth="2" />
           
           {/* Service boxes */}
           <rect x="50" y="200" width="150" height="150" fill="none" stroke="#374151" strokeWidth="1" />
           <rect x="200" y="200" width="150" height="150" fill="none" stroke="#374151" strokeWidth="1" />
           
           {/* Heatmap zones */}
           {Object.entries(SERVE_ZONES).map(([zone, coords]) => {
             const intensity = data[zone] || 0
             const opacity = Math.min(intensity / Math.max(...Object.values(data)), 1)
             
             return (
               <rect
                 key={zone}
                 x={coords.x}
                 y={coords.y}
                 width={coords.width}
                 height={coords.height}
                 fill={`rgba(34, 197, 94, ${opacity})`}
                 stroke="#22c55e"
                 strokeWidth="1"
               />
             )
           })}
         </svg>
       </div>
     )
   }
   ```

2. **Create speed distribution chart**:
   ```typescript
   export function SpeedDistributionChart({ data }: { data: { range: string; count: number }[] }) {
     return (
       <ResponsiveContainer width="100%" height={300}>
         <BarChart data={data}>
           <CartesianGrid strokeDasharray="3 3" />
           <XAxis dataKey="range" />
           <YAxis />
           <Tooltip />
           <Bar dataKey="count" fill="#22c55e" />
         </BarChart>
       </ResponsiveContainer>
     )
   }
   ```

3. **Create pattern analysis visualization**:
   ```typescript
   export function PatternAnalysisChart({ patterns }: { patterns: TacticalPattern[] }) {
     return (
       <div className="space-y-4">
         {patterns.map(pattern => (
           <Card key={pattern.id}>
             <CardContent className="pt-4">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-medium">{pattern.name}</h4>
                   <p className="text-sm text-muted-foreground">{pattern.description}</p>
                 </div>
                 <div className="text-right">
                   <div className="text-lg font-bold">{(pattern.frequency * 100).toFixed(1)}%</div>
                   <div className="text-sm text-muted-foreground">Frequency</div>
                 </div>
               </div>
               <div className="mt-2 bg-muted rounded-full h-2">
                 <div 
                   className="bg-primary h-2 rounded-full transition-all"
                   style={{ width: `${pattern.successRate * 100}%` }}
                 />
               </div>
               <div className="text-xs text-muted-foreground mt-1">
                 {(pattern.successRate * 100).toFixed(1)}% success rate
               </div>
             </CardContent>
           </Card>
         ))}
       </div>
     )
   }
   ```

### Task 3.3: Data Export and Sharing
**Priority**: Low
**Estimated Time**: 3-4 hours
**Dependencies**: Task 3.2

#### Subtask 3.3.1: Export Functionality
**File**: `src/lib/utils/data-export.ts`

1. **Create export functions for different formats**:
   ```typescript
   export async function exportMatchData(matchId: string, format: 'json' | 'csv' | 'pdf') {
     const match = await getMatch(matchId)
     const analytics = calculateEnhancedMatchStats(match.pointLog)
     
     switch (format) {
       case 'json':
         return exportAsJSON(match, analytics)
       case 'csv':
         return exportAsCSV(match, analytics)
       case 'pdf':
         return exportAsPDF(match, analytics)
     }
   }
   ```

2. **Implement CSV export for point-by-point data**:
   ```typescript
   function exportAsCSV(match: Match, analytics: EnhancedMatchStats): string {
     const headers = [
       'Point Number', 'Set', 'Game', 'Score', 'Winner', 'Server',
       'Point Outcome', 'Serve Type', 'Serve Placement', 'Serve Speed',
       'Rally Length', 'Rally Type', 'Tactical Context'
     ]
     
     const rows = match.pointLog.map(point => [
       point.pointNumber,
       point.setNumber,
       point.gameNumber,
       point.gameScore,
       point.winner,
       point.server,
       point.pointOutcome,
       point.serveType,
       point.serveStats?.placement || '',
       point.serveStats?.speed || '',
       point.rallyLength,
       point.tacticalContext?.rallyType || '',
       point.tacticalContext?.pressureSituation ? 'Pressure' : 'Normal'
     ])
     
     return [headers, ...rows].map(row => row.join(',')).join('\n')
   }
   ```

3. **Add export UI to analytics dashboard**:
   ```typescript
   // Add to AdvancedAnalyticsDashboard
   <div className="flex gap-2">
     <Button variant="outline" onClick={() => exportData('json')}>
       Export JSON
     </Button>
     <Button variant="outline" onClick={() => exportData('csv')}>
       Export CSV
     </Button>
     <Button variant="outline" onClick={() => exportData('pdf')}>
       Export PDF
     </Button>
   </div>
   ```

**Testing Checklist for Phase 3**:
- [ ] Shot-by-shot tracking works smoothly
- [ ] Pattern recognition identifies valid patterns
- [ ] Analytics dashboard loads without performance issues
- [ ] Charts render correctly on all device sizes
- [ ] Export functions generate valid data files
- [ ] All features work offline

---

## Phase 4: Optimization & Polish (Week 7-8)

### Task 4.1: Performance Optimization
**Priority**: Critical
**Estimated Time**: 4-6 hours
**Dependencies**: All previous phases

#### Subtask 4.1.1: Database Query Optimization
**File**: `src/lib/actions/matches.ts`

1. **Optimize match data fetching**:
   ```typescript
   export async function getMatchWithAnalytics(matchId: string, includeAdvanced: boolean = false) {
     const query = database.getDocument('matches', matchId)
     
     if (!includeAdvanced) {
       // Only fetch basic match data
       return query.select(['basic_fields'])
     }
     
     // Fetch with advanced analytics
     return query.select(['*'])
   }
   ```

2. **Implement lazy loading for analytics**:
   ```typescript
   export async function getMatchAnalytics(matchId: string, category?: string) {
     const match = await database.getDocument('matches', matchId)
     
     // Calculate only requested analytics category
     if (category) {
       return calculateSpecificAnalytics(match.pointLog, category)
     }
     
     return calculateEnhancedMatchStats(match.pointLog)
   }
   ```

3. **Add caching for computed statistics**:
   ```typescript
   const analyticsCache = new Map<string, { data: any; timestamp: number }>()
   
   export function getCachedAnalytics(matchId: string, category: string) {
     const cacheKey = `${matchId}-${category}`
     const cached = analyticsCache.get(cacheKey)
     
     if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes
       return cached.data
     }
     
     const fresh = calculateAnalytics(matchId, category)
     analyticsCache.set(cacheKey, { data: fresh, timestamp: Date.now() })
     return fresh
   }
   ```

#### Subtask 4.1.2: UI Performance Optimization
**File**: Various component files

1. **Implement React.memo for expensive components**:
   ```typescript
   // In tennis-charts.tsx
   export const ServePlacementHeatmap = React.memo(({ data }: { data: Record<string, number> }) => {
     // Component implementation
   })
   
   export const SpeedDistributionChart = React.memo(({ data }: { data: any }) => {
     // Component implementation
   })
   ```

2. **Add virtual scrolling for large datasets**:
   ```typescript
   // For point-by-point view with many points
   import { FixedSizeList as List } from 'react-window'
   
   function PointByPointView({ points }: { points: PointDetail[] }) {
     const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
       <div style={style}>
         <PointRow point={points[index]} />
       </div>
     )
     
     return (
       <List
         height={400}
         itemCount={points.length}
         itemSize={60}
         itemData={points}
       >
         {Row}
       </List>
     )
   }
   ```

3. **Optimize re-renders with useCallback**:
   ```typescript
   // In live scoring components
   const handlePointAward = useCallback((winner: 'p1' | 'p2', details: Partial<PointDetail>) => {
     awardPoint(winner, details)
   }, [awardPoint])
   
   const handleAdvancedStats = useCallback((stats: EnhancedStats) => {
     setEnhancedStats(stats)
   }, [])
   ```

### Task 4.2: Voice Input Integration
**Priority**: Medium
**Estimated Time**: 5-7 hours
**Dependencies**: Task 4.1

#### Subtask 4.2.1: Voice Recognition Setup
**File**: `src/hooks/use-voice-input.ts`

1. **Create voice input hook**:
   ```typescript
   export function useVoiceInput() {
     const [isListening, setIsListening] = useState(false)
     const [transcript, setTranscript] = useState('')
     const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
     
     useEffect(() => {
       if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
         const recognitionInstance = new SpeechRecognition()
         
         recognitionInstance.continuous = false
         recognitionInstance.interimResults = false
         recognitionInstance.lang = 'en-US'
         
         recognitionInstance.onresult = (event) => {
           const transcript = event.results[0][0].transcript
           setTranscript(transcript)
           parseVoiceCommand(transcript)
         }
         
         setRecognition(recognitionInstance)
       }
     }, [])
     
     const startListening = () => {
       if (recognition) {
         recognition.start()
         setIsListening(true)
       }
     }
     
     const stopListening = () => {
       if (recognition) {
         recognition.stop()
         setIsListening(false)
       }
     }
     
     return { isListening, transcript, startListening, stopListening }
   }
   ```

2. **Implement voice command parsing**:
   ```typescript
   function parseVoiceCommand(transcript: string): VoiceCommand | null {
     const lowerTranscript = transcript.toLowerCase()
     
     // Serve commands
     if (lowerTranscript.includes('ace')) {
       if (lowerTranscript.includes('wide')) return { type: 'serve', outcome: 'ace', placement: 'wide' }
       if (lowerTranscript.includes('body')) return { type: 'serve', outcome: 'ace', placement: 'body' }
       if (lowerTranscript.includes('t')) return { type: 'serve', outcome: 'ace', placement: 't' }
       return { type: 'serve', outcome: 'ace' }
     }
     
     // Winner commands
     if (lowerTranscript.includes('winner')) {
       if (lowerTranscript.includes('forehand')) return { type: 'rally', outcome: 'winner', shot: 'forehand' }
       if (lowerTranscript.includes('backhand')) return { type: 'rally', outcome: 'winner', shot: 'backhand' }
       return { type: 'rally', outcome: 'winner' }
     }
     
     // Error commands
     if (lowerTranscript.includes('unforced error') || lowerTranscript.includes('error')) {
       return { type: 'rally', outcome: 'unforced_error' }
     }
     
     return null
   }
   ```

#### Subtask 4.2.2: Voice Integration in Live Scoring
**File**: `src/app/(app)/matches/live/[id]/_components/live-scoring-interface.tsx`

1. **Add voice input button**:
   ```typescript
   const { isListening, startListening, stopListening } = useVoiceInput()
   
   // Add to header controls
   <Button
     variant={isListening ? 'default' : 'outline'}
     size="sm"
     onClick={isListening ? stopListening : startListening}
     className={isListening ? 'animate-pulse' : ''}
   >
     <Mic className="h-4 w-4 mr-1" />
     {isListening ? 'Listening...' : 'Voice'}
   </Button>
   ```

2. **Handle voice commands**:
   ```typescript
   useEffect(() => {
     if (voiceCommand) {
       handleVoiceCommand(voiceCommand)
     }
   }, [voiceCommand])
   
   const handleVoiceCommand = (command: VoiceCommand) => {
     switch (command.type) {
       case 'serve':
         awardPoint(currentServer, {
           pointOutcome: command.outcome,
           serveStats: { placement: command.placement }
         })
         break
       case 'rally':
         // Determine winner based on context
         const winner = determineWinnerFromContext(command)
         awardPoint(winner, {
           pointOutcome: command.outcome,
           lastShotType: command.shot
         })
         break
     }
   }
   ```

### Task 4.3: Advanced Sharing Features
**Priority**: Low
**Estimated Time**: 3-4 hours
**Dependencies**: Task 4.2

#### Subtask 4.3.1: Enhanced Match Sharing
**File**: `src/components/features/advanced-match-sharing.tsx`

1. **Create sharing options component**:
   ```typescript
   export function AdvancedMatchSharing({ matchId }: { matchId: string }) {
     const [shareOptions, setShareOptions] = useState({
       includeAdvancedStats: true,
       includeCharts: true,
       includePatterns: false,
       format: 'web' as 'web' | 'image' | 'pdf'
     })
     
     return (
       <Dialog>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Share Match</DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Share Options</Label>
               <div className="space-y-2">
                 <div className="flex items-center space-x-2">
                   <Checkbox 
                     checked={shareOptions.includeAdvancedStats}
                     onCheckedChange={(checked) => 
                       setShareOptions(prev => ({ ...prev, includeAdvancedStats: checked as boolean }))
                     }
                   />
                   <Label>Include Advanced Statistics</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Checkbox 
                     checked={shareOptions.includeCharts}
                     onCheckedChange={(checked) => 
                       setShareOptions(prev => ({ ...prev, includeCharts: checked as boolean }))
                     }
                   />
                   <Label>Include Charts</Label>
                 </div>
               </div>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     )
   }
   ```

2. **Generate shareable match summaries**:
   ```typescript
   export async function generateMatchSummary(matchId: string, options: ShareOptions) {
     const match = await getMatch(matchId)
     const analytics = await getMatchAnalytics(matchId)
     
     if (options.format === 'image') {
       return generateMatchImageSummary(match, analytics, options)
     }
     
     if (options.format === 'pdf') {
       return generateMatchPDFSummary(match, analytics, options)
     }
     
     return generateWebSummary(match, analytics, options)
   }
   ```

#### Subtask 4.3.2: Social Media Integration
**File**: `src/lib/utils/social-sharing.ts`

1. **Create social media sharing functions**:
   ```typescript
   export function shareToTwitter(matchSummary: string, imageUrl?: string) {
     const text = encodeURIComponent(matchSummary)
     const url = `https://twitter.com/intent/tweet?text=${text}`
     
     if (imageUrl) {
       window.open(`${url}&url=${encodeURIComponent(imageUrl)}`, '_blank')
     } else {
       window.open(url, '_blank')
     }
   }
   
   export function shareToInstagram(imageUrl: string) {
     // Copy image URL to clipboard for Instagram sharing
     navigator.clipboard.writeText(imageUrl)
     alert('Image URL copied to clipboard. You can now paste it in Instagram.')
   }
   ```

2. **Generate match highlight graphics**:
   ```typescript
   export async function generateMatchHighlight(match: Match, analytics: EnhancedMatchStats): Promise<string> {
     // Use canvas to generate a highlight image
     const canvas = document.createElement('canvas')
     const ctx = canvas.getContext('2d')!
     
     canvas.width = 1080
     canvas.height = 1080
     
     // Draw match score
     ctx.font = 'bold 48px Arial'
     ctx.fillStyle = '#000'
     ctx.fillText(`${match.finalScore}`, 50, 100)
     
     // Draw key statistics
     ctx.font = '24px Arial'
     ctx.fillText(`Aces: ${analytics.acesByPlayer[0]} - ${analytics.acesByPlayer[1]}`, 50, 200)
     ctx.fillText(`Winners: ${analytics.winnersByPlayer[0]} - ${analytics.winnersByPlayer[1]}`, 50, 250)
     
     // Convert to blob URL
     return new Promise(resolve => {
       canvas.toBlob(blob => {
         if (blob) {
           resolve(URL.createObjectURL(blob))
         }
       })
     })
   }
   ```

### Task 4.4: Final Testing & Quality Assurance
**Priority**: Critical
**Estimated Time**: 6-8 hours
**Dependencies**: All previous tasks

#### Subtask 4.4.1: Comprehensive Testing Suite
**File**: `src/__tests__/advanced-stats.test.ts`

1. **Create test suite for enhanced statistics**:
   ```typescript
   describe('Advanced Tennis Statistics', () => {
     describe('Enhanced Point Detail Schema', () => {
       it('should validate enhanced point details', () => {
         const validPoint = {
           // ... basic point fields
           serveStats: {
             speed: 120,
             placement: 'deuce-wide',
             spin: 'flat',
             quality: 8
           },
           loggingLevel: '2'
         }
         
         expect(pointDetailSchema.parse(validPoint)).toBeDefined()
       })
       
       it('should handle missing enhanced fields', () => {
         const basicPoint = {
           // ... only basic point fields
         }
         
         expect(pointDetailSchema.parse(basicPoint)).toBeDefined()
       })
     })
     
     describe('Statistics Calculations', () => {
       it('should calculate serve analytics correctly', () => {
         const mockPoints = createMockEnhancedPoints()
         const analytics = calculateServeAnalytics(mockPoints)
         
         expect(analytics.placement.distribution).toBeDefined()
         expect(analytics.speed.average).toBeGreaterThan(0)
       })
     })
   })
   ```

2. **Integration tests for custom mode**:
   ```typescript
   describe('Custom Mode Integration', () => {
     it('should enable and configure custom mode', () => {
       const { result } = renderHook(() => useMatchStore())
       
       act(() => {
         result.current.setCustomMode({
           enabled: true,
           level: 2,
           selectedCategories: ['serve-placement', 'return-quality']
         })
       })
       
       expect(result.current.customMode.enabled).toBe(true)
       expect(result.current.customMode.level).toBe(2)
     })
   })
   ```

#### Subtask 4.4.2: Performance Testing
**File**: `src/__tests__/performance.test.ts`

1. **Test with large datasets**:
   ```typescript
   describe('Performance Tests', () => {
     it('should handle 1000+ point matches efficiently', async () => {
       const largeMatch = createMockMatch(1000) // 1000 points
       
       const startTime = performance.now()
       const stats = calculateEnhancedMatchStats(largeMatch.pointLog)
       const endTime = performance.now()
       
       expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second
       expect(stats).toBeDefined()
     })
     
     it('should maintain UI responsiveness during statistics calculation', async () => {
       // Test that UI doesn't freeze during heavy calculations
     })
   })
   ```

#### Subtask 4.4.3: Mobile Testing Checklist

1. **Touch interactions**:
   - [ ] All buttons are at least 44px touch targets
   - [ ] Swipe gestures work correctly
   - [ ] Voice input button is easily accessible
   - [ ] Court visualization responds to touch accurately

2. **Performance on mobile**:
   - [ ] App loads in under 3 seconds on 3G
   - [ ] Statistics calculations don't block UI
   - [ ] Charts render smoothly on mobile devices
   - [ ] Voice recognition works reliably

3. **Offline functionality**:
   - [ ] Enhanced statistics work offline
   - [ ] Data syncs when connection restored
   - [ ] No data loss during network interruptions

#### Subtask 4.4.4: User Acceptance Testing
**File**: Create user testing checklist

1. **New user experience**:
   - [ ] Can discover and enable custom mode easily
   - [ ] Configuration wizard is intuitive
   - [ ] Basic scoring remains unchanged
   - [ ] Help/tutorial is accessible

2. **Power user experience**:
   - [ ] All professional statistics available
   - [ ] Export functionality works as expected
   - [ ] Analytics provide actionable insights
   - [ ] Performance meets expectations

3. **Upgrade experience**:
   - [ ] Existing matches continue to work
   - [ ] No data loss during upgrade
   - [ ] New features don't interfere with existing workflows

---

## Final Validation & Deployment

### Pre-Deployment Checklist

#### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint passes with zero warnings
- [ ] All tests pass (unit, integration, performance)
- [ ] Code coverage above 80% for new features

#### Functionality
- [ ] Basic tennis scoring unchanged and working
- [ ] Custom mode toggle works correctly
- [ ] All three logging levels function properly
- [ ] Enhanced statistics calculate accurately
- [ ] Voice input recognizes common commands
- [ ] Export functionality generates valid files

#### Performance
- [ ] App loads in under 3 seconds
- [ ] Statistics calculation under 2 seconds
- [ ] UI remains responsive during heavy operations
- [ ] Memory usage stays within acceptable limits

#### Compatibility
- [ ] Works on iOS Safari (latest 2 versions)
- [ ] Works on Android Chrome (latest 2 versions)
- [ ] Backward compatible with existing data
- [ ] Offline functionality operational

#### User Experience
- [ ] Onboarding flow for new features
- [ ] Help documentation updated
- [ ] Error handling graceful and informative
- [ ] Accessibility guidelines met (WCAG 2.1 AA)

### Deployment Steps

1. **Feature flag activation**:
   ```typescript
   // Enable for beta users first
   const ADVANCED_STATS_ENABLED = process.env.NEXT_PUBLIC_ADVANCED_STATS === 'true'
   ```

2. **Database migration**:
   ```bash
   # Run migration scripts for enhanced schemas
   npm run migrate:advanced-stats
   ```

3. **Monitoring setup**:
   - Performance monitoring for statistics calculations
   - Error tracking for voice input
   - Usage analytics for custom mode adoption

4. **Gradual rollout**:
   - Week 1: Internal testing (5% of users)
   - Week 2: Beta testing (25% of users)
   - Week 3: Full rollout (100% of users)

### Post-Deployment Monitoring

#### Key Metrics to Track
- Custom mode adoption rate
- Average statistics calculation time
- Voice input accuracy rate
- User retention with advanced features
- Performance impact on basic scoring

#### Success Criteria
- Custom mode adoption > 25% within 30 days
- Zero breaking changes to basic functionality
- Performance degradation < 5%
- User satisfaction score > 4.5/5
- Voice input accuracy > 90%

---

## Maintenance & Future Enhancements

### Ongoing Maintenance Tasks

1. **Data cleanup**: Regular cleanup of incomplete enhanced data
2. **Performance optimization**: Monitor and optimize slow queries
3. **User feedback integration**: Regular feature refinements based on usage
4. **Bug fixes**: Address issues as they arise

### Future Enhancement Opportunities

1. **AI coaching insights**: Machine learning-powered recommendations
2. **Video integration**: Sync statistics with match video
3. **Tournament management**: Multi-match tournament analytics
4. **Professional integration**: ATP/WTA style reporting
5. **Wearable integration**: Heart rate and fitness data

---

This implementation workflow provides a comprehensive, step-by-step guide for implementing advanced tennis statistics while maintaining the app's core strengths in simplicity and reliability. Each task is designed to be executed independently with clear success criteria and testing requirements.