import type { StoredMock } from './mockExam'
import type { TopicId } from '../types'

const PROGRESS_KEY = 'l1-practice-progress-v1'
const PRESET_KEY = 'l1-practice-preset-v1'
const SESSION_KEY = 'l1-practice-session-v1'
const MOCK_KEY = 'l1-practice-mock-v1'

export type Attempt = {
  id: string
  topicId: TopicId
  correct: boolean
  at: number
}

export type Preset = {
  losIds: string[]
  label: string
}

export type StoredSession = {
  questionIds: string[]
  index: number
  answers: { id: string; choice: number; correct: boolean }[]
  revealed: boolean
  phase: 'session' | 'results' | 'review'
}

export function loadAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { attempts?: Attempt[] }
    return Array.isArray(parsed.attempts) ? parsed.attempts : []
  } catch {
    return []
  }
}

export function recordAttempt(attempt: Attempt): void {
  const attempts = loadAttempts()
  attempts.push(attempt)
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, attempts }))
}

export function clearAttempts(): void {
  localStorage.removeItem(PROGRESS_KEY)
}

export function latestAttempts(attempts: Attempt[]): Map<string, Attempt> {
  const map = new Map<string, Attempt>()
  for (const attempt of attempts) map.set(attempt.id, attempt)
  return map
}

let stickyLosIds: string[] | null = null

export function savePreset(preset: Preset): void {
  stickyLosIds = preset.losIds
  sessionStorage.setItem(PRESET_KEY, JSON.stringify(preset))
}

export function peekPresetIds(): string[] | null {
  if (stickyLosIds) return stickyLosIds
  return readPreset()?.losIds ?? null
}

export function clearStickyPreset(): void {
  stickyLosIds = null
  sessionStorage.removeItem(PRESET_KEY)
}

export function readPreset(): Preset | null {
  const raw = sessionStorage.getItem(PRESET_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Preset
    if (!Array.isArray(parsed.losIds)) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPreset(): void {
  sessionStorage.removeItem(PRESET_KEY)
}

export function saveSession(session: StoredSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): StoredSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function loadMock(): StoredMock | null {
  try {
    const raw = localStorage.getItem(MOCK_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredMock
    if (parsed.version !== 1 || !parsed.sessions?.[1] || !parsed.sessions?.[2]) return null
    return parsed
  } catch {
    return null
  }
}

export function saveMock(exam: StoredMock): void {
  localStorage.setItem(MOCK_KEY, JSON.stringify(exam))
}

export function clearMock(): void {
  localStorage.removeItem(MOCK_KEY)
}

export function mockResumeLabel(exam: StoredMock | null): string | null {
  if (!exam) return null
  if (exam.phase === 'results' || exam.phase === 'review') return 'Review last mock'
  if (exam.phase === 'break') return 'Resume mock (break)'
  return `Resume mock (session ${exam.session})`
}
