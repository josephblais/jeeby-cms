// src/blocks/Paragraph.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships)
// Always use <p> — never <div> or <span> for paragraph content.
// Native <p> semantics convey paragraph structure to screen readers without ARIA.
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway,
// so the dist output is correct.

import { createElement } from 'react'
import { resolveLocale } from '../utils/resolveLocale.js'

export function Paragraph({ data, className, locale = 'en' }) {
  return createElement('p', { className }, resolveLocale(data?.text, locale))
}
