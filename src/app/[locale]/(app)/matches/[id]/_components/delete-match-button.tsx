"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { useDeleteMatchMutation } from "@/lib/tanstack-query/mutations/matches"
import { toast } from "sonner"
import { useTranslations } from "@/i18n"

interface DeleteMatchButtonProps {
  matchId: string
  playerNames: {
    p1: string
    p2: string
  }
  onDeleteSuccess?: () => void
}

export function DeleteMatchButton({ matchId, playerNames, onDeleteSuccess }: DeleteMatchButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('common')
  
  const deleteMatchMutation = useDeleteMatchMutation({
    onSuccess: () => {
      toast.success(t('matchDeleted'))
      // Call the callback to update parent component's state
      if (onDeleteSuccess) {
        onDeleteSuccess()
      } else {
        // Only navigate if no callback provided (when used on match detail page)
        setTimeout(() => {
          router.push("/matches")
        }, 100)
      }
    },
    onError: (error) => {
      console.error('Delete match error:', error)
      toast.error(error instanceof Error ? error.message : t('failedToDeleteMatch'))
    }
  })

  const handleDelete = () => {
    deleteMatchMutation.mutate(matchId)
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteMatch')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteMatchConfirm')
              .replace('{p1}', playerNames.p1)
              .replace('{p2}', playerNames.p2)
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteMatchMutation.isPending}
          >
            {deleteMatchMutation.isPending ? t('deleting') : t('deleteMatch')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 