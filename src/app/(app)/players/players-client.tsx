"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, User, Edit, Trash2, Upload, Star } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createPlayer, updatePlayer, deletePlayer } from "@/lib/actions/players"
import { User as UserType, Player } from "@/lib/types"

interface PlayersClientProps {
  user: UserType
  players: Player[]
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

function getProfilePictureUrl(profilePictureId?: string) {
  if (!profilePictureId) return undefined
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
}

function PlayerAvatar({ player, size = "md" }: { player: Player; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg"
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage 
        src={getProfilePictureUrl(player.profilePictureId)} 
        alt={`${player.firstName} ${player.lastName}`} 
      />
      <AvatarFallback className={textSizeClasses[size]}>
        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
      </AvatarFallback>
    </Avatar>
  )
}

export function PlayersClient({ players }: PlayersClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null)

  const handleCreatePlayer = async (formData: FormData) => {
    const result = await createPlayer(formData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      setPreviewImage(null)
      window.location.reload()
    }
  }

  const handleUpdatePlayer = async (formData: FormData) => {
    if (!editingPlayer) return
    const result = await updatePlayer(editingPlayer.$id, formData)
    if (result.success) {
      setEditingPlayer(null)
      setEditPreviewImage(null)
      window.location.reload()
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (confirm("Are you sure you want to delete this player?")) {
      const result = await deletePlayer(playerId)
      if (result.success) {
        window.location.reload()
      }
    }
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (isEdit) {
          setEditPreviewImage(result)
        } else {
          setPreviewImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <motion.div 
      className="min-h-screen bg-background p-4 md:p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Players</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage your tennis players and opponents
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
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
                    onChange={(e) => handleImageChange(e)}
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
                      max="2030"
                      className="text-sm" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating" className="text-sm">Rating</Label>
                    <Input 
                      id="rating" 
                      name="rating" 
                      placeholder="e.g. 4.0, H12, UTR 8.5" 
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="isMainPlayer" name="isMainPlayer" value="true" />
                  <Label htmlFor="isMainPlayer" className="text-sm flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Set as main player for dashboard stats
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setPreviewImage(null)
                    }}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-sm">Create Player</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {players.length === 0 ? (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="show"
          >
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                <User className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">No players yet</h3>
                <p className="text-muted-foreground text-center mb-6 text-sm md:text-base px-4">
                  Create your first player to start tracking tennis matches and performance.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Player
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {players.map((player) => (
              <motion.div key={player.$id} variants={cardVariants}>
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base md:text-lg">
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar player={player} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1">
                            <span className="truncate font-semibold">
                              {player.firstName} {player.lastName}
                            </span>
                            {player.isMainPlayer && (
                              <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="currentColor" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingPlayer(player)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePlayer(player.$id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {player.yearOfBirth && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Born: {player.yearOfBirth}
                        </p>
                      )}
                      {player.rating && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Rating: <span className="font-medium">{player.rating}</span>
                        </p>
                      )}
                      {player.isMainPlayer && (
                        <p className="text-xs text-primary font-medium">
                          ⭐ Main Player
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(player.$createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Edit Player Dialog */}
        <Dialog open={!!editingPlayer} onOpenChange={() => {
          setEditingPlayer(null)
          setEditPreviewImage(null)
        }}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            {editingPlayer && (
              <form action={handleUpdatePlayer} className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {editPreviewImage ? (
                        <AvatarImage src={editPreviewImage} alt="Preview" />
                      ) : editingPlayer.profilePictureId ? (
                        <AvatarImage 
                          src={getProfilePictureUrl(editingPlayer.profilePictureId)} 
                          alt={`${editingPlayer.firstName} ${editingPlayer.lastName}`} 
                        />
                      ) : (
                        <AvatarFallback className="text-2xl">
                          {editingPlayer.firstName.charAt(0)}{editingPlayer.lastName.charAt(0)}
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
                    onChange={(e) => handleImageChange(e, true)}
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
                      defaultValue={editingPlayer.firstName}
                      required 
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName" className="text-sm">Last Name *</Label>
                    <Input 
                      id="editLastName" 
                      name="lastName" 
                      defaultValue={editingPlayer.lastName}
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
                      max="2030"
                      defaultValue={editingPlayer.yearOfBirth}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editRating" className="text-sm">Rating</Label>
                    <Input 
                      id="editRating" 
                      name="rating" 
                      placeholder="e.g. 4.0, H12, UTR 8.5"
                      defaultValue={editingPlayer.rating}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="editIsMainPlayer" 
                    name="isMainPlayer" 
                    value="true"
                    defaultChecked={editingPlayer.isMainPlayer}
                  />
                  <Label htmlFor="editIsMainPlayer" className="text-sm flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Set as main player for dashboard stats
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingPlayer(null)
                      setEditPreviewImage(null)
                    }}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-sm">Update Player</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
} 