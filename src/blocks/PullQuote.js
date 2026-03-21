// src/blocks/PullQuote.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships) — uses semantic <figure>,
// <blockquote>, and <figcaption> to convey structure to assistive technologies.
//
// <cite> is intentionally omitted around the attribution: per HTML living
// standard §4.5.6, <cite> wraps titles of creative works, not person names.
// <figcaption> provides the semantic association without spec violation.
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported
// directly by the Node.js test runner without a JSX transform.

import { createElement } from 'react'

export function PullQuote({ data, className }) {
  const quote = data?.quote ?? ''
  const attribution = data?.attribution ?? ''
  if (!quote) return null
  return createElement(
    'figure',
    { className },
    createElement('blockquote', null, createElement('p', null, quote)),
    attribution ? createElement('figcaption', null, attribution) : null
  )
}
