import { MATCH_LIST_FIELDS } from './match-list-fields'

describe('MATCH_LIST_FIELDS', () => {
  it('only uses system attributes Appwrite accepts in select()', () => {
    const allowedSystem = new Set(['$id', '$createdAt', '$updatedAt', '$permissions'])
    for (const field of MATCH_LIST_FIELDS.filter(f => f.startsWith('$'))) {
      expect(allowedSystem.has(field)).toBe(true)
    }
  })

  it('leaves out the heavy columns the list never renders', () => {
    expect(MATCH_LIST_FIELDS).not.toContain('pointLog')
    expect(MATCH_LIST_FIELDS).not.toContain('events')
  })

  it('has no duplicates', () => {
    expect(new Set(MATCH_LIST_FIELDS).size).toBe(MATCH_LIST_FIELDS.length)
  })
})
