import { describe, expect, it } from 'vitest'
import { TOPICS } from '../src/curriculum'
import {
  MOCK_ALLOCATION,
  MOCK_SESSION_MS,
  MOCK_SESSION_SIZE,
  buildMockExam,
  formatExamClock,
  mockAllocationProblems,
} from '../src/lib/mockExam'
import type { Question, TopicId } from '../src/types'

function makeQuestion(topicId: TopicId, index: number): Question {
  const topic = TOPICS.find((item) => item.id === topicId)
  return {
    id: `${topic?.code ?? topicId}-${index}`,
    topicId,
    losIds: [topic?.los[0]?.id ?? 'qm-rates'],
    difficulty: 'medium',
    stem: `Original stem ${topicId} ${index} is long enough to stand as a fixture item.`,
    choices: ['Alpha choice.', 'Beta choice is longer.', 'Gamma choice is the longest of these three.'],
    correctIndex: 0,
    explanation: 'Alpha choice is the keyed response in this fixture, with enough detail to count.',
  }
}

function poolWith(counts: Partial<Record<TopicId, number>>): Question[] {
  const questions: Question[] = []
  for (const topic of TOPICS) {
    const count = counts[topic.id] ?? MOCK_ALLOCATION[topic.id]
    for (let index = 0; index < count; index += 1) questions.push(makeQuestion(topic.id, index))
  }
  return questions
}

describe('mock exam allocation', () => {
  it('uses official session sizes and 2026 weight ranges', () => {
    expect(mockAllocationProblems()).toEqual([])
    expect(MOCK_SESSION_MS).toBe(135 * 60 * 1000)
    const session1 = TOPICS.filter((topic) => topic.session === 1).reduce((sum, topic) => sum + MOCK_ALLOCATION[topic.id], 0)
    const session2 = TOPICS.filter((topic) => topic.session === 2).reduce((sum, topic) => sum + MOCK_ALLOCATION[topic.id], 0)
    expect(session1).toBe(MOCK_SESSION_SIZE)
    expect(session2).toBe(MOCK_SESSION_SIZE)
  })

  it('draws 90 unique items per session in topic order', () => {
    const built = buildMockExam(poolWith({}), 42)
    expect(built.shortfalls).toEqual([])
    for (const session of [1, 2] as const) {
      const questions = built.sessionQuestions[session - 1]
      expect(questions).toHaveLength(90)
      expect(new Set(questions.map((question) => question.id)).size).toBe(90)
      const topics = TOPICS.filter((topic) => topic.session === session)
      let cursor = 0
      for (const topic of topics) {
        const slice = questions.slice(cursor, cursor + MOCK_ALLOCATION[topic.id])
        expect(slice.every((question) => question.topicId === topic.id)).toBe(true)
        cursor += MOCK_ALLOCATION[topic.id]
      }
    }
    const again = buildMockExam(poolWith({}), 42)
    expect(again.sessionQuestions[0].map((question) => question.id)).toEqual(
      built.sessionQuestions[0].map((question) => question.id),
    )
  })

  it('fills a short topic from the same session and records the shortfall', () => {
    const built = buildMockExam(poolWith({ ethics: 10, quant: MOCK_ALLOCATION.quant + 30 }), 9)
    expect(built.sessionQuestions[0]).toHaveLength(90)
    expect(built.shortfalls.some((note) => note.includes('Ethical and Professional Standards'))).toBe(true)
    const ethics = built.sessionQuestions[0].filter((question) => question.topicId === 'ethics')
    expect(ethics).toHaveLength(10)
    const ids = built.sessionQuestions[0].map((question) => question.id)
    expect(new Set(ids).size).toBe(90)
  })

  it('formats the session clock as minutes and seconds', () => {
    expect(formatExamClock(MOCK_SESSION_MS)).toBe('135:00')
    expect(formatExamClock(90_000)).toBe('1:30')
    expect(formatExamClock(0)).toBe('0:00')
  })
})
