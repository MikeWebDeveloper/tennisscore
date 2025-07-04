import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Player } from "@/lib/types"

interface PlayerAvatarProps {
  player: Player | Partial<Player>
  className?: string
}

export function PlayerAvatar({ player, className }: PlayerAvatarProps) {
  if (!player || !player.firstName || !player.lastName) {
    // Return a default or empty avatar if player data is incomplete
    return <Avatar className={className} />
  }

  const initials = `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`
  
  // Build full profile picture URL if profilePictureId exists
  let profilePictureUrl = player.profilePictureUrl
  
  if (player.profilePictureId) {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
    if (typeof window !== 'undefined' && (!endpoint || !projectId || !bucketId)) {
      console.warn('Missing environment variables:', { endpoint, bucketId, projectId })
      throw new Error('Missing required Appwrite environment variables for profile picture URL.')
    }
    
    if (endpoint && projectId && bucketId) {
      profilePictureUrl = `${endpoint}/storage/buckets/${bucketId}/files/${player.profilePictureId}/view?project=${projectId}`
    }
  }

  return (
    <Avatar className={className}>
      <AvatarImage
        src={profilePictureUrl}
        alt={`${player.lastName} ${player.firstName}`}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
