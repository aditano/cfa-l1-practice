import { getTopic } from '../src/curriculum.ts'
import { LOS_HELP } from '../src/losHelp.ts'
import type { Difficulty, EthicsKind, Question, TopicId } from '../src/types.ts'

export type Draft = {
  topicId: TopicId
  losId: string
  difficulty: Difficulty
  stem: string
  correct: string
  wrong: [string, string]
  explanation: string
  ethicsStandard?: string
  ethicsKind?: EthicsKind
}

const STANDARD_RE = /^(I|II|III|IV|V|VI|VII)\([A-E]\)$/

export function q(
  topicId: TopicId,
  losId: string,
  difficulty: Difficulty,
  stem: string,
  correct: string,
  wrong1: string,
  wrong2: string,
  explanation: string,
  extra?: { ethicsStandard?: string; ethicsKind?: EthicsKind },
): Draft {
  const draft: Draft = {
    topicId,
    losId,
    difficulty,
    stem: stem.trim(),
    correct: correct.trim(),
    wrong: [wrong1.trim(), wrong2.trim()],
    explanation: explanation.trim(),
    ethicsStandard: extra?.ethicsStandard,
    ethicsKind: extra?.ethicsKind,
  }
  if (draft.stem.length < 40) throw new Error(`Stem too short (${draft.losId}): ${draft.stem}`)
  if (draft.explanation.length < 80) throw new Error(`Explanation too short (${draft.losId}): ${draft.stem.slice(0, 80)}`)
  if (new Set([draft.correct, draft.wrong[0], draft.wrong[1]]).size !== 3) {
    throw new Error(`Duplicate choices (${draft.losId}): ${draft.stem.slice(0, 100)}`)
  }
  if (/\b(all|none) of the above\b/i.test(draft.stem)) {
    throw new Error(`Banned stem phrasing (${draft.losId})`)
  }
  return draft
}

export function numeric(args: {
  topicId: TopicId
  losId: string
  difficulty: Difficulty
  stem: string
  correct: number
  wrong: [number, number]
  format: (value: number) => string
  explain: (formattedCorrect: string) => string
}): Draft {
  const correct = args.format(args.correct)
  const wrong1 = args.format(args.wrong[0])
  const wrong2 = args.format(args.wrong[1])
  if (new Set([correct, wrong1, wrong2]).size !== 3) {
    throw new Error(
      `Choice collision on ${args.losId}: ${correct} / ${wrong1} / ${wrong2}\n${args.stem.slice(0, 140)}`,
    )
  }
  return q(args.topicId, args.losId, args.difficulty, args.stem, correct, wrong1, wrong2, args.explain(correct))
}

export function exactly(losId: string, count: number, drafts: Draft[]): Draft[] {
  if (drafts.length !== count) {
    throw new Error(`${losId}: expected ${count} questions, wrote ${drafts.length}`)
  }
  for (const draft of drafts) {
    if (draft.losId !== losId) throw new Error(`${losId}: draft tagged ${draft.losId}`)
  }
  return drafts
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function shuffle3<T>(items: [T, T, T], seed: number): [T, T, T] {
  const copy: [T, T, T] = [items[0], items[1], items[2]]
  let state = seed || 1
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  for (let i = 2; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

export function finalizeTopic(topicId: TopicId, drafts: Draft[]): Question[] {
  const topic = getTopic(topicId)
  const losOrder = new Map(topic.los.map((los, index) => [los.id, index]))
  const ordered = drafts
    .map((draft, index) => ({ draft, index }))
    .sort((a, b) => {
      const losDelta = (losOrder.get(a.draft.losId) ?? 99) - (losOrder.get(b.draft.losId) ?? 99)
      return losDelta === 0 ? a.index - b.index : losDelta
    })
    .map((entry) => entry.draft)

  return ordered.map((draft, index) => {
    if (draft.topicId !== topicId) throw new Error(`Topic mismatch for ${draft.losId}`)
    if (!losOrder.has(draft.losId)) throw new Error(`Unknown LOS ${draft.losId} on ${topicId}`)
    const id = `${topic.code}-${String(index + 1).padStart(4, '0')}`
    const choices = shuffle3([draft.correct, draft.wrong[0], draft.wrong[1]], hashString(id))
    const correctIndex = choices.indexOf(draft.correct)
    if (correctIndex < 0 || correctIndex > 2) throw new Error(`Lost correct choice for ${id}`)
    let explanation = draft.explanation
    if (!explanation.includes(draft.correct)) {
      explanation = `${explanation}\n\nBest answer: ${draft.correct}`
    }
    if (topicId === 'ethics' && !draft.ethicsKind) {
      throw new Error(`${id} is an ethics item without ethicsKind`)
    }
    if (draft.ethicsKind === 'violation' || draft.ethicsKind === 'compliance') {
      if (!draft.ethicsStandard || !STANDARD_RE.test(draft.ethicsStandard)) {
        throw new Error(`${id} needs a Code standard such as III(B), got ${draft.ethicsStandard ?? 'none'}`)
      }
      const body = draft.explanation.split('\n\nBest answer:')[0] ?? draft.explanation
      if (!body.includes(draft.ethicsStandard)) {
        throw new Error(`${id} explanation does not name ${draft.ethicsStandard}`)
      }
    }
    const question: Question = {
      id,
      topicId,
      losIds: [draft.losId],
      difficulty: draft.difficulty,
      stem: draft.stem,
      choices,
      correctIndex: correctIndex as 0 | 1 | 2,
      explanation,
    }
    if (draft.ethicsStandard) question.ethicsStandard = draft.ethicsStandard
    if (draft.ethicsKind) question.ethicsKind = draft.ethicsKind
    if (topic.hard && topic.help) {
      const blurb = LOS_HELP[draft.losId]
      if (!blurb) throw new Error(`Missing extra-help blurb for ${draft.losId}`)
      question.hardTopicHelp = {
        blurb,
        youtubeUrl: topic.help.youtubeUrl,
        youtubeTitle: topic.help.youtubeTitle,
        channel: topic.help.channel,
      }
    }
    return question
  })
}
