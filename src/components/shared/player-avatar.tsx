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
  const profilePictureUrl = player.profilePictureId 
    ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID}/files/${player.profilePictureId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
    : player.profilePictureUrl

  return (
    <Avatar className={className}>
      <AvatarImage
        src={profilePictureUrl}
        alt={`${player.firstName} ${player.lastName}`}
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
