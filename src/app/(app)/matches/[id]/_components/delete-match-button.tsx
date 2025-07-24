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
import { deleteMatch } from "@/lib/actions/matches"
import { toast } from "sonner"
import { useTranslations } from "@/hooks/use-translations"

interface DeleteMatchButtonProps {
  matchId: string
  playerNames: {
    p1: string
    p2: string
  }
}

export function DeleteMatchButton({ matchId, playerNames }: DeleteMatchButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const t = useTranslations()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteMatch(matchId)
      if (result.success) {
        toast.success(t('matchDeleted'))
        router.push("/matches")
      } else {
        toast.error(result.error || t('failedToDeleteMatch'))
      }
    } catch {
      toast.error(t('failedToDeleteMatch'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
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
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') : t('deleteMatch')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 