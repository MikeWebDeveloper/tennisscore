"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, User, Edit, Trash2 } from "lucide-react"
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

export function PlayersClient({ players }: PlayersClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  const handleCreatePlayer = async (formData: FormData) => {
    const result = await createPlayer(formData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      window.location.reload() // Temporary refresh - would use router.refresh() in production
    }
  }

  const handleUpdatePlayer = async (formData: FormData) => {
    if (!editingPlayer) return
    const result = await updatePlayer(editingPlayer.$id, formData)
    if (result.success) {
      setEditingPlayer(null)
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

  return (
    <motion.div 
      className="min-h-screen bg-background p-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Players</h1>
            <p className="text-muted-foreground mt-2">
              Manage your tennis players and opponents
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Player</DialogTitle>
              </DialogHeader>
              <form action={handleCreatePlayer} className="space-y-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
                <div>
                  <Label htmlFor="yearOfBirth">Year of Birth</Label>
                  <Input id="yearOfBirth" name="yearOfBirth" type="number" min="1900" max="2025" />
                </div>
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <Input id="rating" name="rating" placeholder="e.g. 4.0, UTR 8.5, etc." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Player</Button>
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No players yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first player to start tracking tennis matches and performance.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Player
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {players.map((player) => (
              <motion.div key={player.$id} variants={cardVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{player.firstName} {player.lastName}</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeletePlayer(player.$id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {player.yearOfBirth && (
                        <p className="text-sm text-muted-foreground">
                          Born: {player.yearOfBirth}
                        </p>
                      )}
                      {player.rating && (
                        <p className="text-sm text-muted-foreground">
                          Rating: {player.rating}
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
        <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            {editingPlayer && (
              <form action={handleUpdatePlayer} className="space-y-4">
                <div>
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input 
                    id="editFirstName" 
                    name="firstName" 
                    defaultValue={editingPlayer.firstName}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input 
                    id="editLastName" 
                    name="lastName" 
                    defaultValue={editingPlayer.lastName}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="editYearOfBirth">Year of Birth</Label>
                  <Input 
                    id="editYearOfBirth" 
                    name="yearOfBirth" 
                    type="number" 
                    min="1900" 
                    max="2025"
                    defaultValue={editingPlayer.yearOfBirth}
                  />
                </div>
                <div>
                  <Label htmlFor="editRating">Rating</Label>
                  <Input 
                    id="editRating" 
                    name="rating" 
                    placeholder="e.g. 4.0, UTR 8.5, etc."
                    defaultValue={editingPlayer.rating}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingPlayer(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Player</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
} 