import { describe, expect, it } from 'vitest'
import { drawQuestions, matchingQuestions, type Filters } from '../src/lib/select'
import type { Question } from '../src/types'

function item(id: string, losId: string, difficulty: Question['difficulty']): Question {
  return {
    id,
    topicId: 'quant',
    losIds: [losId],
    difficulty,
    stem: `Stem for ${id} is long enough to stand alone.`,
    choices: ['One', 'Two', 'Three'],
    correctIndex: 1,
    explanation: 'Two is the best of these three original choices for this tiny fixture.',
  }
}

const pool = [
  item('QM-0001', 'qm-rates', 'easy'),
  item('QM-0002', 'qm-rates', 'hard'),
  item('QM-0003', 'qm-tvm', 'medium'),
]

const filters: Filters = {
  losIds: ['qm-rates'],
  difficulties: ['easy', 'medium', 'hard'],
  count: 10,
  shuffle: false,
  unseenOnly: false,
}

describe('question selection', () => {
  it('keeps only the selected modules', () => {
    expect(matchingQuestions(pool, filters, new Set()).map((question) => question.id)).toEqual(['QM-0001', 'QM-0002'])
  })

  it('drops seen questions when unseen-only is on', () => {
    const unseen = matchingQuestions(pool, { ...filters, unseenOnly: true }, new Set(['QM-0001']))
    expect(unseen.map((question) => question.id)).toEqual(['QM-0002'])
  })

  it('respects difficulty and count, and keeps a stable order when shuffle is off', () => {
    const drawn = drawQuestions(pool, { ...filters, losIds: ['qm-rates', 'qm-tvm'], difficulties: ['easy', 'medium'], count: 1, shuffle: false }, new Set())
    expect(drawn.map((question) => question.id)).toEqual(['QM-0001'])
  })

  it('returns every match when count is zero', () => {
    const drawn = drawQuestions(pool, { ...filters, count: 0, shuffle: false }, new Set())
    expect(drawn).toHaveLength(2)
  })
})
