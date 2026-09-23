import type { Question, TopicId } from '../types'

type QuestionModule = { default: Question[] }

function asQuestions(loaded: Promise<unknown>): Promise<QuestionModule> {
  return loaded as Promise<QuestionModule>
}

const loaders: Record<TopicId, () => Promise<QuestionModule>> = {
  ethics: () => asQuestions(import('../data/questions/ethics.json')),
  quant: () => asQuestions(import('../data/questions/quant.json')),
  economics: () => asQuestions(import('../data/questions/economics.json')),
  fsa: () => asQuestions(import('../data/questions/fsa.json')),
  corporate: () => asQuestions(import('../data/questions/corporate.json')),
  equity: () => asQuestions(import('../data/questions/equity.json')),
  'fixed-income': () => asQuestions(import('../data/questions/fixed-income.json')),
  derivatives: () => asQuestions(import('../data/questions/derivatives.json')),
  alternatives: () => asQuestions(import('../data/questions/alternatives.json')),
  portfolio: () => asQuestions(import('../data/questions/portfolio.json')),
}

const cache = new Map<TopicId, Promise<Question[]>>()

export function loadTopic(id: TopicId): Promise<Question[]> {
  const cached = cache.get(id)
  if (cached) return cached
  const pending = loaders[id]().then((mod) => mod.default)
  cache.set(id, pending)
  return pending
}

export async function loadTopics(ids: TopicId[]): Promise<Question[]> {
  const chunks = await Promise.all(ids.map((id) => loadTopic(id)))
  return chunks.flat()
}

export function topicsForLos(losIds: string[], losToTopic: Map<string, TopicId>): TopicId[] {
  const ids = new Set<TopicId>()
  for (const losId of losIds) {
    const topicId = losToTopic.get(losId)
    if (topicId) ids.add(topicId)
  }
  return [...ids]
}
