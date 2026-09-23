import { readdirSync, readFileSync } from 'node:fs'
import katex from 'katex'
import { describe, expect, it } from 'vitest'
import type { Question } from '../src/types'
import { validateBank } from '../scripts/validate-bank.ts'

const MATH = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g

function loadQuestions(): Question[] {
  return readdirSync('src/data/questions')
    .filter((name) => name.endsWith('.json'))
    .flatMap((name) => JSON.parse(readFileSync(`src/data/questions/${name}`, 'utf8')) as Question[])
}

describe('question bank', () => {
  it('meets the structure, ethics, and weight checks', () => {
    expect(validateBank()).toEqual([])
  })

  it('renders every formula', () => {
    const broken: string[] = []
    for (const question of loadQuestions()) {
      const blobs = [question.stem, question.explanation]
      for (const blob of blobs) {
        for (const match of blob.matchAll(MATH)) {
          const expr = match[1] ?? match[2] ?? ''
          try {
            katex.renderToString(expr, { throwOnError: true })
          } catch (error) {
            broken.push(`${question.id}: ${error instanceof Error ? error.message : 'bad math'}`)
          }
        }
      }
    }
    expect(broken).toEqual([])
  })
})
