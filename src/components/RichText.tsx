import katex from 'katex'
import { Fragment } from 'react'

const TOKEN = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g

function renderMath(token: string, key: number) {
  const display = token.startsWith('\\[')
  const expr = token.slice(2, -2)
  const html = katex.renderToString(expr, { throwOnError: false, displayMode: display })
  return (
    <span
      key={key}
      className={display ? 'math-block' : 'math-inline'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function renderInline(text: string) {
  const parts = text.split(TOKEN)
  return parts.map((part, index) => {
    if (part.startsWith('\\(') || part.startsWith('\\[')) return renderMath(part, index)
    return <Fragment key={index}>{part}</Fragment>
  })
}

export function RichText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <div className="rich">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={paragraph.startsWith('Best answer:') ? 'best-answer' : undefined}>
          {renderInline(paragraph)}
        </p>
      ))}
    </div>
  )
}
