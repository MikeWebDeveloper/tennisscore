import { createControllerChangeHandler } from './service-worker-controller'

it('does not reload on first installation, but reloads on a later update', () => {
  const reload = jest.fn()
  const onChange = createControllerChangeHandler(false, reload)
  onChange()
  expect(reload).not.toHaveBeenCalled()
  onChange()
  expect(reload).toHaveBeenCalledTimes(1)
})

it('reloads when a page with an existing controller receives an update', () => {
  const reload = jest.fn()
  createControllerChangeHandler(true, reload)()
  expect(reload).toHaveBeenCalledTimes(1)
})
