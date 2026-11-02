import type { Match } from '@/lib/types'
import { openSet, parseDbScore } from './db-score'
import { matchStatusKey } from './match-status'

type ExportMatch = Pick<Match, '$id' | 'matchDate' | 'playerOneId' | 'playerTwoId' | 'score' | 'pointLog'>
  & Partial<Pick<Match, 'playerThreeId' | 'playerFourId' | 'tournamentName' | 'winnerId' | 'retirementReason' | 'detailLevel'>>
  & { status?: string }

export interface ExportRow {
  id: string
  date: string
  tournament: string
  type: 'singles' | 'doubles'
  teamOne: string
  teamTwo: string
  score: string
  status: string
  winner: string
  endReason: string
  detailLevel: string
  points: number
}

/** One readable row per match: both teams, the whole score (the cut-short set included), result and why it ended */
export function exportRows(matches: ExportMatch[], names: Record<string, string>): ExportRow[] {
  const name = (id?: string | null) => (id ? names[id] ?? '' : '')
  const team = (a: string, b?: string | null) => (b ? `${name(a)} / ${name(b)}` : name(a))
  return matches.map((match) => {
    const doubles = Boolean(match.playerThreeId && match.playerFourId)
    const status = matchStatusKey(match)
    const score = parseDbScore(match.score)
    const open = openSet(score, status !== 'in-progress')
    const winnerTeam = match.winnerId && [match.playerOneId, match.playerThreeId].includes(match.winnerId) ? team(match.playerOneId, doubles ? match.playerThreeId : null)
      : match.winnerId && [match.playerTwoId, match.playerFourId].includes(match.winnerId) ? team(match.playerTwoId, doubles ? match.playerFourId : null) : ''
    return {
      id: match.$id,
      date: match.matchDate.slice(0, 10),
      tournament: match.tournamentName?.trim() ?? '',
      type: doubles ? 'doubles' : 'singles',
      teamOne: team(match.playerOneId, doubles ? match.playerThreeId : null),
      teamTwo: team(match.playerTwoId, doubles ? match.playerFourId : null),
      score: [...score.sets, ...(open ? [open.games] : [])].map(([a, b]) => `${a}:${b}`).join(' '),
      status,
      winner: status === 'completed' ? winnerTeam : '',
      endReason: match.retirementReason ?? '',
      detailLevel: match.detailLevel ?? '',
      points: match.pointLog?.length ?? 0,
    }
  })
}

const cell = (value: unknown, delimiter: string) => {
  const text = String(value ?? '')
  return text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * CSV with a BOM, so Excel reads the diacritics as UTF-8. Czech Excel splits columns on ";", English on ",".
 */
export function toCsv<T extends object>(rows: T[], columns: [keyof T, string][], delimiter: ';' | ','): string {
  const lines = [columns.map(([, label]) => cell(label, delimiter)).join(delimiter)]
  for (const row of rows) lines.push(columns.map(([key]) => cell(row[key], delimiter)).join(delimiter))
  return `﻿${lines.join('\r\n')}\r\n`
}
