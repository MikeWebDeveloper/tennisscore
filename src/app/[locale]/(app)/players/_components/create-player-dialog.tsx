"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { User } from "lucide-react"
import { Upload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createPlayer } from "@/lib/actions/players"
import { useTranslations } from "@/i18n"

interface CreatePlayerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreatePlayerDialog({ isOpen, onOpenChange, onCreated }: CreatePlayerDialogProps) {
  const t = useTranslations('common')
  const router = useRouter()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<"general" | "mainExists" | null>(null)
  const savingRef = useRef(false)

  const handleOpenChange = (open: boolean) => {
    if (savingRef.current) return
    if (!open) {
      setSaveError(null)
      setPreviewImage(null)
    }
    onOpenChange(open)
  }

  const handleCreatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current) return
    savingRef.current = true
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await createPlayer(new FormData(event.currentTarget))
      if (!result.success) {
        setSaveError(result.error === "MAIN_PLAYER_EXISTS" ? "mainExists" : "general")
        return
      }
      setPreviewImage(null)
      onOpenChange(false)
      onCreated?.()
      router.refresh()
    } catch {
      setSaveError("general")
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreviewImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm mx-auto bg-background/95 backdrop-blur-md border-border/50 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg">{t("createNewPlayer")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("addNewPlayerDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreatePlayer} className="space-y-3">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {previewImage ? (
                  <AvatarImage src={previewImage} alt="Preview" />
                ) : (
                  <AvatarFallback className="text-lg">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Label 
                htmlFor="profilePicture" 
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-3 w-3" />
              </Label>
            </div>
            <Input
              id="profilePicture"
              name="profilePicture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-xs text-muted-foreground text-center">
              {t("uploadPictureOptional")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="firstName" className="text-xs font-medium">{t("firstName")} *</Label>
              <Input id="firstName" name="firstName" required className="text-sm h-8" />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-xs font-medium">{t("lastName")} *</Label>
              <Input id="lastName" name="lastName" required className="text-sm h-8" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-2">
              <Label htmlFor="yearOfBirth" className="text-xs font-medium">{t("birthYear")}</Label>
              <Input 
                id="yearOfBirth" 
                name="yearOfBirth" 
                type="number" 
                min="1900" 
                max={new Date().getFullYear()} 
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="bhRating" className="text-xs font-medium">BH</Label>
              <Input 
                id="bhRating" 
                name="bhRating" 
                placeholder="12BH"
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="czRanking" className="text-xs font-medium">CŽ</Label>
              <Input 
                id="czRanking" 
                name="czRanking" 
                type="number"
                min="1"
                max="1500"
                placeholder="1-1500"
                className="text-sm h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="club" className="text-xs font-medium">{t("club")}</Label>
              <Input 
                id="club" 
                name="club" 
                placeholder={t("clubPlaceholder")}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="playingHand" className="text-xs font-medium">{t("playingHand")}</Label>
              <select
                id="playingHand"
                name="playingHand"
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{t("selectOption")}</option>
                <option value="right">{t("right")}</option>
                <option value="left">{t("left")}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isMainPlayer" name="isMainPlayer" value="true" />
            <Label htmlFor="isMainPlayer" className="text-xs">
              {t("setAsMainPlayer")}
            </Label>
          </div>

          {saveError && <p role="alert" className="text-sm text-destructive">{t(saveError === "mainExists" ? "mainPlayerAlreadyExists" : "createPlayerError")}</p>}
          <div className="space-y-2 pt-2">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isSaving}
                className="flex-1 h-8 text-xs"
                size="sm"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving} className="flex-1 h-8 text-xs" size="sm">
                {t(isSaving ? "saving" : "createPlayer")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreatePlayerTrigger({ onOpenDialog }: { onOpenDialog: () => void }) {
  const t = useTranslations('common')
  
  return (
    <Button className="w-full sm:w-auto" onClick={onOpenDialog}>
      <Plus className="h-4 w-4 mr-2" />
      {t("addPlayer")}
    </Button>
  )
} 