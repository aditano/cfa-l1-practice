import { useState } from 'react'
import { TOPICS } from '../curriculum'
import { clearAttempts, latestAttempts, loadAttempts, savePreset } from '../lib/storage'

export function ProgressPage() {
  const [attempts, setAttempts] = useState(loadAttempts)
  const latest = latestAttempts(attempts)
  const rows = TOPICS.map((topic) => {
    const items = [...latest.values()].filter((attempt) => attempt.topicId === topic.id)
    const correct = items.filter((attempt) => attempt.correct).length
    return { topic, seen: items.length, correct }
  })
  const seen = latest.size
  const correct = [...latest.values()].filter((attempt) => attempt.correct).length
  return (
    <div className="wrap narrow">
      <header className="page-head">
        <h1>Progress on this browser</h1>
        <p>
          {seen === 0
            ? 'Finish a set and the latest result for each question will show up here.'
            : `${correct} of ${seen} distinct questions last answered correctly (${Math.round((correct / seen) * 100)}%). ${attempts.length} submissions in total.`}
        </p>
      </header>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Seen</th>
            <th>Latest accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.topic.id}>
              <td>{row.topic.shortName}</td>
              <td>
                {row.seen}
                <span className="muted"> / {row.topic.bankTarget}</span>
              </td>
              <td>
                {row.seen === 0 ? '—' : `${Math.round((row.correct / row.seen) * 100)}%`}
                <span className="bar" aria-hidden="true">
                  <i style={{ width: row.seen === 0 ? '0%' : `${(row.correct / row.seen) * 100}%` }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.some((row) => row.seen >= 5 && row.correct / row.seen < 0.7) ? (
        <button
          type="button"
          className="button"
          onClick={() => {
            const weak = rows.filter((row) => row.seen >= 5 && row.correct / row.seen < 0.7)
            savePreset({
              losIds: weak.flatMap((row) => row.topic.los.map((los) => los.id)),
              label: 'Lower-accuracy topics',
            })
            window.location.hash = '#/practice'
          }}
        >
          Practice lower-accuracy topics
        </button>
      ) : null}
      <button
        type="button"
        className="button ghost"
        onClick={() => {
          if (window.confirm('Erase saved results on this browser?')) {
            clearAttempts()
            setAttempts([])
          }
        }}
      >
        Reset progress
      </button>
    </div>
  )
}
