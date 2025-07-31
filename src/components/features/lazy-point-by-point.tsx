import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { List, Clock } from 'lucide-react'

// Point-by-Point loading skeleton
const PointByPointSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <List className="h-5 w-5" />
        <Skeleton className="h-6 w-40" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Timeline header */}
        <div className="flex items-center gap-4 mb-6">
          <Clock className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Point entries */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
        
        {/* Load more button */}
        <div className="text-center mt-6">
          <Skeleton className="h-10 w-32 mx-auto" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Lazy load PointByPointView component
export const LazyPointByPointView = dynamic(
  () => import('@/app/[locale]/(app)/matches/[id]/_components/point-by-point-view').then(mod => ({ default: mod.PointByPointView })),
  {
    loading: () => <PointByPointSkeleton />,
    ssr: false
  }
)

export { PointByPointSkeleton }