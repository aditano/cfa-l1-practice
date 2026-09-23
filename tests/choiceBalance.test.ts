import { describe, expect, it } from 'vitest'
import {
  balanceChoices,
  choiceLength,
  choicesFollowConvention,
  isLengthTell,
  polishStem,
} from '../src/lib/choiceBalance'

describe('choice balance', () => {
  it('orders numeric choices from smallest to largest', () => {
    const balanced = balanceChoices('12.40%', ['8.10%', '15.00%'], 7)
    expect(balanced.choices).toEqual(['8.10%', '12.40%', '15.00%'])
    expect(balanced.correctIndex).toBe(1)
    expect(choicesFollowConvention(balanced.choices)).toBe(true)
  })

  it('orders prose choices from shortest to longest', () => {
    const balanced = balanceChoices('Middle length answer.', ['Short one.', 'The longest of the three original answers here.'], 2)
    const lengths = balanced.choices.map((choice) => choiceLength(choice))
    expect(lengths[0]).toBeLessThanOrEqual(lengths[1])
    expect(lengths[1]).toBeLessThanOrEqual(lengths[2])
    expect(balanced.choices[balanced.correctIndex]).toContain('Middle length')
  })

  it('does not leave a clear length tell after balancing', () => {
    const correct =
      'A catch-up, which accelerates the general partner’s share until the carried-interest percentage of profits is achieved.'
    const wrong: [string, string] = [
      'A high-water mark, which stops the management fee whenever the fund’s net asset value falls.',
      'A clawback, which forces limited partners to return distributions after a profitable exit.',
    ]
    expect(isLengthTell(correct, wrong)).toBe(true)
    const balanced = balanceChoices(correct, wrong, 11)
    const keyed = balanced.choices[balanced.correctIndex]
    const distractors = balanced.choices.filter((_, index) => index !== balanced.correctIndex)
    expect(isLengthTell(keyed, distractors)).toBe(false)
    expect(new Set(balanced.choices).size).toBe(3)
  })

  it('adds a CFA-style qualifier to Which-questions that lack one', () => {
    const stem =
      'Compared with a passive fund, this fund charges a performance fee. Which explanation is the fairest?'
    expect(polishStem(stem)).toBe(
      'Compared with a passive fund, this fund charges a performance fee. Which explanation is most accurate?',
    )
    expect(polishStem('The nominal required return is closest to:')).toBe('The nominal required return is closest to:')
  })
})
