// src/blocks/RichText.js
// ACCESSIBILITY: WCAG 1.1.1 (preserve alt on images), 1.3.1 (preserve semantic structure),
// 4.1.1 (valid HTML after sanitization)
//
// Sanitization strategy:
//   Browser (client): DOMPurify (peer dep) — full, spec-compliant sanitization.
//   Server (SSR): stripDangerous() — regex strip of <script>, event handlers, javascript: hrefs.
//     SSR fallback is needed because Next.js SSR renders "use client" components on the server
//     where there is no DOM and DOMPurify cannot initialize. We cannot skip SSR sanitization —
//     script tags in SSR HTML execute in the browser before React hydrates.
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

// Server-side sanitization fallback used during SSR when DOMPurify is unavailable.
// Strips the highest-risk vectors: script blocks, inline event handlers, javascript: hrefs.
// Not as thorough as DOMPurify but prevents execution of injected scripts in SSR HTML.
function stripDangerous(html) {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""')
}

export function RichText({ data, className }) {
  const raw = data?.html ?? ''
  const clean = typeof DOMPurify?.sanitize === 'function'
    ? DOMPurify.sanitize(raw, DOMPURIFY_CONFIG)
    : stripDangerous(raw)
  // Use a div wrapper because rich text can contain block-level elements (p, ul, h2, etc.).
  // A <p> wrapper would be invalid HTML if the sanitized content includes block elements.
  return createElement('div', { className, dangerouslySetInnerHTML: { __html: clean } })
}
