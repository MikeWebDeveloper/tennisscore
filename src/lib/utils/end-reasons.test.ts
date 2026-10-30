import { END_REASONS, endReasonMessageKey, matchEndTime } from './end-reasons'

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

describe('matchEndTime', () => {
  const now = new Date('2026-10-30T07:37:46.974Z')

  // Sofie Látalová vs Mondoková: points played on 6 Sep, the match ended on 30 Oct, so it showed 1 293 h
  it('is the time of the last point, however much later the match is ended', () => {
    const pointLog = [{ timestamp: '2026-09-06T09:56:06.976Z' }, { timestamp: '2026-09-06T10:34:50.661Z' }]
    expect(matchEndTime(pointLog, now)).toBe('2026-09-06T10:34:50.661Z')
  })

  it('takes the latest point even if the log is out of order', () => {
    const pointLog = [{ timestamp: '2026-09-06T10:34:50.661Z' }, { timestamp: '2026-09-06T10:01:00.000Z' }]
    expect(matchEndTime(pointLog, now)).toBe('2026-09-06T10:34:50.661Z')
  })

  it('is now when no point has a time', () => {
    expect(matchEndTime([], now)).toBe(now.toISOString())
    expect(matchEndTime([{}, { timestamp: 'not a date' }], now)).toBe(now.toISOString())
  })
})
