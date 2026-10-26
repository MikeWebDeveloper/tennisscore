/**
 * @jest-environment node
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LiteScoreboard, pointLabel } from './lite-scoreboard'

const labels = { live: 'LIVE', finished: 'DONE' }
const score = (over: Record<string, unknown> = {}) =>
  ({ sets: [[6, 4]], games: [2, 1], points: [2, 3], isTiebreak: false, tiebreakPoints: [0, 0], ...over }) as any
const singles = [{ names: ['Ann'], ids: ['p1'] }, { names: ['Bob'], ids: ['p2'] }] as any
const doubles = [{ names: ['Ann', 'Cara'], ids: ['p1', 'p3'] }, { names: ['Bob', 'Dan'], ids: ['p2', 'p4'] }] as any

const html = (props: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(LiteScoreboard, { teams: singles, score: score(), inProgress: true, labels, ...props } as any))

describe('pointLabel', () => {
  it('maps points, deuce and advantage', () => {
    expect([0, 1, 2, 3].map((p) => pointLabel(p, 0))).toEqual(['0', '15', '30', '40'])
    expect(pointLabel(3, 3)).toBe('40')
    expect(pointLabel(4, 3)).toBe('Ad')
    expect(pointLabel(3, 4)).toBe('40')
    expect(pointLabel(5, 5)).toBe('40')
  })
  it('has no advantage in no-ad', () => {
    expect(pointLabel(3, 3, true)).toBe('40')
  })
})

describe('LiteScoreboard (server-rendered)', () => {
  it('shows names, set scores, current games and points while live', () => {
    const out = html({})
    expect(out).toContain('LIVE')
    expect(out).toContain('Ann')
    expect(out).toContain('Bob')
    expect(out).toMatch(/data-sets[^>]*>[\s\S]*?6[\s\S]*?<\/span>[\s\S]*?2[\s\S]*?<\/span>[\s\S]*?30/) // Ann: set 6, game 2, 30
    expect(out).toMatch(/data-side="p2"[\s\S]*?40/) // Bob has 40
  })

  it('marks the serving side', () => {
    const p1 = html({ servingTeam: 'p1' })
    const p2 = html({ servingTeam: 'p2' })
    const dotOf = (out: string, side: string) => new RegExp(`data-side="${side}"[^>]*><span aria-hidden="true" class="[^"]*bg-green-500`).test(out)
    expect(dotOf(p1, 'p1')).toBe(true)
    expect(dotOf(p1, 'p2')).toBe(false)
    expect(dotOf(p2, 'p2')).toBe(true)
  })

  it('underlines only the serving partner in doubles', () => {
    const out = html({ teams: doubles, servingTeam: 'p2', servingPlayer: 'p4' })
    expect(out).toMatch(/underline[^>]*>Dan</)
    expect(out).not.toMatch(/underline[^>]*>Bob</)
    expect(out).not.toMatch(/underline[^>]*>Ann</)
  })

  it('shows tiebreak points instead of game points', () => {
    const out = html({ score: score({ games: [6, 6], points: [0, 0], isTiebreak: true, tiebreakPoints: [5, 4] }) })
    expect(out).toMatch(/data-side="p1"[\s\S]*?data-points[^>]*>5</)
    expect(out).toMatch(/data-side="p2"[\s\S]*?data-points[^>]*>4</)
  })

  it('a finished match shows the final sets only, the winner emphasised, and no serve dot or game score', () => {
    const out = html({ inProgress: false, winner: 'p1', servingTeam: 'p1', score: score({ sets: [[6, 4], [6, 3]], games: [0, 0] }) })
    expect(out).toContain('DONE')
    expect(out).not.toContain('data-points')
    expect(out).not.toContain('bg-green-500')
    expect(out).toMatch(/font-bold text-foreground"><div class="truncate">Ann</)
    expect(out).toMatch(/text-muted-foreground"><div class="truncate">Bob</)
  })

  it('contains no script and no client component markers', () => {
    expect(html({})).not.toMatch(/<script|use client/i)
  })
})
