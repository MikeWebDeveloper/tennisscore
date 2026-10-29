import { ACE_PLACEMENTS, servePlacementLabelKey } from './serve-placement'

it('offers net cord, out of the court and on the T for aces, without body', () => {
  expect(ACE_PLACEMENTS.map(option => option.id)).toEqual(['net-cord', 'wide', 't'])
})

it('labels saved aces with the ace wording and other serves with the general wording', () => {
  expect(servePlacementLabelKey('net-cord', true)).toBe('serveNetCord')
  expect(servePlacementLabelKey('wide', true)).toBe('serveOutOfCourt')
  expect(servePlacementLabelKey('t', true)).toBe('serveOnTheT')
  // Older aces may still be saved as "body"
  expect(servePlacementLabelKey('body', true)).toBe('body')
  expect(servePlacementLabelKey('wide', false)).toBe('wide')
  expect(servePlacementLabelKey('t', false)).toBe('tDownTheMiddle')
})
