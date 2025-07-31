import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Chart loading skeleton
const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[200px] w-full" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
)

// Lazy load chart components with loading skeletons
export const LazyPerformanceTrends = dynamic(
  () => import('./performance-trends').then(mod => ({ default: mod.PerformanceTrends })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyServeReturnAnalysis = dynamic(
  () => import('./serve-return-analysis').then(mod => ({ default: mod.ServeReturnAnalysis })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyClutchPerformance = dynamic(
  () => import('./clutch-performance').then(mod => ({ default: mod.ClutchPerformance })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyHeadToHeadAnalysis = dynamic(
  () => import('./head-to-head-analysis').then(mod => ({ default: mod.HeadToHeadAnalysis })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

export const LazyMatchPatterns = dynamic(
  () => import('./match-patterns').then(mod => ({ default: mod.MatchPatterns })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)