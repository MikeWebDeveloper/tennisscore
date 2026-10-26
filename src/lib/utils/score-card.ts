/** Shareable score card: a square PNG with the final (or current) score. */

export interface ScoreCardInput {
  teamOne: string
  teamTwo: string
  sets: ReadonlyArray<{ p1: number; p2: number }>
  winner: 'p1' | 'p2' | null
  subtitle?: string
}

export interface ScoreCardRow {
  name: string
  games: number[]
  won: boolean
}

export interface ScoreCardModel {
  rows: [ScoreCardRow, ScoreCardRow]
  subtitle?: string
}

export const SCORE_CARD_SIZE = 1080

export function buildScoreCardModel(input: ScoreCardInput): ScoreCardModel {
  return {
    rows: [
      { name: input.teamOne, games: input.sets.map((s) => s.p1), won: input.winner === 'p1' },
      { name: input.teamTwo, games: input.sets.map((s) => s.p2), won: input.winner === 'p2' },
    ],
    subtitle: input.subtitle,
  }
}

/** Shorten text with an ellipsis until it fits `maxWidth`. */
export function fitText(ctx: Pick<CanvasRenderingContext2D, 'measureText'>, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let end = text.length
  while (end > 1 && ctx.measureText(text.slice(0, end) + '…').width > maxWidth) end--
  return text.slice(0, end).trimEnd() + '…'
}

const PALETTE = { bg: '#0a0a0b', card: '#141416', border: '#27272a', text: '#f4f4f5', muted: '#a1a1aa', accent: '#39ff14' }

export function drawScoreCard(ctx: CanvasRenderingContext2D, model: ScoreCardModel, size: number = SCORE_CARD_SIZE) {
  const pad = size * 0.08
  const font = (px: number, weight = 600) => `${weight} ${px}px Inter, system-ui, -apple-system, sans-serif`

  ctx.fillStyle = PALETTE.bg
  ctx.fillRect(0, 0, size, size)

  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.fillStyle = PALETTE.accent
  ctx.font = font(size * 0.045, 700)
  ctx.fillText('Tenis.click', pad, pad + size * 0.04)

  // Score panel
  const panelTop = size * 0.3
  const rowHeight = size * 0.2
  ctx.fillStyle = PALETTE.card
  ctx.fillRect(pad, panelTop, size - pad * 2, rowHeight * 2)
  ctx.fillStyle = PALETTE.border
  ctx.fillRect(pad, panelTop + rowHeight - 1, size - pad * 2, 2)

  const setCount = Math.max(model.rows[0].games.length, 1)
  const colWidth = size * 0.12
  const scoresWidth = colWidth * setCount
  const nameMax = size - pad * 2 - scoresWidth - size * 0.06

  model.rows.forEach((row, i) => {
    const baseline = panelTop + rowHeight * i + rowHeight * 0.62
    ctx.textAlign = 'left'
    ctx.fillStyle = row.won ? PALETTE.text : PALETTE.muted
    const partners = row.name.split(' / ')
    const x = pad + size * 0.03
    if (partners.length === 2) {
      // Doubles: one partner per line so both names stay readable
      ctx.font = font(size * 0.045, row.won ? 800 : 600)
      ctx.fillText(fitText(ctx, partners[0], nameMax), x, baseline - size * 0.03)
      ctx.fillText(fitText(ctx, partners[1], nameMax), x, baseline + size * 0.04)
    } else {
      ctx.font = font(size * 0.05, row.won ? 800 : 600)
      ctx.fillText(fitText(ctx, row.name, nameMax), x, baseline)
    }

    ctx.textAlign = 'center'
    row.games.forEach((games, s) => {
      ctx.fillStyle = row.won ? PALETTE.accent : PALETTE.text
      ctx.font = font(size * 0.07, row.won ? 800 : 600)
      ctx.fillText(String(games), size - pad - scoresWidth + colWidth * s + colWidth / 2, baseline)
    })
  })

  if (model.subtitle) {
    ctx.textAlign = 'left'
    ctx.fillStyle = PALETTE.muted
    ctx.font = font(size * 0.035, 500)
    ctx.fillText(fitText(ctx, model.subtitle, size - pad * 2), pad, size - pad)
  }
}

/** Render the card to a PNG blob (browser only). */
export function renderScoreCardBlob(model: ScoreCardModel, size: number = SCORE_CARD_SIZE): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  drawScoreCard(ctx, model, size)
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}
