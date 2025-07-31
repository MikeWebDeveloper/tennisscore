import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Edit, Loader2 } from 'lucide-react'

// Create Player Dialog skeleton
const CreatePlayerDialogSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Profile picture section */}
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

// Edit Player Dialog skeleton
const EditPlayerDialogSkeleton = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          <Skeleton className="h-6 w-28" />
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Current player info */}
        <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        
        {/* Profile picture section */}
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-9 w-36" />
        </div>
        
        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

// Button loading states
const CreatePlayerButtonLoading = ({ children, ...props }: any) => (
  <Button {...props} disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children}
  </Button>
)

const EditPlayerButtonLoading = ({ children, ...props }: any) => (
  <Button {...props} disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children}
  </Button>
)

// Lazy load CreatePlayerDialog component
export const LazyCreatePlayerDialog = dynamic(
  () => import('../app/[locale]/(app)/players/_components/create-player-dialog').then(mod => ({ default: mod.CreatePlayerDialog })),
  {
    loading: () => CreatePlayerDialogSkeleton,
    ssr: false
  }
)

// Lazy load EditPlayerDialog component
export const LazyEditPlayerDialog = dynamic(
  () => import('../app/[locale]/(app)/players/_components/edit-player-dialog').then(mod => ({ default: mod.EditPlayerDialog })),
  {
    loading: () => EditPlayerDialogSkeleton,
    ssr: false
  }
)

// Export button loading components for standalone use
export const LazyCreatePlayerButton = dynamic(
  () => import('../app/[locale]/(app)/players/_components/create-player-dialog').then(mod => ({ default: mod.CreatePlayerButton })),
  {
    loading: () => CreatePlayerButtonLoading,
    ssr: false
  }
)

export const LazyEditPlayerButton = dynamic(
  () => import('../app/[locale]/(app)/players/_components/edit-player-dialog').then(mod => ({ default: mod.EditPlayerButton })),
  {
    loading: () => EditPlayerButtonLoading,
    ssr: false
  }
)

export { CreatePlayerDialogSkeleton, EditPlayerDialogSkeleton }