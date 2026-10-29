import en from '@/i18n/messages/en.json'
import cs from '@/i18n/messages/cs.json'
import { UPDATES } from './whats-new-panel'

type Updates = Record<string, { title?: string; description?: string }>

describe("What's New updates", () => {
  it('lists the newest update first and includes the October 29 features', () => {
    const dates = UPDATES.map(update => update.date)
    expect(dates).toEqual([...dates].sort().reverse())
    expect(UPDATES.map(update => update.key)).toEqual(expect.arrayContaining(['interruptions', 'customStats', 'historySearch']))
  })

  it.each(UPDATES.map(update => update.key))('%s has a title and description in en and cs', key => {
    for (const messages of [en, cs]) {
      const entry = (messages.dashboard.whatsNewUpdates as Updates)[key]
      expect(entry?.title).toBeTruthy()
      expect(entry?.description).toBeTruthy()
    }
  })
})
