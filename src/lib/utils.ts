import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a player name consistently as "Last Name First Name"
 * When shortened due to space constraints, shows "Last Name F."
 */
export function formatPlayerName(firstName: string, lastName: string, options: {
  shortened?: boolean
  maxLength?: number
  isDoubles?: boolean
} = {}): string {
  if (!firstName || !lastName) {
    return "Unknown Player"
  }

  const { shortened = false, maxLength = 20, isDoubles = false } = options
  
  // Full format: "Last Name First Name"
  const fullName = `${lastName} ${firstName}`
  
  // If explicitly shortened or auto-shorten based on length/context
  const shouldShorten = shortened || 
    fullName.length > maxLength || 
    (isDoubles && fullName.length > 15) || 
    fullName.length > 25

  if (shouldShorten) {
    // Shortened format: "Last Name F."
    return `${lastName} ${firstName.charAt(0).toUpperCase()}.`
  }

  return fullName
}

/**
 * Formats a player name from a Player object
 */
export function formatPlayerFromObject(player: {
  firstName: string
  lastName: string
}, options?: Parameters<typeof formatPlayerName>[2]): string {
  return formatPlayerName(player.firstName, player.lastName, options)
}

/**
 * Formats player names for doubles display
 */
export function formatDoublesTeam(
  player1: { firstName: string; lastName: string },
  player2: { firstName: string; lastName: string },
  options: { shortened?: boolean; maxLength?: number } = {}
): string {
  const { shortened = false, maxLength = 40 } = options
  
  const name1 = formatPlayerName(player1.firstName, player1.lastName, { 
    shortened, 
    maxLength: 15, 
    isDoubles: true 
  })
  const name2 = formatPlayerName(player2.firstName, player2.lastName, { 
    shortened, 
    maxLength: 15, 
    isDoubles: true 
  })
  
  const fullTeamName = `${name1} / ${name2}`
  
  // If team name is too long, force shortening
  if (fullTeamName.length > maxLength) {
    const shortName1 = formatPlayerName(player1.firstName, player1.lastName, { 
      shortened: true, 
      isDoubles: true 
    })
    const shortName2 = formatPlayerName(player2.firstName, player2.lastName, { 
      shortened: true, 
      isDoubles: true 
    })
    return `${shortName1} / ${shortName2}`
  }
  
  return fullTeamName
}

/**
 * Gets player initials for avatars (keeping "FL" format for visual consistency)
 */
export function getPlayerInitials(firstName: string, lastName: string): string {
  if (!firstName || !lastName) return "??"
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatDuration(duration: number | null | undefined): string {
  if (!duration) return "--"
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Get the URL for a profile picture from Appwrite storage
 */
export function getProfilePictureUrl(profilePictureId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID
  if (!endpoint || !projectId || !bucketId) {
    throw new Error("Missing required Appwrite environment variables for profile picture URL.")
  }
  return `${endpoint}/storage/buckets/${bucketId}/files/${profilePictureId}/view?project=${projectId}`
}
