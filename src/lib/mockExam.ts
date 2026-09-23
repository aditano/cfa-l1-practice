import { TOPICS } from '../curriculum'
import type { Question, TopicId } from '../types'

/** Official Level I timing: two 90-question sessions, 135 minutes each. */
export const MOCK_SESSION_SIZE = 90
export const MOCK_SESSION_MINUTES = 135
export const MOCK_SESSION_MS = MOCK_SESSION_MINUTES * 60 * 1000
export const MOCK_EXAM_SIZE = MOCK_SESSION_SIZE * 2

/**
 * Integer counts inside the 2026 Level I weight ranges (count / 180).
 * Session 1 sums to 90 and session 2 sums to 90.
 *
 * Session 1 — Ethical and Professional Standards, Quantitative Methods,
 * Economics, Financial Statement Analysis, Corporate Issuers.
 * Session 2 — Equity Investments, Fixed Income, Derivatives,
 * Alternative Investments, Portfolio Management.
 */
export const MOCK_ALLOCATION: Record<TopicId, number> = {
  ethics: 30,
  quant: 13,
  economics: 13,
  fsa: 21,
  corporate: 13,
  equity: 23,
  'fixed-income': 22,
  derivatives: 12,
  alternatives: 15,
  portfolio: 18,
}

export type MockChoice = {
  choice: number | null
  flagged: boolean
}

export type MockSessionState = {
  questionIds: string[]
  index: number
  answers: Record<string, MockChoice>
  submitted: boolean
  endsAt: number | null
  shortfalls: string[]
}

export type MockPhase = 'session' | 'break' | 'results' | 'review'

export type StoredMock = {
  version: 1
  seed: number
  phase: MockPhase
  session: 1 | 2
  sessions: { 1: MockSessionState; 2: MockSessionState }
  reviewFilter: 'all' | 'missed' | 'flagged'
}

export function formatExamClock(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function mockWeightPercent(count: number): number {
  return (count / MOCK_EXAM_SIZE) * 100
}

export function mockAllocationProblems(): string[] {
  const problems: string[] = []
  const seen = new Set<TopicId>()
  let session1 = 0
  let session2 = 0
  for (const topic of TOPICS) {
    seen.add(topic.id)
    const count = MOCK_ALLOCATION[topic.id]
    if (!Number.isInteger(count) || count <= 0) {
      problems.push(`${topic.id} mock allocation must be a positive integer`)
      continue
    }
    const pct = mockWeightPercent(count)
    if (pct < topic.weightMin - 1e-9 || pct > topic.weightMax + 1e-9) {
      problems.push(
        `${topic.id} mock count ${count} is ${pct.toFixed(2)}% of 180, outside ${topic.weightMin}–${topic.weightMax}%`,
      )
    }
    if (topic.session === 1) session1 += count
    else session2 += count
  }
  for (const id of Object.keys(MOCK_ALLOCATION) as TopicId[]) {
    if (!seen.has(id)) problems.push(`Mock allocation has unknown topic ${id}`)
  }
  if (session1 !== MOCK_SESSION_SIZE) problems.push(`Session 1 allocates ${session1} questions, not ${MOCK_SESSION_SIZE}`)
  if (session2 !== MOCK_SESSION_SIZE) problems.push(`Session 2 allocates ${session2} questions, not ${MOCK_SESSION_SIZE}`)
  return problems
}

export function sessionTopicIds(session: 1 | 2): TopicId[] {
  return TOPICS.filter((topic) => topic.session === session).map((topic) => topic.id)
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function seededShuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j]
    copy[j] = current
  }
  return copy
}

export type BuiltMock = {
  sessionQuestions: [Question[], Question[]]
  shortfalls: string[]
}

/**
 * Draw a two-session mock without replacement.
 * Topics stay in official session order. Within a topic the draw is shuffled.
 * If a topic cannot fill its count, the shortfall is recorded and the session
 * is filled from other topics in that same session so the paper still has 90 items.
 */
export function buildMockExam(pool: Question[], seed: number): BuiltMock {
  const rng = makeRng(seed)
  const shortfalls: string[] = []
  const used = new Set<string>()
  const sessionQuestions = ([1, 2] as const).map((session) => {
    const topics = TOPICS.filter((topic) => topic.session === session)
    const picked: Question[] = []
    for (const topic of topics) {
      const need = MOCK_ALLOCATION[topic.id]
      const available = seededShuffle(
        pool.filter((question) => question.topicId === topic.id && !used.has(question.id)),
        rng,
      )
      const take = available.slice(0, need)
      if (take.length < need) {
        shortfalls.push(
          `${topic.name} has ${take.length} of ${need} items in the bank. The rest of session ${session} is filled from other session ${session} topics.`,
        )
      }
      for (const question of take) {
        picked.push(question)
        used.add(question.id)
      }
    }
    if (picked.length < MOCK_SESSION_SIZE) {
      const extras = seededShuffle(
        pool.filter((question) => topics.some((topic) => topic.id === question.topicId) && !used.has(question.id)),
        rng,
      )
      for (const question of extras) {
        if (picked.length >= MOCK_SESSION_SIZE) break
        picked.push(question)
        used.add(question.id)
      }
    }
    if (picked.length < MOCK_SESSION_SIZE) {
      shortfalls.push(`Session ${session} could only assemble ${picked.length} of ${MOCK_SESSION_SIZE} items.`)
    }
    const grouped: Question[] = []
    for (const topic of topics) {
      grouped.push(...seededShuffle(picked.filter((question) => question.topicId === topic.id), rng))
    }
    return grouped.slice(0, MOCK_SESSION_SIZE)
  }) as [Question[], Question[]]
  return { sessionQuestions, shortfalls }
}

export function emptySession(questionIds: string[], shortfalls: string[], endsAt: number | null): MockSessionState {
  return { questionIds, index: 0, answers: {}, submitted: false, endsAt, shortfalls }
}

export function scoreSession(questions: Question[], answers: Record<string, MockChoice>): { correct: number; total: number } {
  let correct = 0
  for (const question of questions) {
    const answer = answers[question.id]
    if (answer && answer.choice === question.correctIndex) correct += 1
  }
  return { correct, total: questions.length }
}
