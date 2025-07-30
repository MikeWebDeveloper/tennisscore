import { CzechTennisData, CzechTennisPlayer } from "@/lib/types"
import czechTennisData from "@/data/czech-tennis-players.json"

export function getCzechTennisPlayers(): CzechTennisPlayer[] {
  const data = czechTennisData as CzechTennisData
  return data.players
}

export function searchCzechPlayers(query: string): CzechTennisPlayer[] {
  const players = getCzechTennisPlayers()
  const normalizedQuery = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

  if (!normalizedQuery) {
    return players.slice(0, 20) // Return first 20 if no query
  }

  return players.filter(player => {
    const fullName = `${player.firstName} ${player.lastName}`
    const normalizedFullName = fullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    const normalizedFirstName = player.firstName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    const normalizedLastName = player.lastName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    const normalizedClub = player.club
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()

    return (
      normalizedFullName.includes(normalizedQuery) ||
      normalizedFirstName.includes(normalizedQuery) ||
      normalizedLastName.includes(normalizedQuery) ||
      normalizedClub.includes(normalizedQuery) ||
      player.bhRating.toLowerCase().includes(normalizedQuery) ||
      player.czRanking.toString().includes(normalizedQuery)
    )
  }).slice(0, 50) // Limit to 50 results
}

export function getCzechPlayerById(uniqueId: string): CzechTennisPlayer | null {
  const players = getCzechTennisPlayers()
  return players.find(player => player.uniqueId === uniqueId) || null
}

export function getCzechTennisMetadata() {
  const data = czechTennisData as CzechTennisData
  return data.metadata
}