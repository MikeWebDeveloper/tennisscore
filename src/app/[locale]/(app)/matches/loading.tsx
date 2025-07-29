import { MatchesListSkeleton } from "@/components/ui/loading-skeletons"

export default function MatchesLoading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="h-8 md:h-10 w-32 md:w-40 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-3 md:h-4 w-48 md:w-60 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Matches list skeleton */}
        <MatchesListSkeleton count={9} />
      </div>
    </div>
  )
}