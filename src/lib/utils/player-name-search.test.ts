import { nameMatchesSearch, searchRank } from './player-name-search'

// The names from Mike's PDF (point 10): the new-match search listed players unrelated to the query
const names = [
  'Davidová Klaudie',
  'Hájková Karolína',
  'Hasmanová Johana',
  'Havlová Veronika',
  'Hendrichová Klára',
  'Horová Johana',
  'Jindřichová Nela',
  'Koudelová Sabina',
  'Kovandová Veronika',
  'Srnková Johana',
  'Strnadová Elin',
]
const search = (query: string) => names.filter((name) => nameMatchesSearch(name, query))

describe('nameMatchesSearch', () => {
  it('finds only the players whose first or last name contains the text', () => {
    expect(search('Johana')).toEqual(['Hasmanová Johana', 'Horová Johana', 'Srnková Johana'])
    expect(search('Davidová')).toEqual(['Davidová Klaudie'])
  })

  it('finds nobody when no name contains the text', () => {
    expect(search('Nikola')).toEqual([])
  })

  it('ignores case and diacritics', () => {
    expect(search('hajkova')).toEqual(['Hájková Karolína'])
    expect(search('HÁJKOVÁ')).toEqual(['Hájková Karolína'])
    expect(search('jindrich')).toEqual(['Jindřichová Nela'])
  })

  it('accepts the full name in either order', () => {
    expect(search('karolina hajkova')).toEqual(['Hájková Karolína'])
    expect(search('Hájková Karolína')).toEqual(['Hájková Karolína'])
  })

  it('lists everyone while the search is empty', () => {
    expect(search('')).toEqual(names)
    expect(search('   ')).toEqual(names)
  })
})

describe('searchRank', () => {
  it('puts names that start with the text before names that only contain it', () => {
    expect(searchRank('Novák Petr', 'nov')).toBeLessThan(searchRank('Ivanová Jana', 'nov'))
    expect(searchRank('Horová Johana', 'jo')).toBe(searchRank('Johanová Eva', 'jo'))
  })
})
