import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Player } from "@/lib/types"

function getProfilePictureUrl(profilePictureId?: string) {
  if (!profilePictureId) return undefined
  
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID || 'profile-pictures'
  
  if (!endpoint || !projectId) {
    console.warn('Missing Appwrite environment variables for profile pictures')
    return undefined
  }
  
  return `${endpoint}/storage/buckets/${bucketId}/files/${profilePictureId}/view?project=${projectId}`
}

interface PlayerAvatarProps {
  player: Player
  size?: "sm" | "md" | "lg"
}

export function PlayerAvatar({ player, size = "md" }: PlayerAvatarProps) {
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

  const profileImageUrl = getProfilePictureUrl(player.profilePictureId)
  
  // Debug logging for profile pictures
  if (player.profilePictureId && typeof window !== 'undefined') {
    console.log('Player Avatar Debug:', {
      playerName: `${player.firstName} ${player.lastName}`,
      profilePictureId: player.profilePictureId,
      generatedUrl: profileImageUrl,
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
      bucket: process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID
    })
  }

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage 
        src={profileImageUrl} 
        alt={`${player.firstName} ${player.lastName}`} 
        onError={(e) => {
          if (typeof window !== 'undefined') {
            console.error('Profile picture failed to load:', profileImageUrl, e)
          }
        }}
      />
      <AvatarFallback className={textSizeClasses[size]}>
        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
      </AvatarFallback>
    </Avatar>
  )
}
