"use server"

import { Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { env } from "@/lib/env"
import type { Match, Player } from "@/lib/types"

const PAGE = 50
const DAY = 86_400_000

type Databases = Awaited<ReturnType<typeof createAdminClient>>["databases"]

/** "Last First" for the account's own players among these ids */
async function playerNames(databases: Databases, userId: string, ids: string[]): Promise<Record<string, string>> {
  const names: Record<string, string> = {}
  const wanted = [...new Set(ids.filter((id) => id && !id.startsWith("anonymous-")))]
  for (let start = 0; start < wanted.length; start += 100) {
    const batch = wanted.slice(start, start + 100)
    const players = await withRetry(() => databases.listDocuments<Player>(env.APPWRITE_DATABASE_ID, env.APPWRITE_PLAYERS_COLLECTION_ID, [Query.equal("$id", batch), Query.limit(batch.length)]))
    for (const player of players.documents) if (player.userId === userId) names[player.$id] = `${player.lastName} ${player.firstName}`.trim()
  }
  return names
}

const idsOf = (matches: Match[]) => matches.flatMap((match) => [match.playerOneId, match.playerTwoId, match.playerThreeId ?? "", match.playerFourId ?? ""])

/**
 * One page of the account's matches for the export, with everything recorded (point logs included).
 * Paged so a large history never exceeds the response size limit.
 */
export async function getExportPage(offset: number): Promise<{ matches?: Match[]; names?: Record<string, string>; total?: number; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }
    const { databases } = await createAdminClient()
    const page = await withRetry(() => databases.listDocuments<Match>(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.or([Query.equal("isDeleted", false), Query.isNull("isDeleted")]),
      Query.orderDesc("matchDate"),
      Query.limit(PAGE),
      Query.offset(Math.max(0, Math.floor(offset))),
    ]))
    return { matches: page.documents, names: await playerNames(databases, user.$id, idsOf(page.documents)), total: page.total }
  } catch (error) {
    console.error("Export page failed:", error)
    return { error: "Unable to export matches" }
  }
}

export interface TrashItem {
  id: string
  matchDate: string
  teamOne: string
  teamTwo: string
  /** Whole days left to restore it */
  daysLeft: number
}

/** Matches deleted in the last 7 days, which can still be restored, newest deletion first */
export async function getTrash(): Promise<{ items?: TrashItem[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }
    const { databases } = await createAdminClient()
    const response = await withRetry(() => databases.listDocuments<Match>(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, [
      Query.equal("userId", user.$id),
      Query.equal("isDeleted", true),
      Query.select(["$id", "matchDate", "deletedAt", "playerOneId", "playerTwoId", "playerThreeId", "playerFourId"]),
      Query.limit(100),
    ]), "NAVIGATION")
    const now = Date.now()
    const recent = response.documents.filter((match) => match.deletedAt && now - Date.parse(match.deletedAt) <= 7 * DAY)
    const names = await playerNames(databases, user.$id, idsOf(recent))
    const team = (a: string, b?: string) => [a, b].filter(Boolean).map((id) => names[id!] ?? "?").join(" / ")
    return {
      items: recent
        .sort((a, b) => Date.parse(b.deletedAt!) - Date.parse(a.deletedAt!))
        .map((match) => ({
          id: match.$id,
          matchDate: match.matchDate,
          teamOne: team(match.playerOneId, match.playerThreeId),
          teamTwo: team(match.playerTwoId, match.playerFourId),
          daysLeft: Math.max(0, Math.ceil(7 - (now - Date.parse(match.deletedAt!)) / DAY)),
        })),
    }
  } catch (error) {
    console.error("Trash failed:", error)
    return { error: "Unable to load deleted matches" }
  }
}
