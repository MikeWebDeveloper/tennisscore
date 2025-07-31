import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Play, Users, Timer } from 'lucide-react'

// Live Scoring Interface loading skeleton
const LiveScoringInterfaceSkeleton = () => (
  <div className="space-y-6">
    {/* Match header */}
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Players */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Users className="h-5 w-5" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          {/* Score display */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-8">
              <Skeleton className="h-16 w-16" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-16 w-16" />
            </div>
            <div className="flex justify-center space-x-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Match timer */}
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-center space-x-2">
          <Timer className="h-4 w-4" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
    
    {/* Action buttons */}
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
    
    {/* Serve selection */}
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Quick stats */}
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
)

// Compact scoring skeleton for mobile
const CompactScoringInterfaceSkeleton = () => (
  <div className="space-y-4">
    {/* Compact score */}
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
          <Play className="h-6 w-6" />
          <div className="space-y-1 text-right">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Action grid */}
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
)

// Lazy load LiveScoringInterface component
export const LazyLiveScoringInterface = dynamic(
  () => import('@/app/[locale]/(app)/matches/live/[id]/_components/live-scoring-interface').then(mod => ({ default: mod.LiveScoringInterface })),
  {
    loading: () => <LiveScoringInterfaceSkeleton />,
    ssr: false
  }
)

// Lazy load compact version for mobile/small screens
// Note: CompactScoringInterface doesn't exist in the live-scoring-interface file
// export const LazyCompactScoringInterface = dynamic(
//   () => import('@/app/[locale]/(app)/matches/live/[id]/_components/live-scoring-interface').then(mod => ({ default: mod.CompactScoringInterface })),
//   {
//     loading: () => <CompactScoringInterfaceSkeleton />,
//     ssr: false
//   }
// )

export { LiveScoringInterfaceSkeleton, CompactScoringInterfaceSkeleton }