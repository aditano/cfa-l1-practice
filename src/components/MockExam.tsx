import { useEffect, useMemo, useRef, useState } from 'react'
import { TOPICS } from '../curriculum'
import { loadTopics } from '../lib/bank'
import {
  MOCK_ALLOCATION,
  MOCK_SESSION_MINUTES,
  MOCK_SESSION_MS,
  MOCK_SESSION_SIZE,
  buildMockExam,
  emptySession,
  formatExamClock,
  mockWeightPercent,
  type MockPhase,
  type StoredMock,
} from '../lib/mockExam'
import { clearMock, loadMock, saveMock } from '../lib/storage'
import type { Question, TopicId } from '../types'
import { HelpCard } from './HelpCard'
import { RichText } from './RichText'

const LETTERS = ['A', 'B', 'C'] as const

type Screen = 'intro' | 'loading' | MockPhase

function topicName(id: TopicId): string {
  return TOPICS.find((topic) => topic.id === id)?.name ?? id
}

function topicShort(id: TopicId): string {
  return TOPICS.find((topic) => topic.id === id)?.shortName ?? id
}

function losTitle(id: string): string {
  for (const topic of TOPICS) {
    const los = topic.los.find((item) => item.id === id)
    if (los) return los.title
  }
  return id
}

function questionsFor(ids: string[], bank: Map<string, Question>): Question[] {
  return ids.map((id) => bank.get(id)).filter((question): question is Question => Boolean(question))
}

function sessionShortfalls(notes: string[], session: 1 | 2): string[] {
  const needle = `session ${session}`
  return notes.filter((note) => note.toLowerCase().includes(needle))
}

function blankExam(seed: number, sessionQuestions: [Question[], Question[]], shortfalls: string[]): StoredMock {
  return {
    version: 1,
    seed,
    phase: 'session',
    session: 1,
    reviewFilter: 'all',
    sessions: {
      1: emptySession(
        sessionQuestions[0].map((question) => question.id),
        sessionShortfalls(shortfalls, 1),
        Date.now() + MOCK_SESSION_MS,
      ),
      2: emptySession(
        sessionQuestions[1].map((question) => question.id),
        sessionShortfalls(shortfalls, 2),
        null,
      ),
    },
  }
}

function expireIfNeeded(saved: StoredMock): StoredMock {
  if (saved.phase !== 'session') return saved
  const current = saved.sessions[saved.session]
  if (current.submitted || current.endsAt === null || Date.now() < current.endsAt) return saved
  return {
    ...saved,
    phase: saved.session === 1 ? 'break' : 'results',
    sessions: {
      ...saved.sessions,
      [saved.session]: { ...current, submitted: true },
    },
  }
}

export function MockExam() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [exam, setExam] = useState<StoredMock | null>(null)
  const [bank, setBank] = useState<Map<string, Question>>(new Map())
  const [now, setNow] = useState(() => Date.now())
  const [navOpen, setNavOpen] = useState(() => window.matchMedia('(min-width: 841px)').matches)
  const [error, setError] = useState('')
  const [resumeOffer, setResumeOffer] = useState<StoredMock | null>(() => loadMock())
  const skipResume = useRef(false)

  useEffect(() => {
    if (!exam) return
    saveMock(exam)
  }, [exam])

  useEffect(() => {
    if (screen !== 'session') return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [screen])

  const active = exam && screen === 'session' ? exam.sessions[exam.session] : null
  const activeQuestions = useMemo(
    () => (active ? questionsFor(active.questionIds, bank) : []),
    [active, bank],
  )
  const current = active ? activeQuestions[active.index] : undefined

  useEffect(() => {
    if (!exam || screen !== 'session') return
    const currentSession = exam.sessions[exam.session]
    if (currentSession.submitted || currentSession.endsAt === null) return
    if (now < currentSession.endsAt) return
    const next = expireIfNeeded(exam)
    setExam(next)
    setScreen(next.phase)
  }, [now, exam, screen])

  useEffect(() => {
    const saved = loadMock()
    if (!saved) return
    void hydrate(saved)
    // Restore once on entry so a refresh returns to the live clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hydrate = async (saved: StoredMock) => {
    setError('')
    setScreen('loading')
    try {
      const pool = await loadTopics(TOPICS.map((topic) => topic.id))
      const map = new Map(pool.map((question) => [question.id, question]))
      const ids = [...saved.sessions[1].questionIds, ...saved.sessions[2].questionIds]
      if (ids.some((id) => !map.has(id))) {
        clearMock()
        setResumeOffer(null)
        setExam(null)
        setScreen('intro')
        setError('The saved mock does not match this question bank. Start a new exam.')
        return
      }
      if (skipResume.current) return
      const next = expireIfNeeded(saved)
      setBank(map)
      setExam(next)
      setScreen(next.phase)
    } catch {
      setScreen('intro')
      setError('The question files could not be loaded.')
    }
  }

  const startNew = async () => {
    skipResume.current = true
    clearMock()
    setResumeOffer(null)
    setError('')
    setScreen('loading')
    try {
      const pool = await loadTopics(TOPICS.map((topic) => topic.id))
      const seed = Math.floor(Math.random() * 0x7fffffff) + 1
      const built = buildMockExam(pool, seed)
      setBank(new Map(pool.map((question) => [question.id, question])))
      setExam(blankExam(seed, built.sessionQuestions, built.shortfalls))
      setScreen('session')
    } catch {
      setScreen('intro')
      setError('The question files could not be loaded.')
    }
  }

  const updateSession = (patch: Partial<StoredMock['sessions'][1]>) => {
    if (!exam || screen !== 'session') return
    const currentSession = exam.sessions[exam.session]
    if (currentSession.submitted) return
    setExam({
      ...exam,
      sessions: {
        ...exam.sessions,
        [exam.session]: { ...currentSession, ...patch },
      },
    })
  }

  const selectChoice = (choice: number) => {
    if (!exam || !active || !current || active.submitted) return
    const previous = active.answers[current.id]
    updateSession({
      answers: {
        ...active.answers,
        [current.id]: { choice, flagged: previous?.flagged ?? false },
      },
    })
  }

  const toggleFlag = () => {
    if (!exam || !active || !current || active.submitted) return
    const previous = active.answers[current.id]
    updateSession({
      answers: {
        ...active.answers,
        [current.id]: { choice: previous?.choice ?? null, flagged: !previous?.flagged },
      },
    })
  }

  const goTo = (index: number) => {
    if (!active) return
    const nextIndex = Math.min(Math.max(index, 0), active.questionIds.length - 1)
    updateSession({ index: nextIndex })
  }

  useEffect(() => {
    if (screen !== 'session' || !active || !current) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === '1' || event.key === '2' || event.key === '3') {
        event.preventDefault()
        selectChoice(Number(event.key) - 1)
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault()
        toggleFlag()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(active.index + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(active.index - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // Handlers close over the latest session snapshot. Rebinding when that snapshot changes is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, exam, active?.index, current?.id])

  const submitSession = () => {
    if (!exam || screen !== 'session') return
    const currentSession = exam.sessions[exam.session]
    if (currentSession.submitted) return
    const unanswered = currentSession.questionIds.filter((id) => currentSession.answers[id]?.choice == null).length
    if (unanswered > 0) {
      const proceed = window.confirm(
        `Submit session ${exam.session} with ${unanswered} unanswered? Unanswered items are scored incorrect, and you cannot return to them.`,
      )
      if (!proceed) return
    }
    const next: StoredMock = {
      ...exam,
      phase: exam.session === 1 ? 'break' : 'results',
      sessions: {
        ...exam.sessions,
        [exam.session]: { ...currentSession, submitted: true },
      },
    }
    setExam(next)
    setScreen(next.phase)
  }

  const startSession2 = () => {
    if (!exam) return
    const next: StoredMock = {
      ...exam,
      phase: 'session',
      session: 2,
      sessions: {
        ...exam.sessions,
        2: { ...exam.sessions[2], submitted: false, endsAt: Date.now() + MOCK_SESSION_MS, index: 0 },
      },
    }
    setExam(next)
    setScreen('session')
  }

  if (screen === 'loading') {
    return (
      <div className="wrap narrow">
        <p>Loading the mock…</p>
      </div>
    )
  }

  if (screen === 'intro') {
    return (
      <div className="wrap mock-intro">
        <p className="eyebrow">Level I · exam-day format</p>
        <h1>Mock exam</h1>
        <p className="lede">
          180 original three-choice items in two sessions of {MOCK_SESSION_SIZE}. Each session runs {MOCK_SESSION_MINUTES}:00.
          Answers and explanations stay hidden until both sessions are submitted.
        </p>
        <AllocationTable />
        <p className="fine">
          Counts are integers inside the 2026 topic weight ranges and sum to {MOCK_SESSION_SIZE} in each session. Questions are
          drawn from this bank without replacement. If a topic ever runs short, that session is filled from its other topics and
          the shortfall is shown on the session.
        </p>
        <p className="fine">
          Not affiliated with CFA Institute. These are original practice items, not a CFA Institute mock exam.
        </p>
        {error ? <p className="error">{error}</p> : null}
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={() => void startNew()}>
            {resumeOffer ? 'Start a new mock' : 'Begin session 1'}
          </button>
          {resumeOffer ? (
            <button type="button" className="button" onClick={() => void hydrate(resumeOffer)}>
              {resumeOffer.phase === 'break'
                ? 'Resume at the break'
                : resumeOffer.phase === 'session'
                  ? `Resume session ${resumeOffer.session}`
                  : 'Review last mock'}
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  if (screen === 'break' && exam) {
    return (
      <div className="wrap narrow">
        <p className="eyebrow">Optional break</p>
        <h1>Session 1 is submitted.</h1>
        <p className="lede">
          Session 2 is {MOCK_SESSION_SIZE} questions and {MOCK_SESSION_MINUTES}:00: Equity, Fixed Income, Derivatives, Alternatives,
          and Portfolio Management. The clock starts when you continue. Scores stay hidden until the full exam is submitted.
        </p>
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={startSession2}>
            Start session 2
          </button>
        </div>
        <p className="fine">You can leave this page. The break is saved in this browser.</p>
      </div>
    )
  }

  if (screen === 'results' && exam) {
    return (
      <Results
        exam={exam}
        bank={bank}
        onReview={(filter) => {
          const next = { ...exam, phase: 'review' as const, reviewFilter: filter }
          setExam(next)
          setScreen('review')
        }}
        onNew={() => {
          clearMock()
          setResumeOffer(null)
          setExam(null)
          setScreen('intro')
        }}
      />
    )
  }

  if (screen === 'review' && exam) {
    return (
      <Review
        exam={exam}
        bank={bank}
        onFilter={(filter) => setExam({ ...exam, reviewFilter: filter })}
        onBack={() => {
          setExam({ ...exam, phase: 'results' })
          setScreen('results')
        }}
      />
    )
  }

  if (screen !== 'session' || !exam || !active || !current) {
    return (
      <div className="wrap narrow">
        <p>This mock could not be restored.</p>
        <button
          type="button"
          className="button"
          onClick={() => {
            clearMock()
            setExam(null)
            setScreen('intro')
          }}
        >
          Back
        </button>
      </div>
    )
  }

  const remaining = active.endsAt === null ? MOCK_SESSION_MS : Math.max(0, active.endsAt - now)
  const urgent = remaining <= 5 * 60 * 1000
  const picked = active.answers[current.id]?.choice ?? null
  const flagged = active.answers[current.id]?.flagged ?? false
  const answeredCount = active.questionIds.filter((id) => active.answers[id]?.choice != null).length
  const flaggedCount = active.questionIds.filter((id) => active.answers[id]?.flagged).length

  return (
    <div className="wrap mock-session">
      <div className="mock-toolbar">
        <p>
          Session {exam.session}
          <span className="dot"> · </span>
          {topicShort(current.topicId)}
          <span className="dot"> · </span>
          {answeredCount}/{active.questionIds.length} answered
        </p>
        <p className={urgent ? 'mock-timer urgent' : 'mock-timer'} role="timer" aria-label={`${formatExamClock(remaining)} remaining`}>
          {formatExamClock(remaining)}
        </p>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (window.confirm('Discard this mock? The timer and answers will be deleted.')) {
              skipResume.current = true
              clearMock()
              setResumeOffer(null)
              setExam(null)
              setScreen('intro')
            }
          }}
        >
          Discard
        </button>
      </div>
      {active.shortfalls.length > 0 ? (
        <p className="fine">{active.shortfalls.join(' ')}</p>
      ) : null}
      <div className="mock-layout">
        <div>
          <p className="eyebrow">
            Question {active.index + 1} of {active.questionIds.length}
          </p>
          <div className="stem">
            <RichText text={current.stem} />
          </div>
          <fieldset className="choices">
            <legend className="sr-only">Answer choices</legend>
            {current.choices.map((choice, choiceIndex) => {
              const className = ['choice', picked === choiceIndex ? 'picked' : ''].filter(Boolean).join(' ')
              return (
                <label key={choice} className={className}>
                  <input
                    type="radio"
                    name={`mock-${current.id}`}
                    checked={picked === choiceIndex}
                    onChange={() => selectChoice(choiceIndex)}
                  />
                  <span className="letter">{LETTERS[choiceIndex]}</span>
                  <span>{choice}</span>
                </label>
              )
            })}
          </fieldset>
          <div className="session-actions">
            <button type="button" className="button" onClick={() => goTo(active.index - 1)} disabled={active.index === 0}>
              Previous
            </button>
            <button
              type="button"
              className="button"
              onClick={() => goTo(active.index + 1)}
              disabled={active.index >= active.questionIds.length - 1}
            >
              Next
            </button>
            <button type="button" className={flagged ? 'button flagged' : 'button'} onClick={toggleFlag} aria-pressed={flagged}>
              {flagged ? 'Flagged' : 'Flag'}
            </button>
            <button type="button" className="button primary" onClick={submitSession}>
              Submit session
            </button>
          </div>
          <p className="fine">Keys 1–3 select. F flags. Arrow keys move. The clock keeps running if you leave.</p>
        </div>
        <aside className="mock-nav-wrap">
          <button type="button" className="text-button" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen}>
            {navOpen ? 'Hide' : 'Show'} questions ({flaggedCount} flagged)
          </button>
          {navOpen ? (
            <div className="mock-nav" role="navigation" aria-label="Question navigator">
              {active.questionIds.map((id, index) => {
                const answer = active.answers[id]
                const question = bank.get(id)
                const className = [
                  'nav-q',
                  index === active.index ? 'current' : '',
                  answer?.choice != null ? 'answered' : '',
                  answer?.flagged ? 'flagged' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={id}
                    type="button"
                    className={className}
                    aria-current={index === active.index ? 'true' : undefined}
                    onClick={() => goTo(index)}
                  >
                    <span className="sr-only">{question ? topicShort(question.topicId) : 'Question'} </span>
                    {index + 1}
                  </button>
                )
              })}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function AllocationTable() {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Session</th>
            <th>Topic</th>
            <th>Questions</th>
            <th>Share of 180</th>
            <th>2026 weight</th>
          </tr>
        </thead>
        <tbody>
          {TOPICS.map((topic) => {
            const count = MOCK_ALLOCATION[topic.id]
            return (
              <tr key={topic.id}>
                <td>{topic.session}</td>
                <td>{topic.name}</td>
                <td>{count}</td>
                <td>{mockWeightPercent(count).toFixed(1)}%</td>
                <td>
                  {topic.weightMin}–{topic.weightMax}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Results({
  exam,
  bank,
  onReview,
  onNew,
}: {
  exam: StoredMock
  bank: Map<string, Question>
  onReview: (filter: StoredMock['reviewFilter']) => void
  onNew: () => void
}) {
  const sessionOne = questionsFor(exam.sessions[1].questionIds, bank)
  const sessionTwo = questionsFor(exam.sessions[2].questionIds, bank)
  const all = [...sessionOne, ...sessionTwo]
  const answers = { ...exam.sessions[1].answers, ...exam.sessions[2].answers }
  const overall = all.filter((question) => answers[question.id]?.choice === question.correctIndex).length
  const first = sessionOne.filter((question) => answers[question.id]?.choice === question.correctIndex).length
  const second = sessionTwo.filter((question) => answers[question.id]?.choice === question.correctIndex).length
  const byTopic = new Map<TopicId, { correct: number; total: number }>()
  for (const question of all) {
    const row = byTopic.get(question.topicId) ?? { correct: 0, total: 0 }
    row.total += 1
    if (answers[question.id]?.choice === question.correctIndex) row.correct += 1
    byTopic.set(question.topicId, row)
  }
  return (
    <div className="wrap narrow">
      <p className="eyebrow">Mock complete</p>
      <h1>
        {overall} / {all.length} correct
      </h1>
      <p className="lede">{all.length === 0 ? 'No items were on this exam.' : `${Math.round((overall / all.length) * 100)}% overall. Unanswered items are incorrect.`}</p>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Correct</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Session 1</td>
            <td>
              {first} / {sessionOne.length}
            </td>
          </tr>
          <tr>
            <td>Session 2</td>
            <td>
              {second} / {sessionTwo.length}
            </td>
          </tr>
          {TOPICS.map((topic) => {
            const row = byTopic.get(topic.id)
            if (!row) return null
            return (
              <tr key={topic.id}>
                <td>
                  {topicName(topic.id)} <span className="muted">session {topic.session}</span>
                </td>
                <td>
                  {row.correct} / {row.total}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="hero-actions">
        <button type="button" className="button primary" onClick={() => onReview('all')}>
          Review with explanations
        </button>
        <button type="button" className="button" onClick={() => onReview('missed')}>
          Missed only
        </button>
        <button type="button" className="button" onClick={() => onReview('flagged')}>
          Flagged
        </button>
        <button type="button" className="button ghost" onClick={onNew}>
          New mock
        </button>
      </div>
    </div>
  )
}

function Review({
  exam,
  bank,
  onFilter,
  onBack,
}: {
  exam: StoredMock
  bank: Map<string, Question>
  onFilter: (filter: StoredMock['reviewFilter']) => void
  onBack: () => void
}) {
  const items = [
    ...questionsFor(exam.sessions[1].questionIds, bank).map((question) => ({ question, session: 1 as const })),
    ...questionsFor(exam.sessions[2].questionIds, bank).map((question) => ({ question, session: 2 as const })),
  ]
  const answers = { ...exam.sessions[1].answers, ...exam.sessions[2].answers }
  const visible = items.filter(({ question }) => {
    const answer = answers[question.id]
    if (exam.reviewFilter === 'missed') return answer?.choice !== question.correctIndex
    if (exam.reviewFilter === 'flagged') return Boolean(answer?.flagged)
    return true
  })
  return (
    <div className="wrap narrow">
      <button type="button" className="text-button" onClick={onBack}>
        Back to score
      </button>
      <h1>Review</h1>
      <div className="hero-actions">
        {(['all', 'missed', 'flagged'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className={exam.reviewFilter === filter ? 'button primary' : 'button'}
            onClick={() => onFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p>Nothing in this filter.</p> : null}
      {visible.map(({ question, session }) => {
        const answer = answers[question.id]
        const yours = answer?.choice
        return (
          <article key={question.id} className="review-card">
            <p className="eyebrow">
              Session {session} · {topicName(question.topicId)} · {losTitle(question.losIds[0] ?? '')}
              {question.ethicsStandard ? ` · ${question.ethicsStandard}` : ''}
            </p>
            <RichText text={question.stem} />
            {question.hardTopicHelp ? <HelpCard help={question.hardTopicHelp} /> : null}
            <ol className="review-choices">
              {question.choices.map((choice, index) => {
                const mark = index === question.correctIndex ? 'Correct' : yours === index ? 'Your answer' : ''
                return (
                  <li key={choice} className={index === question.correctIndex ? 'is-correct' : yours === index ? 'is-wrong' : ''}>
                    <strong>{LETTERS[index]}.</strong> {choice}
                    {mark ? <em> {mark}</em> : null}
                  </li>
                )
              })}
            </ol>
            <RichText text={question.explanation} />
          </article>
        )
      })}
    </div>
  )
}
