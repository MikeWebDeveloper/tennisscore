"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, User, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createPlayer } from "@/lib/actions/players"

interface CreatePlayerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePlayerDialog({ isOpen, onOpenChange }: CreatePlayerDialogProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const handleCreatePlayer = async (formData: FormData) => {
    const result = await createPlayer(formData)
    if (result.success) {
      onOpenChange(false)
      setPreviewImage(null)
      window.location.reload()
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
        </DialogHeader>
        <form action={handleCreatePlayer} className="space-y-4">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {previewImage ? (
                  <AvatarImage src={previewImage} alt="Preview" />
                ) : (
                  <AvatarFallback className="text-2xl">
                    <User className="h-8 w-8" />
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
              Upload a profile picture (optional)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="text-sm">First Name *</Label>
              <Input id="firstName" name="firstName" required className="text-sm" />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
              <Input id="lastName" name="lastName" required className="text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="yearOfBirth" className="text-sm">Birth Year</Label>
              <Input 
                id="yearOfBirth" 
                name="yearOfBirth" 
                type="number" 
                min="1900" 
                max={new Date().getFullYear()} 
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="rating" className="text-sm">Rating</Label>
              <Input 
                id="rating" 
                name="rating" 
                placeholder="e.g., 4.0, UTR 8" 
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isMainPlayer" name="isMainPlayer" />
            <Label htmlFor="isMainPlayer" className="text-sm">
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
              Create Player
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreatePlayerTrigger({ onOpenDialog }: { onOpenDialog: () => void }) {
  return (
    <Button className="w-full sm:w-auto" onClick={onOpenDialog}>
      <Plus className="h-4 w-4 mr-2" />
      Add Player
    </Button>
  )
} 