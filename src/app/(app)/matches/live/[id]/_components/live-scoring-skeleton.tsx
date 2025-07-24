import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function LiveScoringSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            {/* Players and Score */}
            <div className="grid grid-cols-3 gap-4 items-center mb-6">
              {/* Player 1 */}
              <div className="text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
              
              {/* Score */}
              <div className="text-center">
                <Skeleton className="h-16 w-32 mx-auto mb-2" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
              
              {/* Player 2 */}
              <div className="text-center">
                <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </div>

            {/* Set scores */}
            <div className="flex justify-center gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-16" />
              ))}
            </div>

            {/* Point buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="mt-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}