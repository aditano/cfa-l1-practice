import type { Difficulty, Question } from '../types'

export type Filters = {
  losIds: string[]
  difficulties: Difficulty[]
  count: number
  shuffle: boolean
  unseenOnly: boolean
}

export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j]
    copy[j] = current
  }
  return copy
}

export function matchingQuestions(pool: Question[], filters: Filters, seen: Set<string>): Question[] {
  return pool.filter((question) => {
    const losId = question.losIds[0]
    if (!losId || !filters.losIds.includes(losId)) return false
    if (!filters.difficulties.includes(question.difficulty)) return false
    if (filters.unseenOnly && seen.has(question.id)) return false
    return true
  })
}

export function drawQuestions(pool: Question[], filters: Filters, seen: Set<string>): Question[] {
  const matched = matchingQuestions(pool, filters, seen)
  const ordered = filters.shuffle
    ? shuffleItems(matched)
    : [...matched].sort((a, b) => a.id.localeCompare(b.id))
  if (filters.count <= 0) return ordered
  return ordered.slice(0, Math.min(filters.count, ordered.length))
}
