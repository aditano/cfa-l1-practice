/**
 * Choice-length rules for original items.
 *
 * Sentence choices are ordered shortest to longest. Numeric choices are ordered
 * smallest to largest. A length tell is a keyed choice that is clearly longer
 * than both distractors: at least 20 characters and at least 20% longer than
 * the longer distractor. The author pass trims explanatory tails and, when a
 * trim would cut the claim, lengthens a distractor with a short neutral tail.
 * The same tails are also applied to some keyed choices so the tail itself is
 * not a wrong-answer signal.
 */

export const LENGTH_TELL_ABS = 20
export const LENGTH_TELL_REL = 0.2
export const MAX_LENGTH_TELL_RATE = 0.08
export const MAX_STRICT_LONGEST_RATE = 0.4
export const MIN_STRICT_LONGEST_RATE = 0.24

const NUMERIC_CHOICE = /^(USD\s)?-?\d[\d,]*(\.\d+)?%?$/
const DANGLING =
  /^(and|or|the|a|an|of|to|for|with|in|on|by|as|if|than|that|which|so|because|from|into|over|under|its|their|plus|more|rather|not|be|is|are)$/i
const QUALIFIER =
  /most likely|least likely|best described|most appropriate|most accurate|least appropriate|least accurate|closest to/i
const WHICH_VERB =
  /\b(is|are|fits|fit|does|do|has|have|should|would|can|could|may|contains|follows|names|means|describes|happens|includes|requires|produces|uses|differs|belongs|addresses|results|showed|remains|match|matches|applies|bypasses|translates|distinguishes|go|separates|lines)\b/i

const TAILS = [
  ', as described',
  ', as stated here',
  ', in this case',
  ', on these facts',
  ', for this position',
  ', given these terms',
  ', as described for this case',
  ', on the facts given in the question',
] as const

const SENTENCE_TAILS = [
  '. That is the claim made for this case.',
  '. This is the reading of the facts given.',
  '. The statement is applied to the position described.',
  '. That is the claim made for this case. This is the reading of the facts given. The statement is applied to the position described.',
] as const

export function choiceLength(choice: string): number {
  return choice.replace(/\s+/g, ' ').trim().length
}

export function numericValue(choice: string): number | null {
  const trimmed = choice.trim()
  if (!NUMERIC_CHOICE.test(trimmed)) return null
  const value = Number(trimmed.replace(/USD\s|%/g, '').replace(/,/g, ''))
  return Number.isFinite(value) ? value : null
}

export function isNumericTrio(choices: readonly string[]): boolean {
  return choices.length === 3 && choices.every((choice) => numericValue(choice) !== null)
}

export function isLengthTell(correct: string, distractors: readonly string[]): boolean {
  if (distractors.length === 0) return false
  const keyed = choiceLength(correct)
  const longestDistractor = Math.max(...distractors.map((choice) => choiceLength(choice)))
  const gap = keyed - longestDistractor
  return gap >= LENGTH_TELL_ABS && gap / Math.max(longestDistractor, 1) >= LENGTH_TELL_REL
}

export function isStrictlyLongest(correct: string, distractors: readonly string[]): boolean {
  const keyed = choiceLength(correct)
  return distractors.every((choice) => choiceLength(choice) < keyed)
}

function lastWord(text: string): string {
  return text.replace(/[.,:;]$/, '').trim().split(/\s+/).pop() ?? ''
}

function endsClean(text: string): boolean {
  return text.trim().length >= 4 && !DANGLING.test(lastWord(text))
}

function labelHead(text: string): string | null {
  const match = /^(.{4,80}?)(?:, which\b|, because\b|, so\b|: )/i.exec(text.trim())
  if (!match?.[1]) return null
  const head = match[1].trim()
  if (!endsClean(head)) return null
  return head
}

function allowedLength(longestDistractor: number): number {
  const slack = Math.min(LENGTH_TELL_ABS - 1, Math.floor((LENGTH_TELL_REL - 0.001) * Math.max(longestDistractor, 1)))
  return longestDistractor + Math.max(slack, 0)
}

function cleanTrim(text: string, maxLength: number, avoid: ReadonlySet<string>): string | null {
  const sources = [text]
  const dot = text.indexOf('. ')
  if (dot > 24) sources.push(text.slice(0, dot).trim())
  const breaks = [', which ', ', because ', ', so ', '; ', ': ', ', rather than ', ', including ', ', when ', ', where ', ', ']
  let best: string | null = null
  const minKeep = Math.min(48, Math.floor(choiceLength(text) * 0.45))
  for (const source of sources) {
    if (choiceLength(source) <= maxLength && choiceLength(source) >= minKeep && endsClean(source) && !avoid.has(source.replace(/\.$/, ''))) {
      const candidate = source.replace(/\.$/, '')
      if (!best || choiceLength(candidate) > choiceLength(best)) best = candidate
    }
    for (const br of breaks) {
      let index = source.lastIndexOf(br)
      while (index > 10) {
        const prefix = source.slice(0, index).trim().replace(/[,:;]$/, '')
        const words = prefix.split(/\s+/).length
        const keep = br === ', ' ? words >= 6 && choiceLength(prefix) >= minKeep : choiceLength(prefix) >= 8
        if (keep && choiceLength(prefix) <= maxLength && endsClean(prefix) && !avoid.has(prefix)) {
          if (!best || choiceLength(prefix) > choiceLength(best)) best = prefix
        }
        index = source.lastIndexOf(br, index - 1)
      }
    }
  }
  return best
}

function applyTail(text: string, tail: string): string {
  const trimmed = text.trim()
  if (trimmed.endsWith('.')) return `${trimmed.slice(0, -1)}${tail}.`
  return `${trimmed}${tail}`
}

function applyExtension(text: string, addition: string): string {
  if (addition.startsWith('.')) {
    const base = text.trim().replace(/\.$/, '')
    return `${base}${addition}`
  }
  return applyTail(text, addition)
}

function extendTo(text: string, minLength: number, avoid: Set<string>, seed: number): string {
  if (choiceLength(text) >= minLength) return text
  const deficit = minLength - choiceLength(text)
  const options = [...TAILS, ...SENTENCE_TAILS, '. That is the claim made for this case. This is the reading of the facts given.']
  const ranked = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !text.includes(option.trim()) && choiceLength(applyExtension(text, option)) - choiceLength(text) >= deficit)
    .sort((a, b) => a.option.length - b.option.length || (a.index + seed) % options.length - ((b.index + seed) % options.length))
  for (const { option } of ranked) {
    const next = applyExtension(text, option)
    if (!avoid.has(next)) return next
  }
  const fallback = options[(seed + deficit) % options.length] ?? options[0]
  const next = applyExtension(text, fallback)
  return avoid.has(next) || text.includes(fallback.trim()) ? text : next
}

function orderProse(correct: string, wrong: [string, string]): { choices: [string, string, string]; correctIndex: 0 | 1 | 2 } {
  const tagged = [
    { text: correct, keyed: true },
    { text: wrong[0], keyed: false },
    { text: wrong[1], keyed: false },
  ].sort((a, b) => choiceLength(a.text) - choiceLength(b.text) || a.text.localeCompare(b.text))
  const choices = tagged.map((item) => item.text) as [string, string, string]
  const correctIndex = tagged.findIndex((item) => item.keyed) as 0 | 1 | 2
  return { choices, correctIndex }
}

function orderNumeric(correct: string, wrong: [string, string]): { choices: [string, string, string]; correctIndex: 0 | 1 | 2 } {
  const items = [correct, wrong[0], wrong[1]]
  const choices = [...items].sort((a, b) => (numericValue(a) ?? 0) - (numericValue(b) ?? 0) || a.localeCompare(b)) as [
    string,
    string,
    string,
  ]
  return { choices, correctIndex: choices.indexOf(correct) as 0 | 1 | 2 }
}

export function balanceChoices(
  correct: string,
  wrong: [string, string],
  seed: number,
): { choices: [string, string, string]; correctIndex: 0 | 1 | 2 } {
  if (isNumericTrio([correct, wrong[0], wrong[1]])) return orderNumeric(correct, wrong)

  let keyed = correct
  let distractors: [string, string] = [wrong[0], wrong[1]]
  const heads = [keyed, distractors[0], distractors[1]].map((choice) => labelHead(choice))
  if (heads.every((head): head is string => Boolean(head)) && new Set(heads).size === 3) {
    keyed = heads[0]
    distractors = [heads[1], heads[2]]
  }

  const avoid = new Set<string>([keyed, distractors[0], distractors[1]])
  if (isLengthTell(keyed, distractors)) {
    const cap = allowedLength(Math.max(choiceLength(distractors[0]), choiceLength(distractors[1])))
    const trimmed = cleanTrim(keyed, cap, avoid)
    if (trimmed && !isLengthTell(trimmed, distractors)) keyed = trimmed
  }

  const longerIndex = choiceLength(distractors[0]) >= choiceLength(distractors[1]) ? 0 : 1
  const flipLongest = isStrictlyLongest(keyed, distractors) && seed % 3 === 1
  if (flipLongest || isLengthTell(keyed, distractors)) {
    const clearAt = choiceLength(keyed) - (LENGTH_TELL_ABS - 1)
    const goal = flipLongest ? choiceLength(keyed) + 1 : clearAt
    let extended = extendTo(distractors[longerIndex], goal, avoid, seed)
    let next: [string, string] = longerIndex === 0 ? [extended, distractors[1]] : [distractors[0], extended]
    if (isLengthTell(keyed, next)) {
      extended = extendTo(distractors[longerIndex], clearAt, avoid, seed + 5)
      next = longerIndex === 0 ? [extended, distractors[1]] : [distractors[0], extended]
    }
    if (!isLengthTell(keyed, next)) distractors = next
  }

  // Put the same family of tails on some keyed choices that are otherwise shortest,
  // so a tail is not itself evidence that a line is wrong.
  if (!isStrictlyLongest(keyed, distractors) && choiceLength(keyed) <= Math.min(...distractors.map(choiceLength)) && seed % 3 === 0) {
    const extended = extendTo(keyed, choiceLength(keyed) + TAILS[seed % TAILS.length].length, avoid, seed + 2)
    if (!isLengthTell(extended, distractors)) keyed = extended
  }

  if (new Set([keyed, distractors[0], distractors[1]]).size !== 3) {
    return orderProse(correct, wrong)
  }
  return orderProse(keyed, distractors)
}

export function choicesFollowConvention(choices: readonly string[]): boolean {
  if (isNumericTrio(choices)) {
    const values = choices.map((choice) => numericValue(choice) ?? 0)
    return values[0] <= values[1] && values[1] <= values[2]
  }
  const lengths = choices.map((choice) => choiceLength(choice))
  return lengths[0] <= lengths[1] && lengths[1] <= lengths[2]
}

export function polishStem(stem: string): string {
  const original = stem.trim()
  if (QUALIFIER.test(original) || !original.endsWith('?')) return original
  const mark = original.lastIndexOf('Which ')
  if (mark < 0) return original
  const head = original.slice(0, mark)
  let tail = original.slice(mark)
  if (QUALIFIER.test(tail) || /\b(best|most|least)\b/i.test(tail)) return original
  tail = tail.replace(/\bthe fairest\b/i, 'most accurate')
  if (QUALIFIER.test(tail)) return head + tail
  if (/^Which of the following is /i.test(tail)) {
    return `${head}${tail.replace(/^Which of the following is /i, 'Which of the following is most likely ')}`
  }
  const match = WHICH_VERB.exec(tail)
  if (!match || match.index === undefined) return head + tail
  if (/^(may|should)$/i.test(match[0])) {
    return `${head}${tail.replace(/\s+(\S+)\?$/, ' most likely $1?')}`
  }
  const after = tail.slice(match.index + match[0].length).replace(/\?$/, '')
  const wordsAfter = after.trim().split(/\s+/).filter(Boolean)
  if (wordsAfter.length <= 2 && /^(is|are)$/i.test(match[0])) {
    return `${head}${tail.replace(/\?$/, ' most likely?')}`
  }
  return `${head}${tail.slice(0, match.index)}most likely ${tail.slice(match.index)}`
}
