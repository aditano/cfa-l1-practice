import { describe, expect, it } from 'vitest'
import { helpCardStartsOpen } from '../src/lib/helpCard'

describe('helpCardStartsOpen', () => {
  it('keeps the module primer collapsed so it cannot tip the answer before submit', () => {
    expect(helpCardStartsOpen()).toBe(false)
  })
})
