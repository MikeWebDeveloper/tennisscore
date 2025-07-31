import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Settings, BarChart3, Loader2, Rabbit, Trophy } from 'lucide-react'

// Enhanced Stats Display skeleton
const EnhancedStatsDisplaySkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <Skeleton className="h-6 w-36" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Visual representations */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
        
        {/* Additional insights */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Nemesis Bunny Stats skeleton
const NemesisBunnyStatsSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Rabbit className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Nemesis section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        
        {/* Bunny section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        
        {/* Stats comparison */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Custom Mode Dialog skeleton
const CustomModeDialogSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      <div className="space-y-4">
        {/* Custom settings */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
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

// Button loading states
const FeatureButtonLoading = ({ children, variant = "default", ...props }: any) => (
  <Button variant={variant} {...props} disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children}
  </Button>
)

// Lazy load Enhanced Stats Display
export const LazyEnhancedStatsDisplay = dynamic(
  () => import('./enhanced-stats-display').then(mod => ({ default: mod.EnhancedStatsDisplay })),
  {
    loading: () => <EnhancedStatsDisplaySkeleton />,
    ssr: false
  }
)

// Lazy load Nemesis Bunny Stats
export const LazyNemesisBunnyStats = dynamic(
  () => import('./nemesis-bunny-stats').then(mod => ({ default: mod.NemesisBunnyStats })),
  {
    loading: () => <NemesisBunnyStatsSkeleton />,
    ssr: false
  }
)

// Lazy load Custom Mode Dialog
export const LazyCustomModeDialog = dynamic(
  () => import('./custom-mode-dialog').then(mod => ({ default: mod.CustomModeDialog })),
  {
    loading: () => <CustomModeDialogSkeleton isOpen={false} onClose={() => {}} />,
    ssr: false
  }
)

// Lazy load Advanced Serve Collector
export const LazyAdvancedServeCollector = dynamic(
  () => import('./advanced-serve-collector').then(mod => ({ default: mod.AdvancedServeCollector })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
)

// Lazy load Return Analytics Collector
export const LazyReturnAnalyticsCollector = dynamic(
  () => import('./return-analytics-collector').then(mod => ({ default: mod.ReturnAnalyticsCollector })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-36" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
)

// Export skeletons for reuse
export {
  EnhancedStatsDisplaySkeleton,
  NemesisBunnyStatsSkeleton,
  CustomModeDialogSkeleton,
  FeatureButtonLoading
}