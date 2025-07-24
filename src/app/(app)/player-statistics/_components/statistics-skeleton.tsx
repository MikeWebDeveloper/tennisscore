import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function StatisticsSkeleton() {
  // Create 32 skeleton cards to match the actual statistics
  const skeletonCards = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    // Vary sizes to match the actual layout
    size: i < 4 || i % 7 === 0 ? "medium" : "small"
  }))

  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
          
          <Skeleton className="h-9 w-40" />
        </div>
        
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">
        {skeletonCards.map((card) => {
          const sizeClasses = {
            small: "col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1",
            medium: "col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1",
            large: "col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2 xl:col-span-2"
          }
          
          return (
            <div key={card.id} className={cn(sizeClasses[card.size as keyof typeof sizeClasses || "small"])}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      {/* Call to Action Skeleton */}
      <div className="flex justify-center mt-8">
        <Card className="p-6 text-center max-w-md w-full">
          <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto mb-4" />
          <Skeleton className="h-10 w-40 mx-auto" />
        </Card>
      </div>
    </div>
  )
}