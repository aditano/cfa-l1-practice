import type { HardTopicHelp } from '../types'

export function HelpCard({ help }: { help: HardTopicHelp }) {
  return (
    <details className="help-card" open>
      <summary>Extra help for this module</summary>
      <p>{help.blurb}</p>
      <p>
        <a href={help.youtubeUrl} target="_blank" rel="noreferrer">
          {help.youtubeTitle}
        </a>
        <span className="muted"> · {help.channel} on YouTube</span>
      </p>
      <p className="fine">Third-party lesson. This site and CFA Institute do not produce that video.</p>
    </details>
  )
}
