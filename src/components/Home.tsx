import { CURRICULUM_SOURCES, TOPICS } from '../curriculum'
import manifest from '../data/manifest.json'
import { clearStickyPreset, savePreset } from '../lib/storage'
import type { RouteName } from './Header'

const counts = manifest.byTopic as Record<string, number>

export function Home({ go }: { go: (route: RouteName) => void }) {
  const total = manifest.total || TOPICS.reduce((sum, topic) => sum + topic.bankTarget, 0)
  const startHard = () => {
    const losIds = TOPICS.filter((topic) => topic.hard).flatMap((topic) => topic.los.map((los) => los.id))
    savePreset({ losIds, label: 'Hard topics' })
    go('practice')
  }
  return (
    <div className="wrap home">
      <section className="hero">
        <p className="eyebrow">Level I · 2026 curriculum map</p>
        <h1>Practice the ten topics, one learning module at a time.</h1>
        <p className="lede">
          {total.toLocaleString('en-US')} original three-choice items. Filter by topic and module, submit an answer,
          then read the worked explanation. Scores stay in this browser. No account.
        </p>
        <div className="hero-actions">
          <button type="button" className="button primary" onClick={() => { clearStickyPreset(); go('practice') }}>
            Start practice
          </button>
          <button type="button" className="button" onClick={startHard}>
            Hard topics
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Question bank and published weights</h2>
        <p className="muted">
          Counts are tilted toward Ethics and the heavier 2026 topics, and every share stays inside the published
          weight range. Module titles follow the public 2026 Level I topic outline.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Session</th>
                <th>Exam weight</th>
                <th>Questions</th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((topic) => {
                const count = counts[topic.id] ?? topic.bankTarget
                return (
                  <tr key={topic.id}>
                    <td>
                      {topic.name}
                      {topic.hard ? <span className="pill">Extra help</span> : null}
                    </td>
                    <td>{topic.session}</td>
                    <td>
                      {topic.weightMin}–{topic.weightMax}%
                    </td>
                    <td>{count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="fine">
          Weights:{' '}
          <a href={CURRICULUM_SOURCES.weights}>CFA Institute Level I exam page</a>. Module list:{' '}
          <a href={CURRICULUM_SOURCES.modules}>2026 Level I topic outlines (PDF)</a>.
        </p>
      </section>
      <section className="steps">
        <article>
          <h2>1. Filter</h2>
          <p>Select any mix of topics and learning modules. Leave a module off when you are not studying it.</p>
        </article>
        <article>
          <h2>2. Answer</h2>
          <p>Each item has stem and choices A, B, and C. The explanation, including the formula, appears after you submit.</p>
        </article>
        <article>
          <h2>3. Review</h2>
          <p>Score the set, reread misses, and track accuracy by topic. Quant, FSA, fixed income, derivatives, and portfolio items include a short primer and a public lesson video.</p>
        </article>
      </section>
    </div>
  )
}
