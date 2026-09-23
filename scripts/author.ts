import { balanceChoices, polishStem } from '../src/lib/choiceBalance.ts'
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
  if (/\b(all|none) of the above\b|\b(A and B only|B and C only|A and C only)\b|\bcannot determine\b|\bnot enough information\b|\btrue or false\b/i.test(draft.stem)) {
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
    const stem = polishStem(draft.stem)
    const balanced = balanceChoices(draft.correct, draft.wrong, hashString(`${id}:${stem}`))
    const choices = balanced.choices
    const correctIndex = balanced.correctIndex
    if (new Set(choices).size !== 3) throw new Error(`Lost a distinct choice for ${id}`)
    const keyed = choices[correctIndex]
    let explanation = draft.explanation
    if (!explanation.includes(keyed)) {
      explanation = `${explanation}\n\nBest answer: ${keyed}`
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
      stem,
      choices,
      correctIndex,
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
