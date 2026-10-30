import { normalizeTextForSearch } from "@/lib/utils"

const words = (text: string) => normalizeTextForSearch(text).split(/\s+/).filter(Boolean)

/**
 * True when every word typed appears in the name, ignoring case and diacritics, so "hajkova" finds
 * "Hájková Karolína" and "karolina hajkova" works in either order. An empty search matches everyone.
 */
export function nameMatchesSearch(name: string, query: string): boolean {
  const normalizedName = normalizeTextForSearch(name)
  return words(query).every((word) => normalizedName.includes(word))
}

/** 0 when a word of the name starts with the first word typed, otherwise 1: closer matches sort first. */
export function searchRank(name: string, query: string): number {
  const [first] = words(query)
  if (!first) return 0
  return words(name).some((word) => word.startsWith(first)) ? 0 : 1
}
