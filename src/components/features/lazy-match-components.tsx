import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Settings, 
  Timer, 
  Target, 
  BarChart3,
  Loader2,
  Trash2,
  Sheet,
  Users
} from 'lucide-react'

// Match Settings Dialog skeleton
const MatchSettingsDialogSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="space-y-4">
        {/* Settings sections */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-2 mt-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  </div>
)

// Simple Stats Popup skeleton
const SimpleStatsPopupSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      
      <div className="space-y-4">
        {/* Quick stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Mini chart */}
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
)

// Match Timer Display skeleton
const MatchTimerDisplaySkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-center space-x-2">
        <Timer className="h-4 w-4" />
        <Skeleton className="h-6 w-20" />
      </div>
    </CardContent>
  </Card>
)

// Point Detail Sheet skeleton
const PointDetailSheetSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div className="fixed inset-y-0 right-0 bg-background border-l w-96 z-50 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Sheet className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
    
    <div className="space-y-6">
      {/* Point details */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Shot sequence */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 border rounded">
              <Skeleton className="h-6 w-6" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Serve Selection skeleton
const ServeSelectionSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Delete Match Button skeleton
const DeleteMatchButtonSkeleton = () => (
  <Button variant="destructive" disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Delete Match
  </Button>
)

// Ultra Simple Point Logger skeleton  
const UltraSimplePointLoggerSkeleton = () => (
  <div className="space-y-4">
    {/* Score display */}
    <Card>
      <CardContent className="p-4 text-center">
        <div className="flex items-center justify-center space-x-8">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
          <Play className="h-6 w-6" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Action buttons */}
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
)

// Export placeholder for LazyMatchStats (defined in separate file)
export const LazyMatchStats = dynamic(
  () => import('@/app/[locale]/(app)/matches/[id]/_components/match-stats').then(mod => ({ default: mod.MatchStatsComponent })),
  {
    loading: () => <div>Loading match stats...</div>,
    ssr: false
  }
)

export const LazyPointByPointView = dynamic(
  () => import('@/app/[locale]/(app)/matches/[id]/_components/point-by-point-view').then(mod => ({ default: mod.PointByPointView })),
  {
    loading: () => <div>Loading point-by-point view...</div>,
    ssr: false
  }
)

export const LazyLiveScoringInterface = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/live-scoring-interface').then(mod => ({ default: mod.LiveScoringInterface })),
  {
    loading: () => <div>Loading live scoring...</div>,
    ssr: false
  }
)

// Note: CompactScoringInterface doesn't exist in the file
// export const LazyCompactScoringInterface = dynamic(
//   () => import('@/app/[locale]/(app)/matches/live/[id]/_components/live-scoring-interface').then(mod => ({ default: mod.CompactScoringInterface })),
//   {  
//     loading: () => <div>Loading compact scoring...</div>,
//     ssr: false
//   }
// )

// Lazy load match components
export const LazyMatchSettingsDialog = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/match-settings-dialog').then(mod => ({ default: mod.MatchSettingsDialog })),
  {
    loading: () => <MatchSettingsDialogSkeleton isOpen={false} onClose={() => {}} />,
    ssr: false
  }
)

export const LazySimpleStatsPopup = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/simple-stats-popup').then(mod => ({ default: mod.SimpleStatsPopup })),
  {
    loading: () => <SimpleStatsPopupSkeleton isOpen={false} onClose={() => {}} />,
    ssr: false
  }
)

export const LazyMatchTimerDisplay = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/MatchTimerDisplay').then(mod => ({ default: mod.MatchTimerDisplay })),
  {
    loading: () => <MatchTimerDisplaySkeleton />,
    ssr: false
  }
)

export const LazyPointDetailSheet = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/point-detail-sheet').then(mod => ({ default: mod.PointDetailSheet })),
  {
    loading: () => <PointDetailSheetSkeleton isOpen={false} onClose={() => {}} />,
    ssr: false
  }
)

export const LazyServeSelection = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/serve-selection').then(mod => ({ default: mod.ServeSelection })),
  {
    loading: () => <ServeSelectionSkeleton />,
    ssr: false
  }
)

export const LazyDeleteMatchButton = dynamic(
  () => import('@/app/[locale]/(app)/matches/[id]/_components/delete-match-button').then(mod => ({ default: mod.DeleteMatchButton })),
  {
    loading: () => <DeleteMatchButtonSkeleton />,
    ssr: false
  }
)

export const LazyUltraSimplePointLogger = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/ultra-simple-point-logger').then(mod => ({ default: mod.UltraSimplePointLogger })),
  {
    loading: () => <UltraSimplePointLoggerSkeleton />,
    ssr: false
  }
)

export const LazyIntuitivePointLogger = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/intuitive-point-logger').then(mod => ({ default: mod.IntuitivePointLogger })),
  {
    loading: () => <UltraSimplePointLoggerSkeleton />, // Reuse skeleton
    ssr: false
  }
)

// Add skeleton placeholders for the main components  
const MatchStatsSkeleton = () => <div>Loading match stats...</div>
const PointByPointSkeleton = () => <div>Loading point-by-point view...</div> 
const LiveScoringInterfaceSkeleton = () => <div>Loading live scoring...</div>
const CompactScoringInterfaceSkeleton = () => <div>Loading compact scoring...</div>

// Export skeletons for reuse
export {
  MatchSettingsDialogSkeleton,
  SimpleStatsPopupSkeleton,
  MatchTimerDisplaySkeleton,
  PointDetailSheetSkeleton,
  ServeSelectionSkeleton,
  DeleteMatchButtonSkeleton,
  UltraSimplePointLoggerSkeleton,
  MatchStatsSkeleton,
  PointByPointSkeleton,
  LiveScoringInterfaceSkeleton,
  CompactScoringInterfaceSkeleton
}