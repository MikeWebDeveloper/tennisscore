import { END_REASONS, endReasonMessageKey } from './end-reasons'

it('offers retirement and injury as reasons to end a match early (weather belongs to interruptions)', () => {
  expect(END_REASONS).toEqual(['retired', 'injury'])
})

it('maps saved reasons to match messages, keeping older weather endings readable', () => {
  expect(endReasonMessageKey('retired')).toBe('playerRetired')
  expect(endReasonMessageKey('injury')).toBe('injury')
  expect(endReasonMessageKey('weather')).toBe('weatherConditions')
  expect(endReasonMessageKey(undefined)).toBeNull()
  expect(endReasonMessageKey('')).toBeNull()
  expect(endReasonMessageKey('something-else')).toBeNull()
})
