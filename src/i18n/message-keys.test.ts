/**
 * @jest-environment node
 */
import en from './messages/en.json'
import cs from './messages/cs.json'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { IntlMessageFormat } from 'intl-messageformat'

const get = (obj: any, ns: string, key: string) => obj?.[ns]?.[key]

// Keys added for the sync indicator, themes and shell. Every active locale must define them.
const REQUIRED: Record<string, string[]> = {
  dashboard: ['resumeMatch', 'continueYourMatch', 'singlesMatches', 'viewDetailedStatistics'],
  statistics: ['loadingOlderMatches', 'historyLoadFailed'],
  match: ['syncSaved', 'syncSaving', 'syncUnsent', 'shareScoreCard', 'scoreCardFailed', 'watchLive', 'watchFinished', 'watchPlayer', 'watchRefreshNote', 'watchFullView', 'watchLiteView', 'configureStats', 'pauseReasonTitle', 'pauseReason_rain', 'pauseReason_injury', 'pauseReason_darkness', 'pauseReason_other'],
  common: ['firstServer', 'firstServerHint', 'setLength', 'setFormatStandard', 'setFormatShort', 'setFormatFast4', 'setFormatPro', 'customStats', 'configureYourTracking', 'chooseCustomStatistics', 'customCategory_serve-placement', 'customCategory_serve-speed', 'customCategory_return-quality', 'customCategory_rally-type', 'startMatch', 'returnQuality', 'savePoint', 'lastTenPoints', 'retiredStatus', 'recordedCustomStats', 'customStatistic', 'recordedRallyAverage'],
  navigation: [
    'skipToContent', 'theme', 'themeDark', 'themeDim', 'themeLight', 'switchTheme',
    'openNavigationMenu', 'collapseNavigation', 'mainContent', 'new', 'createNewMatch',
    'newMatchButton', 'settings', 'signOut', 'installApp', 'installAppIos',
  ],
}

describe('translation files', () => {
  it('contains static translation keys used by app screens and shared components', () => {
    const files = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const item = path.join(directory, entry.name)
      return entry.isDirectory() ? files(item) : item.endsWith('.tsx') && !item.includes('.test.') ? [item] : []
    })
    const errors: string[] = []
    for (const file of [...files(path.join(process.cwd(), 'src/app')), ...files(path.join(process.cwd(), 'src/components/shared'))]) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
      const aliases = new Map<string, string>()
      const visit = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'useTranslations' && node.initializer.arguments[0] && ts.isStringLiteral(node.initializer.arguments[0])) aliases.set(node.name.text, node.initializer.arguments[0].text)
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && aliases.has(node.expression.text) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const namespace = aliases.get(node.expression.text)!, key = node.arguments[0].text
          for (const [locale, messages] of [['en', en], ['cs', cs]] as const) {
            const value = key.split('.').reduce<unknown>((current, part) => current && typeof current === 'object' ? (current as Record<string, unknown>)[part] : undefined, (messages as Record<string, unknown>)[namespace])
            if (typeof value !== 'string') errors.push(`${path.relative(process.cwd(), file)}: ${locale}.${namespace}.${key}`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
    expect(errors).toEqual([])
  })
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

  it('every message parses as ICU syntax (next-intl throws on {{name}} placeholders)', () => {
    const errors: string[] = []
    const walk = (locale: string, node: unknown, prefix: string) => {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const id = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object') walk(locale, value, id)
        else if (typeof value === 'string') {
          try { new IntlMessageFormat(value, locale) } catch (error) { errors.push(`${locale}.${id}: ${(error as Error).message}`) }
        }
      }
    }
    walk('en', en, '')
    walk('cs', cs, '')
    expect(errors).toEqual([])
  })

  it('navigation namespace has the same keys in en and cs', () => {
    expect(Object.keys((cs as any).navigation).sort()).toEqual(Object.keys((en as any).navigation).sort())
  })
})
