import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Combobox, type ComboboxOption } from './combobox'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom lacks the browser APIs the popover and the command list measure with
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= function () {}

// Real Appwrite ids are random letters and digits; the old fuzzy filter matched letters inside them
const player = (id: string, label: string): ComboboxOption => ({ value: id, label, group: 'Sledovaní hráči' })
const options: ComboboxOption[] = [
  { value: 'create-new', label: 'Vytvořit nového hráče', group: 'Akce', pinned: true },
  player('68a1nk0ilb9a2c4d5e6f', 'Hájková Karolína'),
  player('68b2j3o4h5a6n7a8e9f0', 'Hasmanová Johana'),
  player('68c3k1o2l3a4b5c6d7e8', 'Jindřichová Nela'),
  player('68d4e5f6a7b8c9d0e1f2', 'Horová Johana'),
  player('68e5n1i2k3o4l5a6b7c8', 'Havlová Veronika'),
  player('68f6a7b8c9d0e1f2a3b4', 'Srnková Johana'),
  player('6901a2b3c4d5e6f7a8b9', 'Davidová Klaudie'),
]

let root: Root
let container: HTMLDivElement
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

async function openAndType(query: string) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <Combobox
        options={options}
        placeholder="Hledat nebo vybrat hráče"
        searchPlaceholder="Hledat podle jména"
        emptyText="Žádný hráč nenalezen"
        emptyHint="Zkuste jiné jméno nebo vytvořte nového hráče."
      />
    )
  )
  await act(async () => (container.querySelector('[role="combobox"]') as HTMLButtonElement).click())
  const input = document.querySelector('input[cmdk-input]') as HTMLInputElement
  // React listens for input events; set the value the way typing would
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setValue.call(input, query)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  return document.querySelector('[role="listbox"]') as HTMLElement
}

const listed = (list: HTMLElement) => [...list.querySelectorAll('[role="option"]')].map((option) => option.textContent)

it('lists only the players whose name contains the search', async () => {
  const list = await openAndType('Johana')
  expect(listed(list)).toEqual(['Hasmanová Johana', 'Horová Johana', 'Srnková Johana', 'Vytvořit nového hráče'])
})

it('ignores diacritics', async () => {
  const list = await openAndType('davidova')
  expect(listed(list)).toEqual(['Davidová Klaudie', 'Vytvořit nového hráče'])
})

it('shows an empty state when nobody matches, and still offers to create the player', async () => {
  const list = await openAndType('Nikola')
  expect(listed(list)).toEqual(['Vytvořit nového hráče'])
  expect(list.textContent).toContain('Žádný hráč nenalezen')
  expect(list.textContent).toContain('Zkuste jiné jméno nebo vytvořte nového hráče.')
})

it('lists every option, actions first, before anything is typed', async () => {
  const list = await openAndType('')
  expect(listed(list)).toHaveLength(options.length)
  expect(listed(list)[0]).toBe('Vytvořit nového hráče')
})

it('uses the translated search placeholder instead of a fixed English one', async () => {
  await openAndType('')
  expect(document.querySelector('input[cmdk-input]')?.getAttribute('placeholder')).toBe('Hledat podle jména')
})
