import { Skeleton } from "./skeleton"
import { Card, CardContent, CardHeader } from "./card"

// Dashboard Stats Card Skeleton
export function StatCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-3 md:p-4 lg:p-6 h-full">
        <div className="flex flex-col h-full justify-between">
          {/* Header with icon and label */}
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
            <Skeleton className="h-6 w-6 md:h-8 md:w-8 rounded-full" />
          </div>
          
          {/* Value */}
          <div className="flex-1 flex items-center">
            <Skeleton className="h-6 md:h-8 lg:h-10 w-12 md:w-16 lg:w-20" />
          </div>
          
          {/* Subtitle */}
          <div className="mt-1">
            <Skeleton className="h-2 md:h-3 w-16 md:w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Dashboard Performance Section Skeleton
export function DashboardPerformanceSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div>
            <Skeleton className="h-5 md:h-6 w-32 md:w-40 mb-1" />
            <Skeleton className="h-3 md:h-4 w-48 md:w-60" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Match Card Skeleton
export function MatchCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32 flex-1" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-18" />
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Matches List Skeleton
export function MatchesListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Player Card Skeleton
export function PlayerCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Players List Skeleton
export function PlayersListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="relative max-w-md">
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <PlayerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Chart Skeleton (improved version)
export function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="relative h-[250px] bg-muted/30 rounded-lg overflow-hidden">
        {/* Animated bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full p-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="w-6 animate-pulse" 
              style={{ 
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.1}s`
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Quick Actions Skeleton
export function QuickActionsSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Skeleton className="h-11 flex-1" />
      <Skeleton className="h-11 flex-1" />
    </div>
  )
}