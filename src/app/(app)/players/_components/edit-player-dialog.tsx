"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updatePlayer } from "@/lib/actions/players"
import { Player } from "@/lib/types"

function getProfilePictureUrl(profilePictureId?: string) {
  if (!profilePictureId) return undefined
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
}

interface EditPlayerDialogProps {
  player: Player | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPlayerDialog({ player, isOpen, onOpenChange }: EditPlayerDialogProps) {
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null)
  const [isMainPlayer, setIsMainPlayer] = useState(false)

  useEffect(() => {
    if (player && isOpen) {
      setEditPreviewImage(null)
      setIsMainPlayer(player.isMainPlayer || false)
    }
  }, [player, isOpen])

  const handleUpdatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!player) return
    
    const formData = new FormData(event.currentTarget)
    // Explicitly set the isMainPlayer value
    formData.set("isMainPlayer", isMainPlayer.toString())
    
    const result = await updatePlayer(player.$id, formData)
    if (result.success) {
      onOpenChange(false)
      setEditPreviewImage(null)
      window.location.reload()
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setEditPreviewImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (!player) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update player information, profile picture, and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdatePlayer} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {editPreviewImage ? (
                  <AvatarImage src={editPreviewImage} alt="Preview" />
                ) : player.profilePictureId ? (
                  <AvatarImage 
                    src={getProfilePictureUrl(player.profilePictureId)} 
                    alt={`${player.firstName} ${player.lastName}`} 
                  />
                ) : (
                  <AvatarFallback className="text-2xl">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Label 
                htmlFor="editProfilePicture" 
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-3 w-3" />
              </Label>
            </div>
            <Input
              id="editProfilePicture"
              name="profilePicture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <p className="text-xs text-muted-foreground text-center">
              Upload a new profile picture (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editFirstName" className="text-sm">First Name *</Label>
              <Input 
                id="editFirstName" 
                name="firstName" 
                defaultValue={player.firstName}
                required 
                className="text-sm" 
              />
            </div>
            <div>
              <Label htmlFor="editLastName" className="text-sm">Last Name *</Label>
              <Input 
                id="editLastName" 
                name="lastName" 
                defaultValue={player.lastName}
                required 
                className="text-sm" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editYearOfBirth" className="text-sm">Birth Year</Label>
              <Input 
                id="editYearOfBirth" 
                name="yearOfBirth" 
                type="number" 
                min="1900" 
                max={new Date().getFullYear()} 
                defaultValue={player.yearOfBirth || ""}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="editRating" className="text-sm">Rating</Label>
              <Input 
                id="editRating" 
                name="rating" 
                placeholder="e.g., 4.0, UTR 8" 
                defaultValue={player.rating || ""}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="editIsMainPlayer" 
              checked={isMainPlayer}
              onCheckedChange={(checked) => setIsMainPlayer(checked as boolean)}
            />
            <Label htmlFor="editIsMainPlayer" className="text-sm">
              Set as main player
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Player
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 