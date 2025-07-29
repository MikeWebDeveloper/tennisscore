import { DashboardPerformanceSkeleton, QuickActionsSkeleton } from "@/components/ui/loading-skeletons"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 p-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Quick actions skeleton */}
      <QuickActionsSkeleton />

      {/* Performance stats skeleton */}
      <DashboardPerformanceSkeleton />

      {/* Charts section skeleton */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-6 w-16 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-[300px] w-full bg-muted/30 animate-pulse rounded-lg" />
      </div>

      {/* Recent matches skeleton */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <div>
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-md mb-1" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
              <div className="h-5 w-16 bg-muted animate-pulse rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}