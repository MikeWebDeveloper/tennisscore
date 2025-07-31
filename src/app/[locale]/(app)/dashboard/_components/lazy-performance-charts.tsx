import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3 } from 'lucide-react'

// Performance Charts loading skeleton
const PerformanceChartsSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-6">
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Lazy load PerformanceCharts component
export const LazyPerformanceCharts = dynamic(
  () => import('./performance-charts').then(mod => ({ default: mod.PerformanceCharts })),
  {
    loading: () => <PerformanceChartsSkeleton />,
    ssr: false // Disable SSR for chart components
  }
)