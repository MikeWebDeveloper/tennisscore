import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { AiAnalysisCard } from './ai-analysis-card'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
// Real Czech messages, so a missing or English text shows up
jest.mock('@/i18n', () => {
  const messages = jest.requireActual('@/i18n/messages/cs.json') as Record<string, Record<string, unknown>>
  const { IntlMessageFormat } = jest.requireActual('intl-messageformat')
  return {
    useLocale: () => 'cs',
    useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const message = messages[namespace]?.[key]
      return typeof message === 'string' ? String(new IntlMessageFormat(message, 'cs').format(values)) : `${namespace}.${key}`
    },
  }
})

async function render(answer: unknown) {
  // jsdom has no Response: a minimal stand-in with what the card reads
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => answer })) as unknown as typeof fetch
  const onChange = jest.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<AiAnalysisCard matchId="m1" onChange={onChange} />))
  return { container, onChange, cleanup: () => { act(() => root.unmount()); container.remove() } }
}

describe('AiAnalysisCard', () => {
  it('tells the person to come back while the analysis is being written, with no second start button', async () => {
    const { container, onChange, cleanup } = await render({ saved: null, job: { status: 'pending', startedAt: new Date().toISOString() } })
    expect(container.querySelector('[data-ai-pending]')?.textContent).toContain('AI rozbor se připravuje')
    expect(container.querySelector('[data-ai-pending]')?.textContent).toContain('2–3 minuty')
    expect(container.querySelector('[data-ai-start]')).toBeNull()
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ job: expect.objectContaining({ status: 'pending' }) }))
    cleanup()
  })

  it('shows a finished analysis and offers to write a new one', async () => {
    const { container, cleanup } = await render({
      saved: { analysis: { summary: 'Jasná výhra.', strengths: ['Podání'], improvements: [], trainingTips: ['Servis 3 × 10'] }, model: 'gemini-test', createdAt: '2026-10-30T12:00:00Z' },
      job: { status: 'idle' },
    })
    expect(container.textContent).toContain('Jasná výhra.')
    expect(container.textContent).toContain('Servis 3 × 10')
    expect(container.querySelector('[data-ai-start]')?.textContent).toBe('Vytvořit znovu')
    cleanup()
  })

  it('explains a failed attempt in Czech', async () => {
    const { container, cleanup } = await render({ saved: null, job: { status: 'failed', reason: 'quota' } })
    expect(container.querySelector('[role="alert"]')?.textContent).toBe('Denní limit Gemini je vyčerpaný u všech modelů. Zkuste to zítra.')
    cleanup()
  })
})
