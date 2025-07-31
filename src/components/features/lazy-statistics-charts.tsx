import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Target, Zap, Trophy, Users, BarChart3 } from 'lucide-react'

// Generic chart skeleton
const ChartSkeleton = ({ title, icon: Icon }: { title?: string; icon?: any }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Chart area */}
        <Skeleton className="h-[250px] w-full" />
        
        {/* Legend/stats below chart */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

// Performance Trends skeleton
const PerformanceTrendsSkeleton = () => (
  <ChartSkeleton title="Performance Trends" icon={TrendingUp} />
)

// Serve Return Analysis skeleton
const ServeReturnAnalysisSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5" />
        <Skeleton className="h-6 w-40" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Serve stats */}
        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        
        {/* Return stats */}
        <div>
          <Skeleton className="h-5 w-28 mb-3" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Clutch Performance skeleton
const ClutchPerformanceSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        <Skeleton className="h-6 w-36" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Clutch chart */}
        <Skeleton className="h-[220px] w-full" />
        
        {/* Clutch metrics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Head to Head Analysis skeleton
const HeadToHeadAnalysisSkeleton = () => (
  <ChartSkeleton title="Head to Head" icon={Users} />
)

// Match Patterns skeleton
const MatchPatternsSkeleton = () => (
  <ChartSkeleton title="Match Patterns" icon={BarChart3} />
)

// Lazy load individual chart components
export const LazyPerformanceTrends = dynamic(
  () => import('@/app/[locale]/(app)/statistics/_components/performance-trends').then(mod => ({ default: mod.PerformanceTrends })),
  {
    loading: () => <PerformanceTrendsSkeleton />,
    ssr: false
  }
)

export const LazyServeReturnAnalysis = dynamic(
  () => import('@/app/[locale]/(app)/statistics/_components/serve-return-analysis').then(mod => ({ default: mod.ServeReturnAnalysis })),
  {
    loading: () => <ServeReturnAnalysisSkeleton />,
    ssr: false
  }
)

export const LazyClutchPerformance = dynamic(
  () => import('@/app/[locale]/(app)/statistics/_components/clutch-performance').then(mod => ({ default: mod.ClutchPerformance })),
  {
    loading: () => <ClutchPerformanceSkeleton />,
    ssr: false
  }
)

export const LazyHeadToHeadAnalysis = dynamic(
  () => import('@/app/[locale]/(app)/statistics/_components/head-to-head-analysis').then(mod => ({ default: mod.HeadToHeadAnalysis })),
  {
    loading: () => <HeadToHeadAnalysisSkeleton />,
    ssr: false
  }
)

export const LazyMatchPatterns = dynamic(
  () => import('@/app/[locale]/(app)/statistics/_components/match-patterns').then(mod => ({ default: mod.MatchPatterns })),
  {
    loading: () => <MatchPatternsSkeleton />,
    ssr: false
  }
)

// Export skeletons for reuse
export {
  ChartSkeleton,
  PerformanceTrendsSkeleton,
  ServeReturnAnalysisSkeleton,
  ClutchPerformanceSkeleton,
  HeadToHeadAnalysisSkeleton,
  MatchPatternsSkeleton
}