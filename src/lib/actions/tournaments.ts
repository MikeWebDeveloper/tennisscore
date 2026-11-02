"use server"

import { Query } from "node-appwrite"
import { createAdminClient, withRetry } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"
import { env } from "@/lib/env"
import type { Match } from "@/lib/types"
import { summarizeTournaments, type TournamentSummary } from "@/lib/utils/tournaments"
import { getMainPlayer } from "./players"

const FIELDS = ["$id", "matchDate", "tournamentName", "status", "winnerId", "retirementReason", "isDeleted",
  "playerOneId", "playerTwoId", "playerThreeId", "playerFourId"]

/** Every tournament of the account (all match pages, not only the loaded ones), newest first */
export async function getTournamentSummaries(): Promise<{ tournaments?: TournamentSummary[]; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Unauthorized" }
    const { databases } = await createAdminClient()
    const matches: Match[] = []
    let cursor: string | undefined
    for (;;) {
      const queries = [Query.equal("userId", user.$id), Query.select(FIELDS), Query.orderDesc("$createdAt"), Query.limit(100)]
      if (cursor) queries.push(Query.cursorAfter(cursor))
      const page = await withRetry(() => databases.listDocuments<Match>(env.APPWRITE_DATABASE_ID, env.APPWRITE_MATCHES_COLLECTION_ID, queries), "NAVIGATION")
      matches.push(...page.documents)
      if (page.documents.length < 100 || matches.length >= page.total) break
      const next = page.documents[page.documents.length - 1].$id
      if (next === cursor) break
      cursor = next
    }
    const mainPlayer = await getMainPlayer()
    return { tournaments: summarizeTournaments(matches.filter((match) => !match.isDeleted), mainPlayer?.$id) }
  } catch (error) {
    console.error("Failed to load tournaments:", error)
    return { error: "Unable to load tournaments" }
  }
}
