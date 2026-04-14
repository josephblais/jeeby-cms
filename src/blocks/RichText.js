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

import { createElement, useState, useEffect } from 'react'
import { resolveLocale } from '../utils/resolveLocale.js'
import * as DOMPurifyModule from 'dompurify'
const DOMPurify = DOMPurifyModule.default ?? DOMPurifyModule

const DOMPURIFY_CONFIG = {
  // Preserve ARIA attributes so admin-authored HTML stays accessible.
  // Without ADD_ATTR, DOMPurify strips aria-* and role attributes by default.
  ADD_ATTR: ['aria-label', 'aria-describedby', 'aria-labelledby', 'role', 'tabindex'],
}

// Lightweight SSR-safe strip for the initial render (server + first client paint).
// Removes the highest-risk vectors so SSR HTML is safe before DOMPurify takes over.
//
// TODO: The right fix is sanitizing RichText HTML on admin input before writing to Firestore,
// so untrusted HTML never reaches the renderer at all. This is defense-in-depth only.
function stripDangerous(html) {
  if (!html) return ''
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""')
}

export function RichText({ data, className, locale = 'en' }) {
  const raw = resolveLocale(data?.html, locale) ?? ''

  // SSR + first client paint: use stripDangerous so server and client produce identical HTML
  // (no hydration mismatch). typeof window / DOMPurify.sanitize checks are unreliable in
  // Next.js because window is polyfilled server-side and dompurify exports a stub that
  // returns input unchanged without a real DOM.
  // After mount: upgrade to full DOMPurify sanitization in the browser.
  const [clean, setClean] = useState(() => stripDangerous(raw))

  useEffect(() => {
    if (typeof DOMPurify?.sanitize === 'function') {
      setClean(DOMPurify.sanitize(raw, DOMPURIFY_CONFIG))
    }
  }, [raw])

  // Use a div wrapper because rich text can contain block-level elements (p, ul, h2, etc.).
  // A <p> wrapper would be invalid HTML if the sanitized content includes block elements.
  return createElement('div', { className, dangerouslySetInnerHTML: { __html: clean } })
}
