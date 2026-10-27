import { MATCH_LIST_FIELDS } from './match-list-fields'

describe('MATCH_LIST_FIELDS', () => {
  it('only selects attributes present in the connected matches collection', () => {
    // Snapshot of the preview Appwrite collection, checked with listAttributes.
    const attributes = new Set([
      'playerOneId', 'playerTwoId', 'matchDate', 'matchFormat', 'status',
      'winnerId', 'score', 'userId', 'pointLog', 'events', 'playerThreeId',
      'playerFourId', 'isDoubles', 'detailLevel', 'endTime', 'retirementReason',
      'startTime', 'setDurations', 'tournamentName', 'isDeleted', 'deletedAt', 'deletedBy',
    ])
    expect(MATCH_LIST_FIELDS.filter(field => !field.startsWith('$') && !attributes.has(field))).toEqual([])
  })
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
