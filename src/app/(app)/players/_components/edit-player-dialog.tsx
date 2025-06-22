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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (player && isOpen) {
      setEditPreviewImage(null)
      setIsMainPlayer(player.isMainPlayer || false)
      setError(null)
    }
  }, [player, isOpen])

  const handleUpdatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!player) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData(event.currentTarget)
      // Explicitly set the isMainPlayer value
      formData.set("isMainPlayer", isMainPlayer.toString())
      
      const result = await updatePlayer(player.$id, formData)
      if (result.success) {
        onOpenChange(false)
        setEditPreviewImage(null)
        window.location.reload()
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error updating player:", err)
    } finally {
      setIsLoading(false)
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
      <DialogContent className="max-w-sm mx-auto bg-background/95 backdrop-blur-md border-border/50 shadow-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg">Edit Player</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update player information and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdatePlayer} className="space-y-3">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Avatar className="h-16 w-16">
                {editPreviewImage ? (
                  <AvatarImage src={editPreviewImage} alt="Preview" />
                ) : player.profilePictureId ? (
                  <AvatarImage 
                    src={getProfilePictureUrl(player.profilePictureId)} 
                    alt={`${player.firstName} ${player.lastName}`} 
                  />
                ) : (
                  <AvatarFallback className="text-lg">
                    <User className="h-6 w-6" />
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
              Upload new picture (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="editFirstName" className="text-xs font-medium">First Name *</Label>
              <Input 
                id="editFirstName" 
                name="firstName" 
                defaultValue={player.firstName}
                required 
                className="text-sm h-8" 
              />
            </div>
            <div>
              <Label htmlFor="editLastName" className="text-xs font-medium">Last Name *</Label>
              <Input 
                id="editLastName" 
                name="lastName" 
                defaultValue={player.lastName}
                required 
                className="text-sm h-8" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="editYearOfBirth" className="text-xs font-medium">Birth Year</Label>
              <Input 
                id="editYearOfBirth" 
                name="yearOfBirth" 
                type="number" 
                min="1900" 
                max={new Date().getFullYear()} 
                defaultValue={player.yearOfBirth || ""}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="editRating" className="text-xs font-medium">Rating</Label>
              <Input 
                id="editRating" 
                name="rating" 
                placeholder="4.0, UTR 8" 
                defaultValue={player.rating || ""}
                className="text-sm h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="editClub" className="text-xs font-medium">Club</Label>
              <Input 
                id="editClub" 
                name="club" 
                placeholder="Tennis Club Name" 
                defaultValue={player.club || ""}
                className="text-sm h-8"
              />
            </div>
            <div>
              <Label htmlFor="editPlayingHand" className="text-xs font-medium">Playing Hand</Label>
              <select
                id="editPlayingHand"
                name="playingHand"
                defaultValue={player.playingHand || ""}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select...</option>
                <option value="right">Right</option>
                <option value="left">Left</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="editIsMainPlayer" 
              checked={isMainPlayer}
              onCheckedChange={(checked) => setIsMainPlayer(checked as boolean)}
            />
            <Label htmlFor="editIsMainPlayer" className="text-xs">
              Set as main player
            </Label>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-8 text-xs"
              size="sm"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-8 text-xs" size="sm" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Player"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 