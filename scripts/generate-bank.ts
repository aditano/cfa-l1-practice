import { mkdirSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { BANK_TARGET_TOTAL, TOPICS } from '../src/curriculum.ts'
import type { TopicId } from '../src/types.ts'
import { finalizeTopic, type Draft } from './author.ts'
import { buildAlternatives } from './content/alternatives.ts'
import { buildCorporate } from './content/corporate.ts'
import { buildDerivatives } from './content/derivatives.ts'
import { buildEconomics } from './content/economics.ts'
import { buildEquity } from './content/equity.ts'
import { buildEthics } from './content/ethics.ts'
import { buildFixedIncome } from './content/fixed-income.ts'
import { buildFsa } from './content/fsa.ts'
import { buildPortfolio } from './content/portfolio.ts'
import { buildQuant } from './content/quant.ts'
import { validateBank } from './validate-bank.ts'

const builders: Record<TopicId, () => Draft[]> = {
  ethics: buildEthics,
  quant: buildQuant,
  economics: buildEconomics,
  fsa: buildFsa,
  corporate: buildCorporate,
  equity: buildEquity,
  'fixed-income': buildFixedIncome,
  derivatives: buildDerivatives,
  alternatives: buildAlternatives,
  portfolio: buildPortfolio,
}

function main(): void {
  mkdirSync('src/data/questions', { recursive: true })
  const byLos: Record<string, number> = {}
  const byTopic: Record<string, number> = {}
  let total = 0
  for (const topic of TOPICS) {
    const drafts = builders[topic.id]()
    if (drafts.length !== topic.bankTarget) {
      throw new Error(`${topic.id} produced ${drafts.length} drafts; target is ${topic.bankTarget}`)
    }
    const questions = finalizeTopic(topic.id, drafts)
    writeFileSync(`src/data/questions/${topic.id}.json`, `${JSON.stringify(questions, null, 2)}\n`)
    byTopic[topic.id] = questions.length
    total += questions.length
    for (const question of questions) {
      const losId = question.losIds[0]
      if (losId) byLos[losId] = (byLos[losId] ?? 0) + 1
    }
    console.log(`${topic.code} ${questions.length}`)
  }
  if (total !== BANK_TARGET_TOTAL) throw new Error(`Total ${total} !== ${BANK_TARGET_TOTAL}`)
  const manifest = { version: '2026.1', total, byTopic, byLos }
  writeFileSync('src/data/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`)
  const problems = validateBank()
  if (problems.length) {
    console.error(problems.slice(0, 30).join('\n'))
    process.exit(1)
  }
  console.log(`Wrote ${total} questions`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
