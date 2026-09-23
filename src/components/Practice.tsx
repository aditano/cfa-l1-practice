import { useEffect, useMemo, useState } from 'react'
import { TOPICS } from '../curriculum'
import { loadTopics } from '../lib/bank'
import { drawQuestions, matchingQuestions, type Filters } from '../lib/select'
import {
  clearSession,
  latestAttempts,
  loadAttempts,
  clearStickyPreset,
  loadSession,
  peekPresetIds,
  recordAttempt,
  saveSession,
  type StoredSession,
} from '../lib/storage'
import type { Difficulty, Question, TopicId } from '../types'
import { HelpCard } from './HelpCard'
import { RichText } from './RichText'

const ALL_LOS = TOPICS.flatMap((topic) => topic.los.map((los) => los.id))
const LOS_TOPIC = new Map<string, TopicId>(
  TOPICS.flatMap((topic) => topic.los.map((los) => [los.id, topic.id] as const)),
)
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

type Phase = 'setup' | 'loading' | 'session' | 'results' | 'review'

function defaultFilters(losIds = ALL_LOS): Filters {
  return { losIds, difficulties: [...DIFFICULTIES], count: 10, shuffle: true, unseenOnly: false }
}

function topicName(id: TopicId): string {
  return TOPICS.find((topic) => topic.id === id)?.shortName ?? id
}

function losTitle(id: string): string {
  for (const topic of TOPICS) {
    const los = topic.los.find((item) => item.id === id)
    if (los) return los.title
  }
  return id
}

export function Practice() {
  const presetIds = peekPresetIds()
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(presetIds ?? ALL_LOS))
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<Record<string, { choice: number; correct: boolean }>>({})
  const [error, setError] = useState('')
  const [poolSize, setPoolSize] = useState<number | null>(null)

  useEffect(() => {
    if (presetIds) return
    const stored = loadSession()
    if (!stored || stored.questionIds.length === 0) return
    const topicIds = [...new Set(stored.questionIds.map((id) => id.split('-')[0]))]
    const ids = TOPICS.filter((topic) => topicIds.includes(topic.code)).map((topic) => topic.id)
    if (ids.length === 0) return
    setPhase('loading')
    loadTopics(ids)
      .then((bank) => {
        const byId = new Map(bank.map((question) => [question.id, question]))
        const restored = stored.questionIds.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question))
        if (restored.length !== stored.questionIds.length) {
          clearSession()
          setPhase('setup')
          return
        }
        const nextAnswers: Record<string, { choice: number; correct: boolean }> = {}
        for (const answer of stored.answers) nextAnswers[answer.id] = { choice: answer.choice, correct: answer.correct }
        setQuestions(restored)
        setAnswers(nextAnswers)
        setIndex(Math.min(stored.index, restored.length - 1))
        setRevealed(stored.revealed)
        const current = restored[Math.min(stored.index, restored.length - 1)]
        const existing = current ? nextAnswers[current.id] : undefined
        setPicked(existing ? existing.choice : null)
        setPhase(stored.phase)
      })
      .catch(() => {
        clearSession()
        setPhase('setup')
      })
  }, [])

  useEffect(() => {
    if (phase !== 'session' && phase !== 'results' && phase !== 'review') return
    const payload: StoredSession = {
      questionIds: questions.map((question) => question.id),
      index,
      answers: Object.entries(answers).map(([id, answer]) => ({ id, choice: answer.choice, correct: answer.correct })),
      revealed,
      phase: phase === 'review' ? 'review' : phase,
    }
    saveSession(payload)
  }, [phase, questions, index, answers, revealed])

  const selectedTopics = useMemo(() => {
    const ids = new Set<TopicId>()
    for (const losId of filters.losIds) {
      const topicId = LOS_TOPIC.get(losId)
      if (topicId) ids.add(topicId)
    }
    return [...ids]
  }, [filters.losIds])

  const previewPool = () => {
    setError('')
    if (selectedTopics.length === 0) {
      setPoolSize(0)
      return
    }
    loadTopics(selectedTopics)
      .then((bank) => {
        const seen = new Set(latestAttempts(loadAttempts()).keys())
        setPoolSize(matchingQuestions(bank, filters, seen).length)
      })
      .catch(() => setError('The question files could not be loaded.'))
  }

  useEffect(() => {
    previewPool()
    // Recount when the filter identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.losIds.join('|'), filters.difficulties.join('|'), filters.unseenOnly])

  const start = () => {
    setError('')
    if (selectedTopics.length === 0) {
      setError('Select at least one learning module.')
      return
    }
    setPhase('loading')
    loadTopics(selectedTopics)
      .then((bank) => {
        const seen = new Set(latestAttempts(loadAttempts()).keys())
        const drawn = drawQuestions(bank, filters, seen)
        if (drawn.length === 0) {
          setPhase('setup')
          setError('No questions match these filters.')
          return
        }
        setQuestions(drawn)
        setIndex(0)
        setPicked(null)
        setRevealed(false)
        setAnswers({})
        clearStickyPreset()
        setPhase('session')
      })
      .catch(() => {
        setPhase('setup')
        setError('The question files could not be loaded.')
      })
  }

  const current = questions[index]
  const score = Object.values(answers)
  const correctCount = score.filter((answer) => answer.correct).length

  const submit = () => {
    if (!current || picked === null || revealed) return
    const correct = picked === current.correctIndex
    const next = { ...answers, [current.id]: { choice: picked, correct } }
    setAnswers(next)
    setRevealed(true)
    recordAttempt({ id: current.id, topicId: current.topicId, correct, at: Date.now() })
  }

  const goNext = () => {
    if (index + 1 >= questions.length) {
      setPhase('results')
      return
    }
    const nextIndex = index + 1
    const nextQuestion = questions[nextIndex]
    const existing = nextQuestion ? answers[nextQuestion.id] : undefined
    setIndex(nextIndex)
    setPicked(existing ? existing.choice : null)
    setRevealed(Boolean(existing))
  }

  useEffect(() => {
    if (phase !== 'session') return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === '1' || event.key === '2' || event.key === '3') {
        if (!revealed) setPicked(Number(event.key) - 1)
      }
      if (event.key === 'Enter') {
        if (!revealed) submit()
        else goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const toggleLos = (losId: string) => {
    clearStickyPreset()
    setFilters((currentFilters) => {
      const has = currentFilters.losIds.includes(losId)
      const losIds = has ? currentFilters.losIds.filter((id) => id !== losId) : [...currentFilters.losIds, losId]
      return { ...currentFilters, losIds }
    })
  }

  const toggleTopic = (topicId: TopicId) => {
    clearStickyPreset()
    const losIds = TOPICS.find((topic) => topic.id === topicId)?.los.map((los) => los.id) ?? []
    setFilters((currentFilters) => {
      const allOn = losIds.every((id) => currentFilters.losIds.includes(id))
      const next = new Set(currentFilters.losIds)
      for (const id of losIds) {
        if (allOn) next.delete(id)
        else next.add(id)
      }
      return { ...currentFilters, losIds: [...next] }
    })
  }

  if (phase === 'loading') {
    return (
      <div className="wrap narrow">
        <p>Loading questions…</p>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <div className="wrap practice-setup">
        <header className="page-head">
          <h1>Build a set</h1>
          <p>Choose topics and modules. A module that is off is excluded.</p>
        </header>
        <div className="setup-grid">
          <div className="topic-list">
            {TOPICS.map((topic) => {
              const losIds = topic.los.map((los) => los.id)
              const selectedCount = losIds.filter((id) => filters.losIds.includes(id)).length
              return (
                <fieldset key={topic.id} className="topic-block">
                  <legend>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedCount === losIds.length}
                        ref={(node) => {
                          if (node) node.indeterminate = selectedCount > 0 && selectedCount < losIds.length
                        }}
                        onChange={() => toggleTopic(topic.id)}
                      />
                      <span>
                        {topic.name}
                        <small>
                          {topic.weightMin}–{topic.weightMax}% · session {topic.session}
                          {topic.hard ? ' · extra help' : ''}
                        </small>
                      </span>
                    </label>
                  </legend>
                  <ul>
                    {topic.los.map((los) => (
                      <li key={los.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={filters.losIds.includes(los.id)}
                            onChange={() => toggleLos(los.id)}
                          />
                          <span>{los.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )
            })}
          </div>
          <aside className="setup-panel">
            <label>
              Questions
              <select
                value={filters.count}
                onChange={(event) => setFilters({ ...filters, count: Number(event.target.value) })}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={0}>All matches</option>
              </select>
            </label>
            <fieldset>
              <legend>Difficulty</legend>
              {DIFFICULTIES.map((difficulty) => (
                <label key={difficulty}>
                  <input
                    type="checkbox"
                    checked={filters.difficulties.includes(difficulty)}
                    onChange={() => {
                      const has = filters.difficulties.includes(difficulty)
                      const difficulties = has
                        ? filters.difficulties.filter((item) => item !== difficulty)
                        : [...filters.difficulties, difficulty]
                      setFilters({ ...filters, difficulties })
                    }}
                  />
                  {difficulty}
                </label>
              ))}
            </fieldset>
            <label className="check-row">
              <input
                type="checkbox"
                checked={filters.shuffle}
                onChange={(event) => setFilters({ ...filters, shuffle: event.target.checked })}
              />
              Shuffle question order
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={filters.unseenOnly}
                onChange={(event) => setFilters({ ...filters, unseenOnly: event.target.checked })}
              />
              Unseen questions only
            </label>
            <p className="pool-count">{poolSize === null ? 'Counting…' : `${poolSize} questions match`}</p>
            {error ? <p className="error">{error}</p> : null}
            <button type="button" className="button primary" onClick={start}>
              Start
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                clearStickyPreset()
                setFilters(defaultFilters())
              }}
            >
              Reset filters
            </button>
          </aside>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const byTopic = new Map<TopicId, { correct: number; total: number }>()
    for (const question of questions) {
      const answer = answers[question.id]
      if (!answer) continue
      const row = byTopic.get(question.topicId) ?? { correct: 0, total: 0 }
      row.total += 1
      if (answer.correct) row.correct += 1
      byTopic.set(question.topicId, row)
    }
    const answered = score.length
    const misses = questions.filter((question) => answers[question.id] && !answers[question.id].correct)
    return (
      <div className="wrap narrow">
        <p className="eyebrow">Set complete</p>
        <h1>
          {correctCount} / {answered} correct
        </h1>
        <p className="lede">{answered === 0 ? 'No items were submitted.' : `${Math.round((correctCount / answered) * 100)}% on this set.`}</p>
        <table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Correct</th>
            </tr>
          </thead>
          <tbody>
            {[...byTopic.entries()].map(([topicId, row]) => (
              <tr key={topicId}>
                <td>{topicName(topicId)}</td>
                <td>
                  {row.correct} / {row.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="hero-actions">
          {misses.length > 0 ? (
            <button type="button" className="button primary" onClick={() => setPhase('review')}>
              Review {misses.length} missed
            </button>
          ) : null}
          <button type="button" className="button" onClick={() => { clearSession(); setPhase('setup') }}>
            New set
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'review') {
    const misses = questions.filter((question) => answers[question.id] && !answers[question.id].correct)
    return (
      <div className="wrap narrow">
        <button type="button" className="text-button" onClick={() => setPhase('results')}>
          Back to score
        </button>
        <h1>Missed items</h1>
        {misses.map((question) => {
          const answer = answers[question.id]
          return (
            <article key={question.id} className="review-card">
              <p className="eyebrow">
                {topicName(question.topicId)} · {losTitle(question.losIds[0] ?? '')}
                {question.ethicsStandard ? ` · ${question.ethicsStandard}` : ''}
              </p>
              <RichText text={question.stem} />
              {question.hardTopicHelp ? <HelpCard help={question.hardTopicHelp} /> : null}
              <p>
                Your answer: {answer ? question.choices[answer.choice] : '—'}. Correct:{' '}
                {question.choices[question.correctIndex]}.
              </p>
              <RichText text={question.explanation} />
            </article>
          )
        })}
      </div>
    )
  }

  if (!current) {
    return (
      <div className="wrap narrow">
        <p>This set is empty.</p>
      </div>
    )
  }

  const letters = ['A', 'B', 'C'] as const
  return (
    <div className="wrap narrow session">
      <div className="session-meta">
        <p>
          Question {index + 1} of {questions.length}
          <span className="dot"> · </span>
          {correctCount}/{score.length} correct
        </p>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (score.length === 0) {
              clearSession()
              setPhase('setup')
              return
            }
            setPhase('results')
          }}
        >
          End set
        </button>
      </div>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="eyebrow">
        {topicName(current.topicId)} · {losTitle(current.losIds[0] ?? '')} · {current.difficulty}
        {current.ethicsStandard ? ` · Standard ${current.ethicsStandard}` : ''}
      </p>
      <div className="stem">
        <RichText text={current.stem} />
      </div>
      {current.hardTopicHelp ? <HelpCard help={current.hardTopicHelp} /> : null}
      <fieldset className="choices" disabled={false}>
        <legend className="sr-only">Answer choices</legend>
        {current.choices.map((choice, choiceIndex) => {
          const showCorrect = revealed && choiceIndex === current.correctIndex
          const showWrong = revealed && picked === choiceIndex && choiceIndex !== current.correctIndex
          const className = ['choice', picked === choiceIndex ? 'picked' : '', showCorrect ? 'is-correct' : '', showWrong ? 'is-wrong' : '']
            .filter(Boolean)
            .join(' ')
          return (
            <label key={choice} className={className}>
              <input
                type="radio"
                name="choice"
                checked={picked === choiceIndex}
                onChange={() => {
                  if (!revealed) setPicked(choiceIndex)
                }}
              />
              <span className="letter">{letters[choiceIndex]}</span>
              <span>{choice}</span>
              {showCorrect ? <em>Correct</em> : null}
              {showWrong ? <em>Your answer</em> : null}
            </label>
          )
        })}
      </fieldset>
      <div className="session-actions">
        {!revealed ? (
          <button type="button" className="button primary" disabled={picked === null} onClick={submit}>
            Submit
          </button>
        ) : (
          <button type="button" className="button primary" onClick={goNext}>
            {index + 1 >= questions.length ? 'See score' : 'Next'}
          </button>
        )}
        <p className="fine">Keys 1–3 select. Enter submits or continues.</p>
      </div>
      {revealed ? (
        <section className="explanation" aria-live="polite">
          <h2>{picked === current.correctIndex ? 'Correct' : 'Not this one'}</h2>
          {current.ethicsStandard ? <p className="standard-tag">Standard {current.ethicsStandard}</p> : null}
          <RichText text={current.explanation} />
        </section>
      ) : null}
    </div>
  )
}
