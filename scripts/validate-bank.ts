import { readFileSync, readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { TOPICS, allLosIds } from '../src/curriculum.ts'
import {
  MAX_LENGTH_TELL_RATE,
  MAX_STRICT_LONGEST_RATE,
  MIN_STRICT_LONGEST_RATE,
  choicesFollowConvention,
  isLengthTell,
  isNumericTrio,
  isStrictlyLongest,
} from '../src/lib/choiceBalance.ts'
import { MOCK_ALLOCATION, mockAllocationProblems } from '../src/lib/mockExam.ts'
import type { Question, TopicId } from '../src/types.ts'

const STANDARD_RE = /^(I|II|III|IV|V|VI|VII)\([A-E]\)$/
const YOUTUBE = new Set([
  'https://www.youtube.com/watch?v=QIl6JH_PuW8',
  'https://www.youtube.com/watch?v=g2wEFJ7upNs',
  'https://www.youtube.com/watch?v=odqDOu46XXI',
  'https://www.youtube.com/watch?v=I5xvmxZqb10',
  'https://www.youtube.com/watch?v=DLKhsZvcD-c',
])

function loadQuestions(): Question[] {
  const files = readdirSync('src/data/questions').filter((name) => name.endsWith('.json'))
  return files.flatMap((name) => JSON.parse(readFileSync(`src/data/questions/${name}`, 'utf8')) as Question[])
}

export function validateBank(): string[] {
  const problems: string[] = []
  const questions = loadQuestions()
  const ids = new Set<string>()
  const stems = new Set<string>()
  const byTopic = new Map<TopicId, number>()
  const byLos = new Map<string, number>()
  const letters = [0, 0, 0]
  let violations = 0
  let concepts = 0
  let prose = 0
  let lengthTells = 0
  let strictlyLongest = 0
  const stemBan =
    /\b(all|none) of the above\b|\b(A and B only|B and C only|A and C only)\b|\bcannot determine\b|\bnot enough information\b|\btrue or false\b|\bexcept\b/i

  if (questions.length < 1000) problems.push(`Bank has ${questions.length} questions; need at least 1000.`)

  for (const question of questions) {
    if (ids.has(question.id)) problems.push(`Duplicate id ${question.id}`)
    ids.add(question.id)
    const stemKey = question.stem.replace(/\s+/g, ' ').trim().toLowerCase()
    if (stems.has(stemKey)) problems.push(`Duplicate stem on ${question.id}`)
    stems.add(stemKey)
    if (!Array.isArray(question.choices) || question.choices.length !== 3) {
      problems.push(`${question.id} does not have exactly 3 choices`)
    } else if (new Set(question.choices).size !== 3) {
      problems.push(`${question.id} has repeated choices`)
    } else if (question.choices.some((choice) => !choice.trim() || /^(A|B|C|D)[.)]\s/.test(choice))) {
      problems.push(`${question.id} has an empty or pre-lettered choice`)
    }
    if (question.correctIndex !== 0 && question.correctIndex !== 1 && question.correctIndex !== 2) {
      problems.push(`${question.id} has a bad correctIndex`)
    } else {
      letters[question.correctIndex] += 1
    }
    if (!question.explanation || question.explanation.length < 80) problems.push(`${question.id} explanation is too short`)
    const correct = question.choices[question.correctIndex]
    if (correct && !question.explanation.includes(correct)) {
      problems.push(`${question.id} explanation does not contain the correct choice`)
    }
    if (/\bclosest to\b/i.test(question.stem) && !/\\\(|\\\[/.test(question.explanation)) {
      problems.push(`${question.id} is numeric but the explanation has no KaTeX`)
    }
    if (stemBan.test(question.stem)) problems.push(`${question.id} uses a banned stem`)
    if (Array.isArray(question.choices) && question.choices.length === 3) {
      if (question.choices.some((choice) => /\b(all|none) of the above\b|\b(A and B only|B and C only|A and C only)\b/i.test(choice))) {
        problems.push(`${question.id} uses a banned choice`)
      }
      if (!choicesFollowConvention(question.choices)) {
        problems.push(`${question.id} choices are not in CFA length or numeric order`)
      }
      const distractors = question.choices.filter((_, index) => index !== question.correctIndex)
      const keyed = question.choices[question.correctIndex] ?? ''
      if (!isNumericTrio(question.choices)) {
        prose += 1
        if (isLengthTell(keyed, distractors)) lengthTells += 1
      }
      if (keyed && isStrictlyLongest(keyed, distractors)) strictlyLongest += 1
    }
    const topic = TOPICS.find((item) => item.id === question.topicId)
    if (!topic) {
      problems.push(`${question.id} has unknown topic ${question.topicId}`)
      continue
    }
    byTopic.set(topic.id, (byTopic.get(topic.id) ?? 0) + 1)
    for (const losId of question.losIds) {
      if (!topic.los.some((los) => los.id === losId)) problems.push(`${question.id} has LOS ${losId} outside ${topic.id}`)
      byLos.set(losId, (byLos.get(losId) ?? 0) + 1)
    }
    if (topic.hard) {
      const help = question.hardTopicHelp
      if (!help?.blurb || !help.youtubeUrl || !help.youtubeTitle || !help.channel) {
        problems.push(`${question.id} is missing hard-topic help`)
      } else if (!YOUTUBE.has(help.youtubeUrl) || help.youtubeUrl !== topic.help?.youtubeUrl) {
        problems.push(`${question.id} has an unexpected video URL`)
      }
    }
    if (question.topicId === 'ethics') {
      if (question.ethicsKind === 'violation' || question.ethicsKind === 'compliance') {
        if (!question.ethicsStandard || !STANDARD_RE.test(question.ethicsStandard)) {
          problems.push(`${question.id} is missing a valid ethics standard`)
        } else {
          const body = question.explanation.split('\n\nBest answer:')[0] ?? ''
          if (!body.includes(question.ethicsStandard)) {
            problems.push(`${question.id} explanation does not name ${question.ethicsStandard}`)
          }
        }
        if (question.ethicsKind === 'violation') violations += 1
      } else if (question.ethicsKind === 'concept') {
        concepts += 1
      } else {
        problems.push(`${question.id} has no ethicsKind`)
      }
    }
  }

  const total = questions.length || 1
  for (const topic of TOPICS) {
    const count = byTopic.get(topic.id) ?? 0
    if (count !== topic.bankTarget) problems.push(`${topic.id} has ${count} questions; target is ${topic.bankTarget}`)
    const share = (count / total) * 100
    if (count > 0 && (share < topic.weightMin - 0.15 || share > topic.weightMax + 0.15)) {
      problems.push(`${topic.id} share ${share.toFixed(2)}% is outside ${topic.weightMin}-${topic.weightMax}%`)
    }
  }
  for (const losId of allLosIds()) {
    const count = byLos.get(losId) ?? 0
    if (count < 4) problems.push(`${losId} has only ${count} questions`)
  }
  for (const index of [0, 1, 2]) {
    const share = letters[index] / total
    if (questions.length > 50 && (share < 0.2 || share > 0.48)) {
      problems.push(`Answer letter ${index} is ${(share * 100).toFixed(1)}% of the bank`)
    }
  }
  if (violations < 70) problems.push(`Only ${violations} ethics violation items`)
  if (concepts < 40) problems.push(`Only ${concepts} ethics concept items`)
  const tellRate = prose ? lengthTells / prose : 0
  if (tellRate > MAX_LENGTH_TELL_RATE) {
    problems.push(
      `${lengthTells} of ${prose} prose items (${(tellRate * 100).toFixed(1)}%) have a keyed choice at least 20 characters and 20% longer than both distractors`,
    )
  }
  const longestRate = questions.length ? strictlyLongest / questions.length : 0
  if (questions.length > 50 && (longestRate > MAX_STRICT_LONGEST_RATE || longestRate < MIN_STRICT_LONGEST_RATE)) {
    problems.push(
      `Keyed choice is strictly the longest on ${(longestRate * 100).toFixed(1)}% of items; expected ${MIN_STRICT_LONGEST_RATE * 100}–${MAX_STRICT_LONGEST_RATE * 100}%`,
    )
  }
  for (const topic of TOPICS) {
    const count = byTopic.get(topic.id) ?? 0
    const need = MOCK_ALLOCATION[topic.id]
    if (count < need) problems.push(`${topic.id} has ${count} items; mock session needs ${need}`)
  }
  problems.push(...mockAllocationProblems())
  return problems
}

function printSummary(questions: Question[]): void {
  const lines = ['| Topic | Questions | Exam weight | Share of bank |', '| --- | ---: | --- | ---: |']
  for (const topic of TOPICS) {
    const count = questions.filter((question) => question.topicId === topic.id).length
    const share = questions.length ? (count / questions.length) * 100 : 0
    lines.push(`| ${topic.name} | ${count} | ${topic.weightMin}–${topic.weightMax}% | ${share.toFixed(1)}% |`)
  }
  lines.push(`| **Total** | **${questions.length}** |  | 100% |`)
  console.log(lines.join('\n'))
}

function main(): void {
  const problems = validateBank()
  if (problems.length) {
    console.error(problems.slice(0, 40).join('\n'))
    if (problems.length > 40) console.error(`... ${problems.length - 40} more`)
    process.exit(1)
  }
  printSummary(loadQuestions())
  console.log('Bank OK')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
