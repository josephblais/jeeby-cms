// src/blocks/Title.js
// ACCESSIBILITY: WCAG 1.3.1 (Info and Relationships), 2.4.6 (Headings and Labels)
// h1 is reserved for the page-level title — Title blocks are restricted to h2–h6.
// Consumers configure heading level via block.data.level in Firestore.

const VALID_LEVELS = ['h2', 'h3', 'h4', 'h5', 'h6']

// Normalize heading level:
//   'h1' → 'h2' (explicit fallback — h1 is reserved for the page title)
//   Any level in VALID_LEVELS → use as-is
//   Anything else (undefined, 'span', 'invalid') → 'h3' (default)
const normalizeLevel = (l) => l === 'h1' ? 'h2' : (VALID_LEVELS.includes(l) ? l : 'h3')

export function Title({ data, className }) {
  const Tag = normalizeLevel(data?.level)
  return <Tag className={className}>{data?.text}</Tag>
}
