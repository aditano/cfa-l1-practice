import { describe, expect, it } from 'vitest'
import { practiceEnterAction } from '../src/lib/practiceKeys'

describe('practiceEnterAction', () => {
  it('submits when Enter is pressed away from a control and the answer is not revealed', () => {
    expect(practiceEnterAction(false, 'DIV')).toBe('submit')
    expect(practiceEnterAction(false, undefined)).toBe('submit')
  })

  it('advances when Enter is pressed away from a control after the explanation is shown', () => {
    expect(practiceEnterAction(true, 'DIV')).toBe('next')
  })

  it('ignores Enter on form fields so typing and choice radios keep their native behavior', () => {
    expect(practiceEnterAction(false, 'INPUT')).toBe('ignore')
    expect(practiceEnterAction(false, 'TEXTAREA')).toBe('ignore')
    expect(practiceEnterAction(true, 'SELECT')).toBe('ignore')
  })

  it('ignores Enter on the focused Submit/Next button so the trailing click cannot skip the explanation', () => {
    // Regression: keydown submit + button activation swapped Submit for Next,
    // then the same Enter's click advanced and hid the explanation.
    expect(practiceEnterAction(false, 'BUTTON')).toBe('ignore')
    expect(practiceEnterAction(true, 'BUTTON')).toBe('ignore')
    expect(practiceEnterAction(false, 'button')).toBe('ignore')
  })

  it('ignores Enter on links and help-card summaries', () => {
    expect(practiceEnterAction(false, 'A')).toBe('ignore')
    expect(practiceEnterAction(false, 'SUMMARY')).toBe('ignore')
  })
})
