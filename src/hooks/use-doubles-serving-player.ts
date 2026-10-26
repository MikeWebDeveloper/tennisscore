"use client"

import { useMemo } from "react"
import {
  getNextDoublesServer,
  startsNewServeTurn,
  type DoublesPlayer,
  type DoublesServeOrder,
  type DoublesTeam,
  type ServeLogPoint,
} from "@/lib/utils/doubles-serving"

interface ScoreLike {
  points: readonly [number, number]
  isTiebreak?: boolean
  tiebreakPoints?: readonly [number, number]
}

/** Which of the four players serves the next point; null for singles or when no server is set. */
export function useDoublesServingPlayer(
  isDoubles: boolean,
  pointLog: readonly ServeLogPoint[],
  score: ScoreLike,
  currentServer: DoublesTeam | null | undefined,
  order?: DoublesServeOrder
): DoublesPlayer | null {
  return useMemo(() => {
    if (!isDoubles || !currentServer) return null
    return getNextDoublesServer(pointLog, currentServer, startsNewServeTurn(score), order)
  }, [isDoubles, pointLog, score, currentServer, order])
}
