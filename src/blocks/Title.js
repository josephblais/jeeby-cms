// src/blocks/Title.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships), 2.4.6 (Headings and Labels)
// h1 is reserved for the page-level title — Title blocks are restricted to h2–h6.
// Consumers configure heading level via block.data.level in Firestore.
//
// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway,
// so the dist output is correct.

import { createElement } from 'react'
import { resolveLocale } from '../utils/resolveLocale.js'

const VALID_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6']

// Normalize heading level:
//   'h1' → 'h2' (explicit fallback — h1 is reserved for the page title)
//   Any level in VALID_LEVELS → use as-is
//   Anything else (undefined, 'span', 'invalid') → 'h3' (default)
const normalizeLevel = (l) => l === 'h1' ? 'h2' : (VALID_LEVELS.includes(l) ? l : 'h3')

export function Title({ data, className, locale = 'en' }) {
  const tag = normalizeLevel(data?.level)
  return createElement(tag, { className }, resolveLocale(data?.text, locale))
}
