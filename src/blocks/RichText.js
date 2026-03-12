// src/blocks/RichText.js
// ACCESSIBILITY: WCAG 1.1.1 (preserve alt on images), 1.3.1 (preserve semantic structure),
// 4.1.1 (valid HTML after sanitization)
//
// dompurify is a peer dependency (browser-only).
// This package is "use client" — RichText never runs on the server, so the browser-only
// dompurify package is correct. isomorphic-dompurify was replaced because its jsdom
// dependency has an ESM/CJS conflict in Node 22 that breaks Next.js server-side imports.
//
// DOMPurify configuration:
//   ADD_ATTR includes aria-* attributes so accessible authored HTML is preserved.
//   DOMPurify preserves alt attributes on <img> by default.

// NOTE: Written with React.createElement (not JSX) so this file can be imported directly by
// the Node.js test runner without a JSX transform. TSUP compiles it with JSX enabled anyway,
// so the dist output is correct.

import { createElement } from 'react'
import DOMPurify from 'dompurify'

const DOMPURIFY_CONFIG = {
  // Preserve ARIA attributes so admin-authored HTML stays accessible.
  // Without ADD_ATTR, DOMPurify strips aria-* and role attributes by default.
  ADD_ATTR: ['aria-label', 'aria-describedby', 'aria-labelledby', 'role', 'tabindex'],
}

export function RichText({ data, className }) {
  const clean = DOMPurify.sanitize(data?.html ?? '', DOMPURIFY_CONFIG)
  // Use a div wrapper because rich text can contain block-level elements (p, ul, h2, etc.).
  // A <p> wrapper would be invalid HTML if the sanitized content includes block elements.
  return createElement('div', { className, dangerouslySetInnerHTML: { __html: clean } })
}
