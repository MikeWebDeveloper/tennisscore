import type { MatchPreset } from './match-preset'

type Translate = (key: string) => string

const DETAIL_KEYS: Record<MatchPreset['detailLevel'], string> = {
  points: 'pointsOnly', simple: 'simpleStats', 'shot-type': 'shotTypeStats', detailed: 'detailedStats', complex: 'detailedStats', custom: 'customStats',
}
const SET_FORMAT_KEYS = { standard: 'setFormatStandard', short: 'setFormatShort', fast4: 'setFormatFast4', pro: 'setFormatPro' } as const

/** "Na 2 vítězné sety · Bez výhody · Super tiebreak", in the "common" messages */
export function presetFormatLabel(preset: Pick<MatchPreset, 'sets' | 'setFormat' | 'scoring' | 'finalSet'>, t: Translate): string {
  return [
    t(`bestOf${preset.sets}`),
    preset.setFormat !== 'standard' ? t(SET_FORMAT_KEYS[preset.setFormat]) : null,
    t(preset.scoring === 'no-ad' ? 'noAdvantage' : 'advantage'),
    preset.sets > 1 ? t(preset.finalSet === 'super-tb' ? 'superTiebreak' : 'fullSet') : null,
  ].filter(Boolean).join(' · ')
}

export function presetDetailLabel(preset: Pick<MatchPreset, 'detailLevel'>, t: Translate): string {
  return t(DETAIL_KEYS[preset.detailLevel])
}
