/**
 * Columns the matches list renders; everything else (point log, events) is fetched on demand.
 * Appwrite's select() accepts $id, $createdAt, $updatedAt and $permissions as system attributes;
 * $collectionId / $databaseId are rejected ("Attribute not found in schema") and come back anyway.
 */
export const MATCH_LIST_FIELDS = [
  "$id", "$createdAt", "$updatedAt", "$permissions",
  "userId", "playerOneId", "playerTwoId", "playerThreeId", "playerFourId",
  "playerOneData", "playerTwoData", "playerThreeData", "playerFourData",
  "matchDate", "matchFormat", "status", "winnerId", "score", "isDoubles",
  "retirementReason", "detailLevel", "tournamentName",
  "startTime", "endTime", "setDurations", "isDeleted", "deletedAt", "deletedBy",
]
