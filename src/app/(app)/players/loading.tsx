import { PlayersListSkeleton } from "@/components/ui/loading-skeletons"

export default function PlayersLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="h-8 md:h-10 w-24 md:w-32 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-3 md:h-4 w-56 md:w-64 bg-muted animate-pulse rounded-md" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          </div>
        </div>

        {/* Players list skeleton */}
        <PlayersListSkeleton count={8} />
      </div>
    </div>
  )
}