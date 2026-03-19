// src/blocks/List.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships)
// Uses semantic <ul>/<ol> with <li> — conveying list structure to screen readers natively.
// data.ordered controls element type; data.items is an array of strings.
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway,
// so the dist output is correct.

import { createElement } from 'react'

export function List({ data, className }) {
  const items = data?.items ?? []
  if (!items.length) return null
  const tag = data?.ordered ? 'ol' : 'ul'
  return createElement(
    tag,
    { className },
    ...items.map((item, i) => createElement('li', { key: i }, item))
  )
}
