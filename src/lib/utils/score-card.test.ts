import { buildScoreCardModel, drawScoreCard, fitText, SCORE_CARD_SIZE } from './score-card'

/** Canvas stand-in that records every fillText call. Each character is 10px wide. */
function fakeCtx() {
  const texts: { text: string; x: number; fillStyle: string }[] = []
  const ctx: any = {
    fillStyle: '', font: '', textAlign: 'left', textBaseline: '',
    fillRect: jest.fn(),
    measureText: (t: string) => ({ width: t.length * 10 }),
    fillText(text: string, x: number) { texts.push({ text, x, fillStyle: this.fillStyle }) },
  }
  return { ctx, texts }
}

describe('buildScoreCardModel', () => {
  const sets = [{ p1: 6, p2: 4 }, { p1: 3, p2: 6 }, { p1: 7, p2: 6 }]

  it('lists each side with its games per set and marks the winner', () => {
    const m = buildScoreCardModel({ teamOne: 'Ann', teamTwo: 'Bob', sets, winner: 'p1', subtitle: '1/1/2026' })
    expect(m.rows[0]).toEqual({ name: 'Ann', games: [6, 3, 7], won: true })
    expect(m.rows[1]).toEqual({ name: 'Bob', games: [4, 6, 6], won: false })
    expect(m.subtitle).toBe('1/1/2026')
  })

  it('marks nobody as winner for a match in progress', () => {
    const m = buildScoreCardModel({ teamOne: 'Ann', teamTwo: 'Bob', sets, winner: null })
    expect(m.rows.map((r) => r.won)).toEqual([false, false])
  })
})

describe('fitText', () => {
  const { ctx } = fakeCtx()
  it('keeps text that fits and ellipsizes text that does not', () => {
    expect(fitText(ctx, 'Short', 100)).toBe('Short')
    const out = fitText(ctx, 'A very long doubles pair name', 100)
    expect(out.endsWith('…')).toBe(true)
    expect(ctx.measureText(out).width).toBeLessThanOrEqual(100)
  })
})

describe('drawScoreCard', () => {
  it('draws the brand, both names, every set score and the subtitle', () => {
    const { ctx, texts } = fakeCtx()
    const model = buildScoreCardModel({
      teamOne: 'Ann / Cara', teamTwo: 'Bob / Dan', winner: 'p2', subtitle: 'Final',
      sets: [{ p1: 4, p2: 6 }, { p1: 2, p2: 6 }],
    })
    drawScoreCard(ctx, model, SCORE_CARD_SIZE)
    const drawn = texts.map((t) => t.text)
    expect(drawn).toEqual(expect.arrayContaining(['Tenis.click', 'Ann', 'Cara', 'Bob', 'Dan', '4', '6', '2', 'Final']))
    expect(drawn.filter((t) => t === '6').length).toBe(2)
  })

  it('puts each doubles partner on its own line instead of truncating the pair', () => {
    const { ctx, texts } = fakeCtx()
    drawScoreCard(ctx, buildScoreCardModel({
      teamOne: 'Michal Latal / Karel Novotný', teamTwo: 'Petr Dvořák / Jan Procházka', winner: null, sets: [{ p1: 1, p2: 0 }],
    }))
    const drawn = texts.map((t) => t.text)
    expect(drawn).toEqual(expect.arrayContaining(['Michal Latal', 'Karel Novotný', 'Petr Dvořák', 'Jan Procházka']))
    expect(drawn.some((t) => t.includes(' / '))).toBe(false)
  })

  it('highlights only the winner\'s scores', () => {
    const { ctx, texts } = fakeCtx()
    drawScoreCard(ctx, buildScoreCardModel({ teamOne: 'A', teamTwo: 'B', winner: 'p1', sets: [{ p1: 6, p2: 1 }] }))
    const six = texts.find((t) => t.text === '6')!
    const one = texts.find((t) => t.text === '1')!
    expect(six.fillStyle).not.toBe(one.fillStyle)
  })

  it('never draws a name wider than the space beside the scores', () => {
    const { ctx, texts } = fakeCtx()
    const long = 'N'.repeat(200)
    drawScoreCard(ctx, buildScoreCardModel({ teamOne: long, teamTwo: 'B', winner: null, sets: [{ p1: 1, p2: 0 }] }))
    const name = texts.find((t) => t.text.startsWith('N'))!
    expect(name.text.length).toBeLessThan(long.length)
    expect(name.text.endsWith('…')).toBe(true)
  })
})
