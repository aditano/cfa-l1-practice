/** Decide what Enter should do during a practice session. */
export type PracticeEnterAction = 'submit' | 'next' | 'ignore'

/**
 * Enter on a focused Submit button both runs a window keydown handler and
 * activates the button. After submit swaps Submit for Next, the trailing click
 * can advance and skip the explanation. Ignore Enter when a button (or other
 * control) already owns the key; handle it only for non-control targets.
 */
export function practiceEnterAction(revealed: boolean, targetTagName: string | undefined): PracticeEnterAction {
  const tag = targetTagName?.toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') {
    return 'ignore'
  }
  return revealed ? 'next' : 'submit'
}
