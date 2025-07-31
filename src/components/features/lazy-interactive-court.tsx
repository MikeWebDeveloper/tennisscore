import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Loader2 } from 'lucide-react'

// Interactive Court loading skeleton
const InteractiveCourtSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Court visualization */}
        <div className="relative">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          
          {/* Court zones overlay */}
          <div className="absolute inset-0 grid grid-cols-2 gap-1 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="relative">
                <Skeleton className="h-full w-full opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
        
        {/* Zone statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Simple court placeholder
const CourtLoadingPlaceholder = () => (
  <div className="flex items-center justify-center h-64 border rounded-lg">
    <div className="text-center space-y-2">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Loading court visualization...</p>
    </div>
  </div>
)

// Lazy load InteractiveCourt component
export const LazyInteractiveCourt = dynamic(
  () => import('./interactive-court').then(mod => ({ default: mod.InteractiveCourt })),
  {
    loading: () => <InteractiveCourtSkeleton />,
    ssr: false
  }
)

// Lazy load just the court component without card wrapper
export const LazyCourtVisualization = dynamic(
  () => import('./interactive-court').then(mod => ({ default: mod.InteractiveCourt })),
  {
    loading: () => <CourtLoadingPlaceholder />,
    ssr: false
  }
)

export { InteractiveCourtSkeleton, CourtLoadingPlaceholder }