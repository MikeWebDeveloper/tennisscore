import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, features } from '@/lib/framer-motion-config'
import { CompactMatchTypeStep } from './compact-match-type-step'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

it('advances immediately once even if a choice is clicked repeatedly', () => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const onChange = jest.fn(), onComplete = jest.fn()
  act(() => root.render(createElement(LazyMotion, { features }, createElement(CompactMatchTypeStep, { onChange, onComplete }))))
  const buttons = container.querySelectorAll('button')
  expect(buttons).toHaveLength(2)
  act(() => { buttons[0].click(); buttons[1].click() })
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenCalledWith('singles')
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(buttons[0].getAttribute('aria-pressed')).toBe('true')
  act(() => root.unmount())
})
