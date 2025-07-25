"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  updatePlayer,
  updatePlayerProfilePicture,
  removePlayerProfilePicture,
} from "@/lib/actions/players"
import { uploadProfilePicture } from "@/lib/actions/upload"
import { Player } from "@/lib/types"
import { ImageUpload } from "@/components/features/player/image-upload"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/hooks/use-translations"

interface EditPlayerDialogProps {
  player: Player | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPlayerDialog({
  player,
  isOpen,
  onOpenChange,
}: EditPlayerDialogProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const t = useTranslations('common')

  const [isMainPlayer, setIsMainPlayer] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPictureRemoved, setIsPictureRemoved] = useState(false)

  useEffect(() => {
    if (player && isOpen) {
      setIsMainPlayer(player.isMainPlayer || false)
      setSelectedFile(null)
      setIsPictureRemoved(false)
    }
  }, [player, isOpen])

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      setIsPictureRemoved(false)
    } else {
      setIsPictureRemoved(true)
    }
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!player) return

    startTransition(async () => {
      // 1. Update basic player info
      const formData = new FormData(event.currentTarget)
      formData.set("isMainPlayer", isMainPlayer.toString())
      
      const playerUpdateResult = await updatePlayer(player.$id, formData)

      if (playerUpdateResult?.error) {
        toast({
          title: t('errorOccurred'),
          description: playerUpdateResult.error,
          variant: "destructive",
        })
        return
      }

      // 2. Handle profile picture
      if (selectedFile) {
        const imageFormData = new FormData()
        imageFormData.append("file", selectedFile)
        const uploadResult = await uploadProfilePicture(imageFormData)

        if (uploadResult.success && uploadResult.fileId) {
          await updatePlayerProfilePicture(player.$id, uploadResult.fileId)
        } else {
          toast({
            title: t('errorOccurred'),
            description: uploadResult.error,
            variant: "destructive",
          })
          return // Stop if upload fails
        }
      } else if (isPictureRemoved && player.profilePictureId) {
        await removePlayerProfilePicture(player.$id)
      }

      toast({
        title: t('playerUpdated'),
        description: t('playerUpdated'),
      })
      onOpenChange(false)
      router.refresh()
    })
  }

  if (!player) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editPlayer')}</DialogTitle>
          <DialogDescription>
            {t('managementDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <ImageUpload
            onFileChange={handleFileChange}
            initialImageUrl={player.profilePictureUrl}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">{t('firstName')}</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={player.firstName}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t('lastName')}</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={player.lastName}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearOfBirth">{t('birthYear')}</Label>
              <Input
                id="yearOfBirth"
                name="yearOfBirth"
                type="number"
                defaultValue={player.yearOfBirth || ""}
              />
            </div>
            <div>
              <Label htmlFor="rating">{t('rating')}</Label>
              <Input
                id="rating"
                name="rating"
                defaultValue={player.rating || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="club">{t('club')}</Label>
              <Input
                id="club"
                name="club"
                placeholder={t('clubPlaceholder')}
                defaultValue={player.club || ""}
              />
            </div>
            <div>
              <Label htmlFor="playingHand">{t('playingHand')}</Label>
              <select
                id="playingHand"
                name="playingHand"
                defaultValue={player.playingHand || ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{t('selectOption')}</option>
                <option value="right">{t('right')}</option>
                <option value="left">{t('left')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMainPlayer"
              checked={isMainPlayer}
              onCheckedChange={checked => setIsMainPlayer(checked as boolean)}
            />
            <Label htmlFor="isMainPlayer">{t('setAsMainPlayer')}</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('saving') : t('saveChanges')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 