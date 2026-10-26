/**
 * @jest-environment node
 */
import en from './messages/en.json'
import cs from './messages/cs.json'

const get = (obj: any, ns: string, key: string) => obj?.[ns]?.[key]

// Keys added for the sync indicator, themes and shell. Every active locale must define them.
const REQUIRED: Record<string, string[]> = {
  match: ['syncSaved', 'syncSaving', 'syncUnsent'],
  navigation: [
    'skipToContent', 'theme', 'themeDark', 'themeDim', 'themeLight', 'switchTheme',
    'openNavigationMenu', 'collapseNavigation', 'mainContent', 'new', 'createNewMatch',
    'newMatchButton', 'settings', 'signOut',
  ],
}

describe('translation files', () => {
  for (const [ns, keys] of Object.entries(REQUIRED)) {
    it.each(keys)(`${ns}.%s exists in en and cs`, (key) => {
      expect(typeof get(en, ns, key)).toBe('string')
      expect(get(en, ns, key).length).toBeGreaterThan(0)
      expect(typeof get(cs, ns, key)).toBe('string')
      expect(get(cs, ns, key).length).toBeGreaterThan(0)
    })
  }

  it('cs translations differ from en for the new sync strings (not left in English)', () => {
    for (const key of REQUIRED.match) expect(get(cs, 'match', key)).not.toBe(get(en, 'match', key))
  })

  it('navigation namespace has the same keys in en and cs', () => {
    expect(Object.keys((cs as any).navigation).sort()).toEqual(Object.keys((en as any).navigation).sort())
  })
})
