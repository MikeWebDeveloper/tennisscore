const mockToastError = jest.fn()
jest.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }))
const mockRender = jest.fn()
jest.mock('@/lib/utils/score-card', () => ({
  ...jest.requireActual('@/lib/utils/score-card'),
  renderScoreCardBlob: (...a: unknown[]) => mockRender(...a),
}))

import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { ShareScoreCardButton } from './share-score-card-button'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const input = { teamOne: 'Ann', teamTwo: 'Bob', winner: 'p1' as const, sets: [{ p1: 6, p2: 4 }] }
const flush = () => new Promise((r) => setTimeout(r, 0))

function mount(props = {}) {
  const c = document.createElement('div')
  act(() => { createRoot(c).render(createElement(ShareScoreCardButton, { input, ...props })) })
  return c
}
async function click(c: HTMLElement) {
  await act(async () => { (c.querySelector('button') as HTMLButtonElement).click(); await flush() })
}

describe('ShareScoreCardButton', () => {
  beforeEach(() => {
    mockRender.mockReset().mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
    mockToastError.mockClear()
    delete (navigator as any).canShare
    delete (navigator as any).share
    ;(URL as any).createObjectURL = jest.fn(() => 'blob:x')
    ;(URL as any).revokeObjectURL = jest.fn()
  })

  it('renders nothing when there is no score yet', () => {
    expect(mount({ input: { ...input, sets: [] } }).innerHTML).toBe('')
  })

  it('uses the native share sheet when files can be shared', async () => {
    const share = jest.fn(async () => {})
    ;(navigator as any).canShare = () => true
    ;(navigator as any).share = share
    await click(mount())
    expect(share).toHaveBeenCalledTimes(1)
    expect((share.mock.calls[0] as any)[0].files[0].type).toBe('image/png')
  })

  it('treats closing the share sheet as a non-error', async () => {
    ;(navigator as any).canShare = () => true
    ;(navigator as any).share = jest.fn(async () => { throw new DOMException('closed', 'AbortError') })
    await click(mount())
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('falls back to downloading the PNG when sharing files is unsupported', async () => {
    const clicks: string[] = []
    const orig = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () { clicks.push(this.download) }
    await click(mount({ fileName: 'my-score.png' }))
    HTMLAnchorElement.prototype.click = orig
    expect(clicks).toEqual(['my-score.png'])
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('shows an error toast when the card cannot be created', async () => {
    mockRender.mockResolvedValue(null)
    await click(mount())
    expect(mockToastError).toHaveBeenCalledWith('match.scoreCardFailed')
  })
})
