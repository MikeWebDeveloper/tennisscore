"use client"

import { useEffect, useState } from 'react'
import { LiteScoreboard, type LitePlayerId } from '@/components/shared/lite-scoreboard'
import { usePublicMatchPolling } from '@/hooks/use-public-match-polling'
import { parseDbScore } from '@/lib/utils/db-score'
import { deriveCurrentServer } from '@/lib/utils/current-server'
import { getNextDoublesServer, startsNewServeTurn, type ServeLogPoint } from '@/lib/utils/doubles-serving'
import { normalizeMatchFormat } from '@/lib/utils/match-format'
import { isPauseReason } from '@/lib/utils/pause-reasons'

type Team = { names: readonly string[]; ids: readonly LitePlayerId[] }
interface Props {
  matchId: string
  teams: readonly [Team, Team]
  playerOneId: string
  playerTwoId: string
  playerThreeId?: string
  playerFourId?: string
  initialScore: string
  initialStatus: string
  initialIsPaused?: boolean
  initialPauseReason?: string
  initialWinnerId?: string
  initialPointLog: string[]
  format: string
  labels: { live: string; finished: string; paused?: string }
  reasonLabels?: Record<string, string>
}

export function CompactLiveScoreboard(props: Props) {
  const [data, setData] = useState({ score: props.initialScore, status: props.initialStatus, winnerId: props.initialWinnerId, pointLog: props.initialPointLog, isPaused: props.initialIsPaused ?? false, pauseReason: props.initialPauseReason })
  const lastUpdate = usePublicMatchPolling(data.status === 'Completed' ? '' : props.matchId)
  useEffect(() => {
    if (!lastUpdate) return
    setData(previous => ({
      score: lastUpdate.score ?? previous.score,
      status: lastUpdate.status ?? previous.status,
      winnerId: lastUpdate.winnerId ?? previous.winnerId,
      pointLog: lastUpdate.pointLog ?? previous.pointLog,
      isPaused: lastUpdate.isPaused ?? previous.isPaused,
      pauseReason: lastUpdate.pauseReason ?? previous.pauseReason,
    }))
  }, [lastUpdate])

  const inProgress = data.status !== 'Completed'
  const score = parseDbScore(data.score)
  const format = normalizeMatchFormat(props.format)
  const pointLog: ServeLogPoint[] = data.pointLog.map(point => { try { return JSON.parse(point) } catch { return null } }).filter(Boolean)
  const servingTeam = inProgress ? deriveCurrentServer(pointLog as { server: 'p1' | 'p2' }[], score) : undefined
  const servingPlayer = inProgress && props.playerThreeId && props.playerFourId && servingTeam
    ? getNextDoublesServer(pointLog, servingTeam, startsNewServeTurn(score), format.doublesServeOrder) : null
  const winner = data.winnerId && [props.playerOneId, props.playerThreeId].includes(data.winnerId) ? 'p1'
    : data.winnerId && [props.playerTwoId, props.playerFourId].includes(data.winnerId) ? 'p2' : null
  const teams: [{ names: string[]; ids: LitePlayerId[] }, { names: string[]; ids: LitePlayerId[] }] = [
    { names: [...props.teams[0].names], ids: [...props.teams[0].ids] },
    { names: [...props.teams[1].names], ids: [...props.teams[1].ids] },
  ]

  const paused = data.isPaused && isPauseReason(data.pauseReason) && props.reasonLabels?.[data.pauseReason]
    ? `${props.labels.paused} — ${props.reasonLabels[data.pauseReason]}` : props.labels.paused
  return <LiteScoreboard teams={teams} score={score} noAd={format.noAd} inProgress={inProgress} paused={data.isPaused} servingTeam={servingTeam} servingPlayer={servingPlayer} winner={winner} labels={{ ...props.labels, paused }} />
}
