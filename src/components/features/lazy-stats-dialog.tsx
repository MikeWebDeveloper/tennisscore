import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Loader2 } from 'lucide-react'

// Stats Dialog loading skeleton
const StatsDialogSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Tabs skeleton */}
        <div className="flex space-x-1 border-b">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        
        {/* Content area */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-8 w-12 mx-auto" />
              </div>
            ))}
          </div>
          
          {/* Chart area */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          
          {/* Additional stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-28" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

// Button loading state
const StatsButtonLoading = ({ children, ...props }: any) => (
  <Button {...props} disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children}
  </Button>
)

// Lazy load StatsDiscoveryDialog component
export const LazyStatsDiscoveryDialog = dynamic(
  () => import('@/app/[locale]/(app)/matches/[id]/_components/stats-drilldown-dialog').then(mod => ({ default: mod.StatsDrilldownDialog })),
  {
    loading: () => <StatsDialogSkeleton isOpen={false} onClose={() => {}} />,
    ssr: false
  }
)

export { StatsDialogSkeleton, StatsButtonLoading }