import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Player } from "@/lib/types"

function getProfilePictureUrl(profilePictureId?: string) {
  if (!profilePictureId) return undefined
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
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