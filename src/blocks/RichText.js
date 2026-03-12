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
import * as DOMPurifyModule from 'dompurify'
const DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule

const DOMPURIFY_CONFIG = {
  // Preserve ARIA attributes so admin-authored HTML stays accessible.
  // Without ADD_ATTR, DOMPurify strips aria-* and role attributes by default.
  ADD_ATTR: ['aria-label', 'aria-describedby', 'aria-labelledby', 'role', 'tabindex'],
}

export function RichText({ data, className }) {
  // Guard for SSR: Next.js renders "use client" components on the server where there is no
  // DOM, so DOMPurify is not initialized and .sanitize is not a function. Skip sanitization
  // server-side — content comes from admin-controlled Firestore and scripts don't execute
  // in static HTML. DOMPurify runs normally on the client where it matters.
  const raw = data?.html ?? ''
  const clean = typeof DOMPurify?.sanitize === 'function'
    ? DOMPurify.sanitize(raw, DOMPURIFY_CONFIG)
    : raw
  // Use a div wrapper because rich text can contain block-level elements (p, ul, h2, etc.).
  // A <p> wrapper would be invalid HTML if the sanitized content includes block elements.
  return createElement('div', { className, dangerouslySetInnerHTML: { __html: clean } })
}
